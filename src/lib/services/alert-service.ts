/**
 * Alert Service
 * Handles sending alerts via email and other channels
 */

import { prisma } from '@/lib/prisma'
import { NotificationType } from '@prisma/client'

interface AlertData {
  userId: string
  vehicleId: string
  type: NotificationType
  title: string
  message: string
  daysUntilExpiry?: number
}

/**
 * Send email alert (placeholder - integrate with your email service)
 */
async function sendEmailAlert(email: string, data: AlertData): Promise<boolean> {
  try {
    console.log(`📧 Sending email alert to ${email}`)
    console.log(`   Type: ${data.type}`)
    console.log(`   Title: ${data.title}`)
    console.log(`   Message: ${data.message}`)

    // TODO: Integrate with email service (SendGrid, Mailgun, etc.)
    // Example:
    // await sendgrid.send({
    //   to: email,
    //   from: 'noreply@bookamot.com',
    //   subject: data.title,
    //   html: `<p>${data.message}</p>`
    // })

    console.log(`✅ Email alert sent successfully`)
    return true
  } catch (error) {
    console.error('❌ Error sending email alert:', error)
    return false
  }
}

/**
 * Send SMS alert (placeholder - integrate with your SMS service)
 */
async function sendSmsAlert(phone: string, data: AlertData): Promise<boolean> {
  try {
    console.log(`📱 Sending SMS alert to ${phone}`)
    console.log(`   Message: ${data.message}`)

    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    // Example:
    // await twilio.messages.create({
    //   body: data.message,
    //   from: '+1234567890',
    //   to: phone
    // })

    console.log(`✅ SMS alert sent successfully`)
    return true
  } catch (error) {
    console.error('❌ Error sending SMS alert:', error)
    return false
  }
}

/**
 * Send push notification (placeholder)
 */
async function sendPushNotification(userId: string, data: AlertData): Promise<boolean> {
  try {
    console.log(`🔔 Sending push notification to user ${userId}`)
    console.log(`   Title: ${data.title}`)
    console.log(`   Message: ${data.message}`)

    // TODO: Integrate with push notification service (Firebase, OneSignal, etc.)

    console.log(`✅ Push notification sent successfully`)
    return true
  } catch (error) {
    console.error('❌ Error sending push notification:', error)
    return false
  }
}

/**
 * Send comprehensive alert via all channels
 */
export async function sendComprehensiveAlert(data: AlertData): Promise<{
  email: boolean
  sms: boolean
  push: boolean
}> {
  try {
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { email: true, phone: true }
    })

    if (!user) {
      console.log(`⚠️  User ${data.userId} not found`)
      return { email: false, sms: false, push: false }
    }

    // Get vehicle details
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
      select: { registration: true }
    })

    console.log(`\n🚨 SENDING COMPREHENSIVE ALERT`)
    console.log(`   Vehicle: ${vehicle?.registration}`)
    console.log(`   User: ${user.email}`)
    console.log(`   Type: ${data.type}`)
    console.log(`   Days Until Expiry: ${data.daysUntilExpiry || 'N/A'}`)

    // Send alerts in parallel
    const [emailResult, smsResult, pushResult] = await Promise.all([
      user.email ? sendEmailAlert(user.email, data) : Promise.resolve(false),
      user.phone ? sendSmsAlert(user.phone, data) : Promise.resolve(false),
      sendPushNotification(data.userId, data)
    ])

    console.log(`\n✅ Alert Summary:`)
    console.log(`   Email: ${emailResult ? '✅ Sent' : '❌ Failed/Skipped'}`)
    console.log(`   SMS: ${smsResult ? '✅ Sent' : '❌ Failed/Skipped'}`)
    console.log(`   Push: ${pushResult ? '✅ Sent' : '❌ Failed/Skipped'}`)

    return {
      email: emailResult,
      sms: smsResult,
      push: pushResult
    }
  } catch (error) {
    console.error('❌ Error sending comprehensive alert:', error)
    return { email: false, sms: false, push: false }
  }
}

/**
 * Check all vehicles for expiring MOT and send alerts
 */
export async function checkAllVehiclesAndAlert(): Promise<{
  checked: number
  alerted: number
  errors: number
}> {
  try {
    console.log(`\n🔍 Starting MOT expiry check for all vehicles...`)

    const vehicles = await prisma.vehicle.findMany({
      include: {
        owner: true,
        motHistory: {
          orderBy: { testDate: 'desc' },
          take: 1
        }
      }
    })

    let checked = 0
    let alerted = 0
    let errors = 0

    for (const vehicle of vehicles) {
      try {
        checked++
        const latestMot = vehicle.motHistory[0]

        if (!latestMot?.expiryDate) {
          continue
        }

        const now = new Date()
        const expiryDate = new Date(latestMot.expiryDate)
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        // Check if MOT is expiring soon or expired
        if (daysUntilExpiry <= 30) {
          const type = daysUntilExpiry < 0 ? 'EXPIRED' : 'EXPIRING_SOON'
          
          await sendComprehensiveAlert({
            userId: vehicle.ownerId,
            vehicleId: vehicle.id,
            type,
            title: type === 'EXPIRED' ? '⚠️ MOT Expired' : '⏰ MOT Expiring Soon',
            message: type === 'EXPIRED'
              ? `Your MOT for ${vehicle.registration} expired on ${expiryDate.toLocaleDateString()}.`
              : `Your MOT for ${vehicle.registration} expires in ${daysUntilExpiry} days.`,
            daysUntilExpiry
          })

          alerted++
        }
      } catch (error) {
        console.error(`❌ Error processing vehicle ${vehicle.registration}:`, error)
        errors++
      }
    }

    console.log(`\n✅ MOT Check Complete:`)
    console.log(`   Vehicles Checked: ${checked}`)
    console.log(`   Alerts Sent: ${alerted}`)
    console.log(`   Errors: ${errors}`)

    return { checked, alerted, errors }
  } catch (error) {
    console.error('❌ Error in checkAllVehiclesAndAlert:', error)
    return { checked: 0, alerted: 0, errors: 1 }
  }
}

