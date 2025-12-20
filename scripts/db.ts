#!/usr/bin/env tsx
/**
 * BookaMOT Database Management CLI
 * Unified tool for all database operations: clean, reset, seed, and utilities
 * 
 * Usage:
 *   npm run db:clean    - Delete all data from database
 *   npm run db:reset    - Delete all data and reseed with fresh data
 *   npm run db:seed     - Seed database with test data
 *   npm run db:list     - List users and garage owners
 */

import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import * as readline from 'readline'

const prisma = new PrismaClient()

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer)
    })
  })
}

async function cleanDatabase() {
  console.log('⚠️  WARNING: This will delete ALL data from the database!')
  console.log('   This action cannot be undone.\n')
  
  const answer = await askQuestion('Are you sure you want to continue? (yes/no): ')
  
  if (answer.toLowerCase() !== 'yes') {
    console.log('\n❌ Database cleaning cancelled.')
    return false
  }

  console.log('\n🗑️  Starting database cleanup...\n')

  try {
    // Delete in correct order to respect foreign key constraints
    const tables = [
      { name: 'reviews', model: prisma.review },
      { name: 'MOT results', model: prisma.motResult },
      { name: 'bookings', model: prisma.booking },
      { name: 'garage time slot blocks', model: prisma.garageTimeSlotBlock },
      { name: 'garage schedule exceptions', model: prisma.garageScheduleException },
      { name: 'garage schedules', model: prisma.garageSchedule },
      { name: 'MOT history', model: prisma.motHistory },
      { name: 'vehicles', model: prisma.vehicle },
      { name: 'garages', model: prisma.garage },
      { name: 'accounts', model: prisma.account },
      { name: 'sessions', model: prisma.session },
      { name: 'verification tokens', model: prisma.verificationToken },
      { name: 'users', model: prisma.user }
    ]

    for (const table of tables) {
      console.log(`   Deleting ${table.name}...`)
      const result = await (table.model as any).deleteMany()
      console.log(`   ✅ Deleted ${result.count} ${table.name}`)
    }

    console.log('\n✨ Database cleaned successfully!')
    return true

  } catch (error) {
    console.error('\n❌ Error cleaning database:', error)
    return false
  }
}

async function resetDatabase() {
  const cleaned = await cleanDatabase()
  if (!cleaned) return

  rl.close()

  console.log('\n📍 Step 2/2: Seeding database...\n')
  
  try {
    // Run the seed script
    execSync('tsx prisma/seed.ts', { stdio: 'inherit' })
    
    console.log('\n✨ Database reset completed successfully!')
    console.log('\n🎉 Your database is now clean and seeded with fresh data!')
    console.log('\n🔑 Test Credentials:')
    console.log('   See docs/SEED_DATA_CREDENTIALS.md for details')
    console.log('   Password: password123 (customers) / garage123 (garages)')
  } catch (error) {
    console.error('\n❌ Error during seeding:', error)
  }
}

async function listUsers() {
  try {
    console.log('🔍 Fetching all users...\n')
    
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        garage: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    
    console.log(`📊 Total users: ${allUsers.length}\n`)
    
    const usersWithGarage = allUsers.filter(u => u.garage)
    const usersWithoutGarage = allUsers.filter(u => !u.garage)
    
    console.log(`🏢 Garage owners: ${usersWithGarage.length}`)
    console.log(`👤 Regular users: ${usersWithoutGarage.length}\n`)
    
    if (usersWithGarage.length > 0) {
      console.log('=== GARAGE OWNERS ===')
      usersWithGarage.forEach((user, i) => {
        console.log(`${i + 1}. ${user.name} (${user.email}) - ${user.garage?.name ?? 'N/A'}`)
      })
    }

    if (usersWithoutGarage.length > 0) {
      console.log('\n=== REGULAR USERS ===')
      usersWithoutGarage.forEach((user, i) => {
        console.log(`${i + 1}. ${user.name} (${user.email})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error fetching users:', error)
  }
}

async function main() {
  const command = process.argv[2]

  try {
    switch (command) {
      case 'clean':
        await cleanDatabase()
        break
      case 'reset':
        await resetDatabase()
        break
      case 'list':
        await listUsers()
        break
      default:
        console.log('Usage: npm run db <command>')
        console.log('Commands:')
        console.log('  clean  - Delete all data')
        console.log('  reset  - Delete all data and reseed')
        console.log('  list   - List all users')
    }
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

main().catch(console.error)

