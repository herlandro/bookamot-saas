import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkEmailLogs() {
  try {
    const logs = await prisma.emailLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        booking: {
          select: {
            bookingRef: true,
          },
        },
      },
    })

    console.log(`\n📧 Found ${logs.length} email logs:\n`)
    
    if (logs.length === 0) {
      console.log('❌ No email logs found. Emails may not have been triggered.')
      return
    }

    logs.forEach((log, index) => {
      console.log(`${index + 1}. ${log.emailType}`)
      console.log(`   To: ${log.recipientEmail}`)
      console.log(`   Status: ${log.status}`)
      console.log(`   Created: ${log.createdAt.toISOString()}`)
      if (log.errorMessage) {
        console.log(`   ❌ Error: ${log.errorMessage}`)
      }
      if (log.sentAt) {
        console.log(`   ✅ Sent: ${log.sentAt.toISOString()}`)
      }
      if (log.booking) {
        console.log(`   Booking: ${log.booking.bookingRef}`)
      }
      console.log('')
    })
  } catch (error) {
    console.error('Error checking email logs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkEmailLogs()



