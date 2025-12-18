import { prisma } from '@/lib/prisma'
import { EmailType } from '@prisma/client'
import type { Booking, User, Garage, Vehicle } from '@prisma/client'
import { sendBookingEmail } from './booking-email-service'

type BookingWithRelations = Booking & {
  customer: Pick<User, 'id' | 'name' | 'email' | 'phone'>
  garage: Pick<Garage, 'id' | 'name' | 'address' | 'city' | 'postcode' | 'phone' | 'email'>
  vehicle: Pick<Vehicle, 'id' | 'registration' | 'make' | 'model' | 'year'>
}

interface EmailJob {
  bookingId: string
  recipientEmail: string
  recipientName: string | null
  emailType: EmailType
  template: {
    html: string
    text: string
    subject: string
  }
}

// In-memory queue (for production, consider using Redis, Bull, or similar)
const emailQueue: EmailJob[] = []
let isProcessing = false

/**
 * Add email to queue for async processing
 */
export function queueEmail(job: EmailJob): void {
  emailQueue.push(job)
  processQueue()
}

/**
 * Process email queue
 */
async function processQueue(): Promise<void> {
  if (isProcessing || emailQueue.length === 0) {
    return
  }

  isProcessing = true

  while (emailQueue.length > 0) {
    const job = emailQueue.shift()
    if (!job) break

    try {
      await sendBookingEmail(
        job.bookingId,
        job.recipientEmail,
        job.recipientName,
        job.emailType,
        job.template
      )
    } catch (error) {
      console.error('Error processing email job:', error)
      // Optionally re-queue failed jobs
    }
  }

  isProcessing = false
}

/**
 * Schedule reminder emails for a booking
 */
export async function scheduleBookingReminders(booking: BookingWithRelations): Promise<void> {
  const bookingDate = new Date(booking.date)
  const now = new Date()

  // Calculate reminder dates
  const oneMonthBefore = new Date(bookingDate)
  oneMonthBefore.setMonth(oneMonthBefore.getMonth() - 1)

  const oneWeekBefore = new Date(bookingDate)
  oneWeekBefore.setDate(oneWeekBefore.getDate() - 7)

  const oneDayBefore = new Date(bookingDate)
  oneDayBefore.setDate(oneDayBefore.getDate() - 1)

  // Only schedule reminders if booking is in the future and confirmed
  if (bookingDate <= now || booking.status !== 'CONFIRMED') {
    return
  }

  // Schedule 1 month reminder
  if (oneMonthBefore > now) {
    await prisma.scheduledEmail.upsert({
      where: {
        bookingId_emailType: {
          bookingId: booking.id,
          emailType: 'REMINDER_1_MONTH',
        },
      },
      create: {
        bookingId: booking.id,
        emailType: 'REMINDER_1_MONTH',
        scheduledFor: oneMonthBefore,
        status: 'PENDING',
      },
      update: {
        scheduledFor: oneMonthBefore,
        status: 'PENDING',
      },
    })
  }

  // Schedule 1 week reminder
  if (oneWeekBefore > now) {
    await prisma.scheduledEmail.upsert({
      where: {
        bookingId_emailType: {
          bookingId: booking.id,
          emailType: 'REMINDER_1_WEEK',
        },
      },
      create: {
        bookingId: booking.id,
        emailType: 'REMINDER_1_WEEK',
        scheduledFor: oneWeekBefore,
        status: 'PENDING',
      },
      update: {
        scheduledFor: oneWeekBefore,
        status: 'PENDING',
      },
    })
  }

  // Schedule 1 day reminder
  if (oneDayBefore > now) {
    await prisma.scheduledEmail.upsert({
      where: {
        bookingId_emailType: {
          bookingId: booking.id,
          emailType: 'REMINDER_1_DAY',
        },
      },
      create: {
        bookingId: booking.id,
        emailType: 'REMINDER_1_DAY',
        scheduledFor: oneDayBefore,
        status: 'PENDING',
      },
      update: {
        scheduledFor: oneDayBefore,
        status: 'PENDING',
      },
    })
  }
}

/**
 * Cancel scheduled reminders for a booking
 */
export async function cancelBookingReminders(bookingId: string): Promise<void> {
  await prisma.scheduledEmail.updateMany({
    where: {
      bookingId,
      status: 'PENDING',
    },
    data: {
      status: 'CANCELLED',
    },
  })
}

/**
 * Process scheduled reminder emails (should be called by a cron job)
 */
export async function processScheduledReminders(): Promise<void> {
  const now = new Date()
  const oneMinuteFromNow = new Date(now.getTime() + 60 * 1000) // Process emails scheduled for the next minute

  const scheduledEmails = await prisma.scheduledEmail.findMany({
    where: {
      status: 'PENDING',
      scheduledFor: {
        lte: oneMinuteFromNow,
      },
    },
    include: {
      booking: {
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
      },
    },
  })

  for (const scheduledEmail of scheduledEmails) {
    try {
      // Only send if booking is still confirmed
      if (scheduledEmail.booking.status !== 'CONFIRMED') {
        await prisma.scheduledEmail.update({
          where: { id: scheduledEmail.id },
          data: { status: 'CANCELLED' },
        })
        continue
      }

      const reminderTypeMap = {
        REMINDER_1_MONTH: '1_MONTH' as const,
        REMINDER_1_WEEK: '1_WEEK' as const,
        REMINDER_1_DAY: '1_DAY' as const,
      }

      const reminderType = reminderTypeMap[scheduledEmail.emailType]
      if (!reminderType) continue

      const { sendBookingReminderToCustomer } = await import('./booking-email-service')
      await sendBookingReminderToCustomer(
        scheduledEmail.booking as BookingWithRelations,
        reminderType
      )

      // Mark as sent
      await prisma.scheduledEmail.update({
        where: { id: scheduledEmail.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      })
    } catch (error) {
      console.error(`Error processing scheduled email ${scheduledEmail.id}:`, error)
      
      // Update retry count
      const retryCount = scheduledEmail.retryCount + 1
      const maxRetries = 3

      if (retryCount >= maxRetries) {
        await prisma.scheduledEmail.update({
          where: { id: scheduledEmail.id },
          data: {
            status: 'FAILED',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            retryCount,
          },
        })
      } else {
        await prisma.scheduledEmail.update({
          where: { id: scheduledEmail.id },
          data: {
            retryCount,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        })
      }
    }
  }
}

