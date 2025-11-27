#!/usr/bin/env tsx
/**
 * BookaMOT Query Utility
 * Utilities for querying and inspecting database data
 * 
 * Usage:
 *   npm run query:users      - List all users
 *   npm run query:garages    - List all garage owners
 *   npm run query:slots      - Check availability slots
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function listAllUsers() {
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
        console.log(`${i + 1}. ${user.name} (${user.email})`)
        console.log(`   Garage: ${user.garage?.name ?? 'N/A'}`)
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

async function listGarageOwners() {
  try {
    console.log('🔍 Fetching garage owners...\n')
    
    const garageOwners = await prisma.user.findMany({
      where: {
        garage: {
          isNot: null
        }
      },
      include: {
        garage: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            isActive: true,
            motLicenseNumber: true
          }
        }
      }
    })
    
    console.log(`📊 Total garage owners: ${garageOwners.length}\n`)
    
    if (garageOwners.length > 0) {
      garageOwners.forEach((user, i) => {
        console.log(`${i + 1}. ${user.name} (${user.email})`)
        console.log(`   Garage: ${user.garage?.name ?? 'N/A'}`)
        console.log(`   Email: ${user.garage?.email ?? 'N/A'}`)
        console.log(`   Phone: ${user.garage?.phone ?? 'N/A'}`)
        console.log(`   City: ${user.garage?.city ?? 'N/A'}`)
        console.log(`   MOT License: ${user.garage?.motLicenseNumber ?? 'N/A'}`)
        console.log(`   Active: ${user.garage?.isActive ? 'Yes' : 'No'}`)
        console.log('')
      })
    } else {
      console.log('❌ No garage owners found.')
    }

  } catch (error) {
    console.error('❌ Error fetching garage owners:', error)
  }
}

async function checkSlots() {
  try {
    console.log('🔍 Checking availability slots...\n')
    
    const count = await (prisma as any).garageAvailability.count()
    console.log(`📊 Total slots: ${count}\n`)
    
    const sampleSlots = await (prisma as any).garageAvailability.findMany({
      take: 5,
      select: {
        id: true,
        date: true,
        timeSlot: true,
        isBooked: true,
        isBlocked: true
      }
    })
    
    console.log('Sample slots:')
    sampleSlots.forEach((slot: any, i: number) => {
      const date = slot.date.toISOString().split('T')[0]
      console.log(`${i + 1}. ${date} ${slot.timeSlot}`)
      console.log(`   Booked: ${slot.isBooked ? 'Yes' : 'No'}, Blocked: ${slot.isBlocked ? 'Yes' : 'No'}`)
    })
    
  } catch (error) {
    console.error('❌ Error checking slots:', error)
  }
}

async function main() {
  const command = process.argv[2]

  try {
    switch (command) {
      case 'users':
        await listAllUsers()
        break
      case 'garages':
        await listGarageOwners()
        break
      case 'slots':
        await checkSlots()
        break
      default:
        console.log('Usage: npm run query <command>')
        console.log('Commands:')
        console.log('  users   - List all users')
        console.log('  garages - List garage owners')
        console.log('  slots   - Check availability slots')
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(console.error)

