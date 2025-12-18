#!/usr/bin/env tsx
/**
 * Test Email Sending
 * Tests if email sending functionality works
 */

import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const prisma = new PrismaClient()

async function testEmailSending() {
  try {
    console.log('📧 Testing email sending functionality...\n')
    
    // Get the most recent booking
    const booking = await prisma.booking.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        garage: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            postcode: true,
            phone: true,
            email: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            registration: true,
            make: true,
            model: true,
            year: true,
          },
        },
      },
    })

    if (!booking) {
      console.log('❌ No bookings found. Please create a booking first.')
      return
    }

    console.log('Found booking:', booking.bookingRef)
    console.log('Customer:', booking.customer.email)
    console.log('Garage:', booking.garage.email)
    console.log('')

    // Import and test email service
    const emailService = await import('../src/lib/email/booking-email-service')
    
    console.log('Testing customer confirmation email...')
    try {
      await emailService.sendBookingConfirmationToCustomer(booking)
      console.log('✅ Customer email sent successfully')
    } catch (error) {
      console.error('❌ Customer email failed:', error)
    }

    console.log('\nTesting garage notification email...')
    try {
      await emailService.sendBookingNotificationToGarage(booking)
      console.log('✅ Garage email sent successfully')
    } catch (error) {
      console.error('❌ Garage email failed:', error)
    }

    console.log('\n📊 Checking email logs...')
    const logs = await prisma.emailLog.findMany({
      where: { bookingId: booking.id },
      orderBy: { createdAt: 'desc' },
    })

    console.log(`Found ${logs.length} email logs:`)
    logs.forEach((log, index) => {
      console.log(`\n${index + 1}. ${log.emailType}`)
      console.log(`   To: ${log.recipientEmail}`)
      console.log(`   Status: ${log.status}`)
      if (log.errorMessage) {
        console.log(`   Error: ${log.errorMessage}`)
      }
      if (log.sentAt) {
        console.log(`   Sent: ${log.sentAt.toISOString()}`)
      }
    })

  } catch (error) {
    console.error('Error testing email sending:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testEmailSending()

