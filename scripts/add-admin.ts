#!/usr/bin/env tsx

/**
 * Script to add admin users to the database
 * 
 * Usage:
 *   npm run admin:add
 *   npx tsx scripts/add-admin.ts
 *   npx tsx scripts/add-admin.ts --email user@example.com --password securepass123 --name "John Doe"
 */

import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import readline from 'readline'

const prisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

async function addAdmin() {
  console.log('🔐 Add Admin User\n')

  // Get email from command line args or prompt
  let email = process.argv.find(arg => arg.startsWith('--email='))?.split('=')[1]
  let password = process.argv.find(arg => arg.startsWith('--password='))?.split('=')[1]
  let name = process.argv.find(arg => arg.startsWith('--name='))?.split('=')[1]

  if (!email) {
    email = await askQuestion('Enter email address: ')
  }

  if (!email || !email.includes('@')) {
    console.error('❌ Invalid email address')
    process.exit(1)
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  if (existingUser) {
    if (existingUser.role === UserRole.ADMIN) {
      console.log(`⚠️  User ${email} already exists and is an admin.`)
      const update = await askQuestion('Do you want to update the password? (yes/no): ')
      if (update.toLowerCase() !== 'yes' && update.toLowerCase() !== 'y') {
        console.log('❌ Cancelled')
        process.exit(0)
      }
    } else {
      console.log(`⚠️  User ${email} already exists with role: ${existingUser.role}`)
      const promote = await askQuestion('Do you want to promote this user to admin? (yes/no): ')
      if (promote.toLowerCase() !== 'yes' && promote.toLowerCase() !== 'y') {
        console.log('❌ Cancelled')
        process.exit(0)
      }
    }
  }

  if (!password) {
    password = await askQuestion('Enter password: ')
  }

  if (!password || password.length < 6) {
    console.error('❌ Password must be at least 6 characters long')
    process.exit(1)
  }

  if (!name) {
    name = await askQuestion('Enter name (optional): ') || 'Admin'
  }

  try {
    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        password: hashedPassword,
        role: UserRole.ADMIN
      },
      create: {
        name,
        email,
        password: hashedPassword,
        role: UserRole.ADMIN
      }
    })

    console.log('\n✅ Admin user created/updated successfully!')
    console.log(`   Email: ${user.email}`)
    console.log(`   Name: ${user.name}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   ID: ${user.id}`)
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

addAdmin()
