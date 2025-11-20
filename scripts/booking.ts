#!/usr/bin/env tsx
/**
 * BookaMOT Booking Management Utility
 * Utilities for testing and managing bookings
 * 
 * Usage:
 *   npm run booking:complete - Mark first non-completed booking as completed
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateBookingToCompleted() {
  try {
    // Get the first booking that is not COMPLETED
    const booking = await prisma.booking.findFirst({
      where: {
        status: {
          not: 'COMPLETED'
        }
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true
          }
        },
        garage: {
          select: {
            name: true
          }
        },
        vehicle: {
          select: {
            registration: true,
            make: true,
            model: true
          }
        }
      }
    })

    if (!booking) {
      console.log('❌ No bookings found to update')
      return
    }

    console.log('\n📅 Found booking:')
    console.log(`   Reference: ${booking.bookingRef}`)
    console.log(`   Customer: ${booking.customer.name}`)
    console.log(`   Garage: ${booking.garage.name}`)
    console.log(`   Vehicle: ${booking.vehicle.make} ${booking.vehicle.model} (${booking.vehicle.registration})`)
    console.log(`   Current Status: ${booking.status}`)

    // Update to COMPLETED
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'COMPLETED',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Set to 7 days ago
      }
    })

    console.log(`\n✅ Booking updated to COMPLETED!`)
    console.log(`   New Status: ${updatedBooking.status}`)
    console.log(`   New Date: ${updatedBooking.date.toISOString().split('T')[0]}`)
    console.log(`\n🎯 Next steps:`)
    console.log(`   1. Go to /bookings page`)
    console.log(`   2. Look for "Past Bookings" section`)
    console.log(`   3. Find booking #${booking.bookingRef}`)
    console.log(`   4. Click "Write Review" button`)
    console.log(`   5. Submit a review with rating and comment`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  const command = process.argv[2]

  try {
    switch (command) {
      case 'complete':
        await updateBookingToCompleted()
        break
      default:
        console.log('Usage: npm run booking <command>')
        console.log('Commands:')
        console.log('  complete - Mark first non-completed booking as completed')
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(console.error)

