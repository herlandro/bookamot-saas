#!/usr/bin/env tsx
/**
 * Secure Database Cleanup Script for Production
 * 
 * This script performs a complete cleanup of all database tables while preserving:
 * - Admin users (identified by role='ADMIN' or specified admin email)
 * - Database structure (tables, indexes, constraints)
 * 
 * SECURITY FEATURES:
 * - Explicit confirmation required before execution
 * - Environment verification (prevents accidental execution in production)
 * - Detailed logging of all operations
 * - Automatic rollback on failure
 * - Transaction-based operations for data integrity
 * 
 * USAGE:
 *   # Dry-run mode (simulation only)
 *   npx tsx scripts/clean-database.ts --dry-run
 * 
 *   # Verbose mode with confirmation
 *   npx tsx scripts/clean-database.ts --verbose
 * 
 *   # Specify admin email to preserve
 *   npx tsx scripts/clean-database.ts --admin-email admin@example.com
 * 
 *   # Force execution in production (requires explicit confirmation)
 *   npx tsx scripts/clean-database.ts --force-production
 * 
 *   # Combine options
 *   npx tsx scripts/clean-database.ts --dry-run --verbose --admin-email admin@example.com
 * 
 * WARNING:
 *   This script will DELETE ALL DATA from the database except admin users.
 *   This action is IRREVERSIBLE. Always run in dry-run mode first.
 * 
 * ENVIRONMENT VARIABLES:
 *   DATABASE_URL - PostgreSQL connection string (required)
 *   NODE_ENV - Environment mode (production, development, etc.)
 */

import { PrismaClient } from '@prisma/client'
import * as readline from 'readline'

// Initialize Prisma client
const prisma = new PrismaClient()

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// Logging levels
enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

// Configuration interface
interface Config {
  dryRun: boolean
  verbose: boolean
  adminEmail?: string
  forceProduction: boolean
  logLevel: LogLevel
}

// Parse command line arguments
function parseArgs(): Config {
  const args = process.argv.slice(2)
  
  return {
    dryRun: args.includes('--dry-run') || args.includes('-d'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    adminEmail: getArgValue(args, '--admin-email') || getArgValue(args, '-a'),
    forceProduction: args.includes('--force-production') || args.includes('-f'),
    logLevel: args.includes('--verbose') || args.includes('-v') ? LogLevel.DEBUG : LogLevel.INFO
  }
}

// Get argument value from command line
function getArgValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag)
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1]
  }
  return undefined
}

// Logger class
class Logger {
  constructor(private config: Config) {}

  private shouldLog(level: LogLevel): boolean {
    return level <= this.config.logLevel
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`❌ [ERROR] ${message}`, ...args)
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`⚠️  [WARN] ${message}`, ...args)
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`ℹ️  [INFO] ${message}`, ...args)
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(`🔍 [DEBUG] ${message}`, ...args)
    }
  }

  success(message: string, ...args: any[]): void {
    console.log(`✅ [SUCCESS] ${message}`, ...args)
  }
}

// Ask question and return answer
function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim())
    })
  })
}

// Verify environment
async function verifyEnvironment(config: Config, logger: Logger): Promise<boolean> {
  logger.info('Verifying environment...')

  // Check DATABASE_URL
  if (!process.env.DATABASE_URL) {
    logger.error('DATABASE_URL environment variable is not set')
    return false
  }

  logger.debug(`DATABASE_URL: ${maskDatabaseUrl(process.env.DATABASE_URL)}`)

  // Check if in production
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction && !config.forceProduction) {
    logger.warn('⚠️  PRODUCTION ENVIRONMENT DETECTED ⚠️')
    logger.warn('This script is about to delete ALL data from PRODUCTION database!')
    logger.warn('To proceed, you must use --force-production flag')
    return false
  }

  if (isProduction && config.forceProduction) {
    logger.warn('⚠️  FORCE PRODUCTION MODE ENABLED ⚠️')
    logger.warn('You are about to delete data from PRODUCTION database!')
  }

  // Test database connection
  try {
    await prisma.$connect()
    logger.debug('Database connection successful')
    
    // Verify we can query the database
    await prisma.$queryRaw`SELECT 1`
    logger.debug('Database query test successful')
    
    return true
  } catch (error) {
    logger.error('Failed to connect to database:', error)
    return false
  }
}

// Mask sensitive information in database URL
function maskDatabaseUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    if (urlObj.password) {
      urlObj.password = '***'
    }
    return urlObj.toString()
  } catch {
    return url.replace(/:[^:@]+@/, ':***@')
  }
}

// Get admin users to preserve
async function getAdminUsers(config: Config, logger: Logger): Promise<string[]> {
  logger.info('Identifying admin users to preserve...')

  const adminUsers = await prisma.user.findMany({
    where: {
      OR: [
        { role: 'ADMIN' },
        ...(config.adminEmail ? [{ email: config.adminEmail }] : [])
      ]
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true
    }
  })

  if (adminUsers.length === 0) {
    logger.warn('No admin users found. All users will be deleted!')
    return []
  }

  logger.info(`Found ${adminUsers.length} admin user(s) to preserve:`)
  adminUsers.forEach((user, index) => {
    logger.info(`  ${index + 1}. ${user.email} (${user.name || 'N/A'}) - Role: ${user.role}`)
  })

  return adminUsers.map(u => u.id)
}

// Get table statistics before cleanup
async function getTableStats(logger: Logger): Promise<Record<string, number>> {
  logger.debug('Collecting table statistics...')

  const stats: Record<string, number> = {}

  try {
    const tables = [
      { name: 'Review', model: prisma.review },
      { name: 'MotResult', model: prisma.motResult },
      { name: 'Booking', model: prisma.booking },
      { name: 'GarageTimeSlotBlock', model: prisma.garageTimeSlotBlock },
      { name: 'GarageScheduleException', model: prisma.garageScheduleException },
      { name: 'GarageSchedule', model: prisma.garageSchedule },
      { name: 'MotHistory', model: prisma.motHistory },
      { name: 'Vehicle', model: prisma.vehicle },
      { name: 'Garage', model: prisma.garage },
      { name: 'Account', model: prisma.account },
      { name: 'Session', model: prisma.session },
      { name: 'VerificationToken', model: prisma.verificationToken },
      { name: 'MotNotification', model: prisma.motNotification },
      { name: 'EmailLog', model: prisma.emailLog },
      { name: 'ScheduledEmail', model: prisma.scheduledEmail },
      { name: 'GarageApprovalLog', model: prisma.garageApprovalLog },
      { name: 'User', model: prisma.user }
    ]

    for (const table of tables) {
      try {
        const count = await (table.model as any).count()
        stats[table.name] = count
        logger.debug(`  ${table.name}: ${count} records`)
      } catch (error) {
        logger.debug(`  ${table.name}: Error counting - ${error}`)
        stats[table.name] = 0
      }
    }
  } catch (error) {
    logger.warn('Error collecting table statistics:', error)
  }

  return stats
}

// Perform database cleanup
async function cleanDatabase(config: Config, logger: Logger, adminUserIds: string[]): Promise<boolean> {
  logger.info('Starting database cleanup...')
  
  if (config.dryRun) {
    logger.warn('🔍 DRY-RUN MODE: No changes will be made to the database')
  }

  const startTime = Date.now()

  try {
    // Get initial statistics
    const initialStats = await getTableStats(logger)
    logger.info('Initial table statistics:')
    Object.entries(initialStats).forEach(([table, count]) => {
      if (count > 0) {
        logger.info(`  ${table}: ${count} records`)
      }
    })

    if (config.dryRun) {
      logger.info('Dry-run completed. No data was deleted.')
      return true
    }

    // Use transaction for atomicity
    await prisma.$transaction(async (tx) => {
      logger.debug('Starting database transaction...')

      // Delete in correct order to respect foreign key constraints
      const deleteOperations = [
        { name: 'Review', model: tx.review },
        { name: 'MotResult', model: tx.motResult },
        { name: 'Booking', model: tx.booking },
        { name: 'GarageTimeSlotBlock', model: tx.garageTimeSlotBlock },
        { name: 'GarageScheduleException', model: tx.garageScheduleException },
        { name: 'GarageSchedule', model: tx.garageSchedule },
        { name: 'MotHistory', model: tx.motHistory },
        { name: 'Vehicle', model: tx.vehicle },
        { name: 'Garage', model: tx.garage },
        { name: 'Account', model: tx.account },
        { name: 'Session', model: tx.session },
        { name: 'VerificationToken', model: tx.verificationToken },
        { name: 'MotNotification', model: tx.motNotification },
        { name: 'EmailLog', model: tx.emailLog },
        { name: 'ScheduledEmail', model: tx.scheduledEmail },
        { name: 'GarageApprovalLog', model: tx.garageApprovalLog }
      ]

      // Delete data from all tables
      for (const operation of deleteOperations) {
        logger.debug(`Deleting from ${operation.name}...`)
        const result = await (operation.model as any).deleteMany()
        logger.info(`  ✅ Deleted ${result.count} records from ${operation.name}`)
      }

      // Delete users except admin users
      logger.debug('Deleting non-admin users...')
      const userDeleteResult = await tx.user.deleteMany({
        where: {
          id: {
            notIn: adminUserIds
          }
        }
      })
      logger.info(`  ✅ Deleted ${userDeleteResult.count} non-admin user(s)`)

      logger.debug('Transaction completed successfully')
    }, {
      timeout: 300000, // 5 minutes timeout
      maxWait: 300000  // Maximum time to wait for a transaction slot
    })

    // Get final statistics
    const finalStats = await getTableStats(logger)
    logger.info('Final table statistics:')
    Object.entries(finalStats).forEach(([table, count]) => {
      if (count > 0) {
        logger.info(`  ${table}: ${count} records`)
      }
    })

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    logger.success(`Database cleanup completed successfully in ${duration} seconds`)

    return true

  } catch (error) {
    logger.error('Error during database cleanup:', error)
    
    // Transaction will automatically rollback on error
    logger.warn('Transaction rolled back. No changes were made to the database.')
    
    return false
  }
}

// Request explicit confirmation
async function requestConfirmation(config: Config, logger: Logger): Promise<boolean> {
  console.log('\n' + '='.repeat(70))
  console.log('⚠️  WARNING: DATABASE CLEANUP OPERATION ⚠️')
  console.log('='.repeat(70))
  console.log('')
  console.log('This operation will:')
  console.log('  • DELETE ALL DATA from all database tables')
  console.log('  • PRESERVE admin users (role=ADMIN)')
  if (config.adminEmail) {
    console.log(`  • PRESERVE user with email: ${config.adminEmail}`)
  }
  console.log('  • MAINTAIN database structure (tables, indexes, constraints)')
  console.log('')
  console.log('⚠️  THIS ACTION IS IRREVERSIBLE ⚠️')
  console.log('')
  
  if (config.dryRun) {
    console.log('🔍 DRY-RUN MODE: No actual changes will be made')
    console.log('')
  }

  const answer = await askQuestion('Type "DELETE ALL DATA" to confirm: ')

  if (answer !== 'DELETE ALL DATA') {
    logger.warn('Confirmation failed. Operation cancelled.')
    return false
  }

  // Additional confirmation for production
  if (process.env.NODE_ENV === 'production' && config.forceProduction) {
    console.log('')
    logger.warn('⚠️  PRODUCTION ENVIRONMENT - ADDITIONAL CONFIRMATION REQUIRED ⚠️')
    const prodAnswer = await askQuestion('Type "YES DELETE PRODUCTION" to proceed: ')
    
    if (prodAnswer !== 'YES DELETE PRODUCTION') {
      logger.warn('Production confirmation failed. Operation cancelled.')
      return false
    }
  }

  return true
}

// Main function
async function main() {
  const config = parseArgs()
  const logger = new Logger(config)

  console.log('')
  console.log('🗄️  Database Cleanup Script')
  console.log('='.repeat(70))
  console.log('')

  try {
    // Verify environment
    const envValid = await verifyEnvironment(config, logger)
    if (!envValid) {
      logger.error('Environment verification failed')
      process.exit(1)
    }

    // Get admin users
    const adminUserIds = await getAdminUsers(config, logger)
    console.log('')

    // Request confirmation
    const confirmed = await requestConfirmation(config, logger)
    if (!confirmed) {
      logger.info('Operation cancelled by user')
      process.exit(0)
    }

    console.log('')

    // Perform cleanup
    const success = await cleanDatabase(config, logger, adminUserIds)

    if (success) {
      logger.success('Database cleanup completed successfully!')
      process.exit(0)
    } else {
      logger.error('Database cleanup failed')
      process.exit(1)
    }

  } catch (error) {
    logger.error('Fatal error:', error)
    process.exit(1)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

// Run main function
main().catch((error) => {
  console.error('Unhandled error:', error)
  process.exit(1)
})

