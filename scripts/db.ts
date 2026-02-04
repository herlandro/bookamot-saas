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
import bcrypt from 'bcryptjs'

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

async function setupDemoData() {
  const now = new Date()

  const adminEmail = 'bookanmot@gmail.com'
  const adminPasswordHash = await bcrypt.hash('Frog3566!', 12)

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: 'Admin', password: adminPasswordHash, role: 'ADMIN' },
    create: { name: 'Admin', email: adminEmail, password: adminPasswordHash, role: 'ADMIN' },
  })

  const defaultSchedules = [
    { dayOfWeek: 1, isOpen: true, openTime: '09:00', closeTime: '18:00', slotDuration: 60 },
    { dayOfWeek: 2, isOpen: true, openTime: '09:00', closeTime: '18:00', slotDuration: 60 },
    { dayOfWeek: 3, isOpen: true, openTime: '09:00', closeTime: '18:00', slotDuration: 60 },
    { dayOfWeek: 4, isOpen: true, openTime: '09:00', closeTime: '18:00', slotDuration: 60 },
    { dayOfWeek: 5, isOpen: true, openTime: '09:00', closeTime: '18:00', slotDuration: 60 },
    { dayOfWeek: 6, isOpen: true, openTime: '09:00', closeTime: '18:00', slotDuration: 60 },
    { dayOfWeek: 0, isOpen: false, openTime: '09:00', closeTime: '18:00', slotDuration: 60 },
  ] as const

  const { generateVerificationCode, sendGarageVerificationEmail } = await import('../src/lib/email')

  const garagesToCreate = [
    {
      garageName: 'Nosso Contato Garage',
      ownerName: 'Nosso Contato',
      email: 'nossocontato@gmail.com',
      password: 'garage123',
      address: '45 High Street, Stevenage, SG1 1AA',
      phone: '01438123456',
    },
    {
      garageName: 'Garagem do Bairro',
      ownerName: 'Maria Oliveira',
      email: 'maria.oliveira.garage@gmail.com',
      password: 'garage456',
      address: '12 London Road, Hitchin, SG5 1AT',
      phone: '01438987654',
    },
  ]

  for (const spec of garagesToCreate) {
    const ownerPasswordHash = await bcrypt.hash(spec.password, 12)
    const owner = await prisma.user.upsert({
      where: { email: spec.email },
      update: { name: spec.ownerName, password: ownerPasswordHash, role: 'GARAGE_OWNER' },
      create: { name: spec.ownerName, email: spec.email, password: ownerPasswordHash, role: 'GARAGE_OWNER' },
      select: { id: true, email: true, name: true, emailVerified: true },
    })

    const garage = await prisma.garage.upsert({
      where: { ownerId: owner.id },
      update: {
        name: spec.garageName,
        email: spec.email,
        phone: spec.phone,
        address: spec.address,
        city: spec.address.split(',').map(p => p.trim()).slice(-2, -1)[0] || 'Unknown',
        postcode: spec.address.split(',').map(p => p.trim()).slice(-1)[0] || 'N/A',
        dvlaApproved: false,
        isActive: false,
        motLicenseNumber: `MOT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        approvalStatus: 'PENDING',
        approvedAt: null,
        approvedById: null,
        rejectionReason: null,
      },
      create: {
        name: spec.garageName,
        email: spec.email,
        phone: spec.phone,
        address: spec.address,
        city: spec.address.split(',').map(p => p.trim()).slice(-2, -1)[0] || 'Unknown',
        postcode: spec.address.split(',').map(p => p.trim()).slice(-1)[0] || 'N/A',
        dvlaApproved: false,
        isActive: false,
        motLicenseNumber: `MOT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ownerId: owner.id,
      },
      select: { id: true, name: true, ownerId: true, approvalStatus: true, isActive: true },
    })

    await prisma.garageSchedule.deleteMany({ where: { garageId: garage.id } })
    await prisma.garageSchedule.createMany({
      data: defaultSchedules.map(s => ({ garageId: garage.id, ...s })),
    })

    const verificationCode = generateVerificationCode()
    const verificationExpiry = new Date(Date.now() + 30 * 60 * 1000)
    await prisma.user.update({
      where: { id: owner.id },
      data: {
        emailVerified: null,
        emailVerificationCode: verificationCode,
        emailVerificationExpiry: verificationExpiry,
      },
    })

    try {
      await sendGarageVerificationEmail(spec.email, spec.garageName, verificationCode)
      console.log(`📧 Verification email sent to ${spec.email}`)
    } catch (error) {
      console.error(`❌ Failed to send verification email to ${spec.email}:`, error)
    }

    const userWithCode = await prisma.user.findUnique({
      where: { id: owner.id },
      select: { emailVerificationCode: true, emailVerificationExpiry: true },
    })

    if (!userWithCode?.emailVerificationCode) {
      throw new Error(`Verification code not present for user ${owner.email}`)
    }

    await prisma.user.update({
      where: { id: owner.id },
      data: {
        emailVerified: new Date(),
        emailVerificationCode: null,
        emailVerificationExpiry: null,
      },
    })

    await prisma.garage.update({
      where: { id: garage.id },
      data: {
        approvalStatus: 'APPROVED',
        approvedAt: now,
        approvedById: adminUser.id,
        isActive: true,
        dvlaApproved: true,
      },
    })

    await prisma.garageApprovalLog.create({
      data: {
        garageId: garage.id,
        action: 'APPROVED',
        reason: 'Auto-approved by setup-demo',
        adminId: adminUser.id,
      },
    })

    const verifiedOwner = await prisma.user.findUnique({
      where: { id: owner.id },
      select: { email: true, emailVerified: true },
    })
    const activatedGarage = await prisma.garage.findUnique({
      where: { id: garage.id },
      select: { name: true, isActive: true, approvalStatus: true },
    })

    console.log(`✅ Garage ready: ${activatedGarage?.name} | active=${activatedGarage?.isActive} | status=${activatedGarage?.approvalStatus}`)
    console.log(`✅ Owner verified: ${verifiedOwner?.email} | emailVerified=${Boolean(verifiedOwner?.emailVerified)}`)
  }

  const customerPasswordHash = await bcrypt.hash('password123', 12)
  const customer = await prisma.user.upsert({
    where: { email: 'proffessorteodoro@gmail.com' },
    update: { name: 'Professor Teodoro', password: customerPasswordHash, role: 'CUSTOMER' },
    create: { name: 'Professor Teodoro', email: 'proffessorteodoro@gmail.com', password: customerPasswordHash, role: 'CUSTOMER' },
    select: { id: true, name: true, email: true, role: true },
  })

  console.log(`✅ Customer user ready: ${customer.email} | role=${customer.role}`)
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
      case 'setup-demo':
        await setupDemoData()
        break
      default:
        console.log('Usage: npm run db <command>')
        console.log('Commands:')
        console.log('  clean  - Delete all data')
        console.log('  reset  - Delete all data and reseed')
        console.log('  list   - List all users')
        console.log('  setup-demo - Create demo garages + verify + approve, and a customer user')
    }
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

main().catch(console.error)
