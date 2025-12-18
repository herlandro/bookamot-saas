import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'
import { EmailType, EmailStatus } from '@prisma/client'
import type { Booking, User, Garage, Vehicle } from '@prisma/client'

type BookingWithRelations = Booking & {
  customer: Pick<User, 'id' | 'name' | 'email' | 'phone'>
  garage: Pick<Garage, 'id' | 'name' | 'address' | 'city' | 'postcode' | 'phone' | 'email'>
  vehicle: Pick<Vehicle, 'id' | 'registration' | 'make' | 'model' | 'year'>
}

interface EmailTemplate {
  html: string
  text: string
  subject: string
}

// Validate SMTP configuration
function validateSMTPConfig(): boolean {
  const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM']
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    console.error('❌ Missing SMTP environment variables:', missing.join(', '))
    console.error('Please configure SMTP settings in your .env file')
    return false
  }
  
  return true
}

// Get or create email transporter (lazy initialization)
function getTransporter(): nodemailer.Transporter | null {
  if (!validateSMTPConfig()) {
    return null
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
    
    console.log('✅ SMTP transporter created successfully')
    console.log(`   Host: ${process.env.SMTP_HOST}`)
    console.log(`   Port: ${process.env.SMTP_PORT || '587'}`)
    console.log(`   User: ${process.env.SMTP_USER}`)
    
    return transporter
  } catch (error) {
    console.error('❌ Error creating email transporter:', error)
    return null
  }
}

// Maximum retry attempts
const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAY_MS = 5000 // 5 seconds

/**
 * Send email with logging and retry logic
 */
export async function sendBookingEmail(
  bookingId: string,
  recipientEmail: string,
  recipientName: string | null,
  emailType: EmailType,
  template: EmailTemplate
): Promise<{ success: boolean; emailLogId: string; error?: string }> {
  // Get transporter (lazy initialization)
  const transporter = getTransporter()
  
  // Check if transporter is configured
  if (!transporter) {
    const errorMsg = 'SMTP transporter not configured. Please check your environment variables.'
    console.error('❌', errorMsg)
    console.error('   Current env vars:', {
      SMTP_HOST: process.env.SMTP_HOST ? 'SET' : 'NOT SET',
      SMTP_USER: process.env.SMTP_USER ? 'SET' : 'NOT SET',
      SMTP_PASS: process.env.SMTP_PASS ? 'SET' : 'NOT SET',
      SMTP_FROM: process.env.SMTP_FROM ? 'SET' : 'NOT SET',
    })
    
    // Still create log entry to track the attempt
    const emailLog = await prisma.emailLog.create({
      data: {
        bookingId,
        recipientEmail,
        recipientName,
        emailType,
        subject: template.subject,
        status: EmailStatus.FAILED,
        errorMessage: errorMsg,
        retryCount: 0,
      },
    })
    
    return { success: false, emailLogId: emailLog.id, error: errorMsg }
  }

  // Create email log entry
  const emailLog = await prisma.emailLog.create({
    data: {
      bookingId,
      recipientEmail,
      recipientName,
      emailType,
      subject: template.subject,
      status: EmailStatus.PENDING,
    },
  })

  let lastError: string | undefined

  // Retry logic
  for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      await transporter!.sendMail({
        from: `"BookaMOT" <${process.env.SMTP_FROM}>`,
        to: recipientEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      })

      // Update log as sent
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: EmailStatus.SENT,
          sentAt: new Date(),
          retryCount: attempt,
        },
      })

      console.log(`✅ Email sent successfully: ${emailType} to ${recipientEmail}`)
      return { success: true, emailLogId: emailLog.id }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error'
      
      // Log the error
      console.error(`❌ Email send attempt ${attempt + 1} failed for ${emailType} to ${recipientEmail}:`, error)

      // If this is not the last attempt, wait before retrying
      if (attempt < MAX_RETRY_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)))
      }
    }
  }

  // All retries failed
  await prisma.emailLog.update({
    where: { id: emailLog.id },
    data: {
      status: EmailStatus.FAILED,
      errorMessage: lastError,
      retryCount: MAX_RETRY_ATTEMPTS,
    },
  })

  return { success: false, emailLogId: emailLog.id, error: lastError }
}

/**
 * Send booking confirmation to customer
 */
export async function sendBookingConfirmationToCustomer(
  booking: BookingWithRelations
): Promise<void> {
  const { getBookingConfirmationCustomerTemplate } = await import('./booking-templates')
  const template = getBookingConfirmationCustomerTemplate(booking)

  await sendBookingEmail(
    booking.id,
    booking.customer.email,
    booking.customer.name,
    EmailType.BOOKING_CONFIRMATION_CUSTOMER,
    template
  )
}

/**
 * Send booking notification to garage
 */
export async function sendBookingNotificationToGarage(
  booking: BookingWithRelations
): Promise<void> {
  const { getBookingNotificationGarageTemplate } = await import('./booking-templates')
  const template = getBookingNotificationGarageTemplate(booking)

  await sendBookingEmail(
    booking.id,
    booking.garage.email,
    booking.garage.name,
    EmailType.BOOKING_NOTIFICATION_GARAGE,
    template
  )
}

/**
 * Send booking approved email to customer
 */
export async function sendBookingApprovedToCustomer(
  booking: BookingWithRelations
): Promise<void> {
  const { getBookingApprovedTemplate } = await import('./booking-templates')
  const template = getBookingApprovedTemplate(booking)

  await sendBookingEmail(
    booking.id,
    booking.customer.email,
    booking.customer.name,
    EmailType.BOOKING_APPROVED,
    template
  )
}

/**
 * Send booking rejected email to customer
 */
export async function sendBookingRejectedToCustomer(
  booking: BookingWithRelations,
  reason?: string
): Promise<void> {
  const { getBookingRejectedTemplate } = await import('./booking-templates')
  const template = getBookingRejectedTemplate(booking, reason)

  await sendBookingEmail(
    booking.id,
    booking.customer.email,
    booking.customer.name,
    EmailType.BOOKING_REJECTED,
    template
  )
}

/**
 * Send booking reminder to customer
 */
export async function sendBookingReminderToCustomer(
  booking: BookingWithRelations,
  reminderType: '1_MONTH' | '1_WEEK' | '1_DAY'
): Promise<void> {
  const { getBookingReminderTemplate } = await import('./booking-templates')
  const template = getBookingReminderTemplate(booking, reminderType)

  const emailTypeMap = {
    '1_MONTH': EmailType.BOOKING_REMINDER_1_MONTH,
    '1_WEEK': EmailType.BOOKING_REMINDER_1_WEEK,
    '1_DAY': EmailType.BOOKING_REMINDER_1_DAY,
  }

  await sendBookingEmail(
    booking.id,
    booking.customer.email,
    booking.customer.name,
    emailTypeMap[reminderType],
    template
  )
}

/**
 * Send booking completed follow-up to customer
 */
export async function sendBookingCompletedFollowupToCustomer(
  booking: BookingWithRelations,
  motResult?: {
    result: string
    certificateNumber?: string
    expiryDate?: Date
  }
): Promise<void> {
  const { getBookingCompletedFollowupTemplate } = await import('./booking-templates')
  const template = getBookingCompletedFollowupTemplate(booking, motResult)

  await sendBookingEmail(
    booking.id,
    booking.customer.email,
    booking.customer.name,
    EmailType.BOOKING_COMPLETED_FOLLOWUP,
    template
  )
}

/**
 * Get email logs for a booking
 */
export async function getEmailLogsForBooking(bookingId: string) {
  return await prisma.emailLog.findMany({
    where: { bookingId },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Get email statistics
 */
export async function getEmailStatistics(filters?: {
  emailType?: EmailType
  status?: EmailStatus
  startDate?: Date
  endDate?: Date
}) {
  const where: any = {}

  if (filters?.emailType) {
    where.emailType = filters.emailType
  }

  if (filters?.status) {
    where.status = filters.status
  }

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {}
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate
    }
  }

  const [total, sent, failed, pending] = await Promise.all([
    prisma.emailLog.count({ where }),
    prisma.emailLog.count({ where: { ...where, status: EmailStatus.SENT } }),
    prisma.emailLog.count({ where: { ...where, status: EmailStatus.FAILED } }),
    prisma.emailLog.count({ where: { ...where, status: EmailStatus.PENDING } }),
  ])

  return {
    total,
    sent,
    failed,
    pending,
    successRate: total > 0 ? (sent / total) * 100 : 0,
  }
}

