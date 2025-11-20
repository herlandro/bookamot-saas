#!/usr/bin/env tsx
/**
 * BookaMOT Database Seeding Script
 * Seeds database with test garages and users
 * 
 * Usage:
 *   npm run db:seed
 *   tsx scripts/seed.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Test garages data
const garagesData = [
  {
    name: 'Stevenage MOT Centre',
    email: 'stevenage@test.com',
    phone: '01438 123456',
    address: '123 High Street',
    city: 'Stevenage',
    postcode: 'SG1 1AB',
    latitude: 51.9025,
    longitude: -0.2021,
    motPrice: 5499,
    dvlaApproved: true,
    motLicenseNumber: 'MOT12345',
    owner: { name: 'John Smith', email: 'john.smith@test.com' }
  },
  {
    name: 'Hitchin Auto Services',
    email: 'hitchin@test.com',
    phone: '01462 987654',
    address: '45 Queen Street',
    city: 'Hitchin',
    postcode: 'SG4 9TZ',
    latitude: 51.9489,
    longitude: -0.2881,
    motPrice: 4999,
    dvlaApproved: true,
    motLicenseNumber: 'MOT67890',
    owner: { name: 'Sarah Johnson', email: 'sarah.johnson@test.com' }
  },
  {
    name: 'Letchworth Garage',
    email: 'letchworth@test.com',
    phone: '01462 456789',
    address: '78 Station Road',
    city: 'Letchworth',
    postcode: 'SG6 3BQ',
    latitude: 51.9781,
    longitude: -0.2281,
    motPrice: 5299,
    dvlaApproved: true,
    motLicenseNumber: 'MOT24680',
    owner: { name: 'David Brown', email: 'david.brown@test.com' }
  },
  {
    name: 'London Central MOT',
    email: 'london@test.com',
    phone: '020 7123 4567',
    address: '10 Baker Street',
    city: 'London',
    postcode: 'W1U 6TT',
    latitude: 51.5074,
    longitude: -0.1278,
    motPrice: 6499,
    dvlaApproved: true,
    motLicenseNumber: 'MOT13579',
    owner: { name: 'Emma Wilson', email: 'emma.wilson@test.com' }
  }
]

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n')

  try {
    for (const garageData of garagesData) {
      // Create or update garage owner
      const hashedPassword = await bcrypt.hash('password123', 10)
      
      let owner = await prisma.user.findUnique({
        where: { email: garageData.owner.email }
      })

      if (!owner) {
        owner = await prisma.user.create({
          data: {
            name: garageData.owner.name,
            email: garageData.owner.email,
            password: hashedPassword,
            role: 'GARAGE_OWNER'
          }
        })
        console.log(`✅ Created user: ${garageData.owner.name}`)
      } else {
        console.log(`ℹ️  User already exists: ${garageData.owner.email}`)
      }

      // Create or update garage
      const garage = await prisma.garage.upsert({
        where: { email: garageData.email },
        update: { ownerId: owner.id },
        create: {
          name: garageData.name,
          email: garageData.email,
          phone: garageData.phone,
          address: garageData.address,
          city: garageData.city,
          postcode: garageData.postcode,
          latitude: garageData.latitude,
          longitude: garageData.longitude,
          motPrice: garageData.motPrice,
          dvlaApproved: garageData.dvlaApproved,
          motLicenseNumber: garageData.motLicenseNumber,
          ownerId: owner.id
        }
      })

      console.log(`✅ Created/updated garage: ${garage.name}`)
    }

    console.log('\n✨ Database seeding completed successfully!')
    console.log('\n🔑 Test Credentials:')
    console.log('   Garage owners: See garagesData in this script')
    console.log('   Password: password123')

  } catch (error) {
    console.error('\n❌ Error seeding database:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seedDatabase()

