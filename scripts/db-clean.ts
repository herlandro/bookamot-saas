import { PrismaClient } from '@prisma/client'
import * as readline from 'readline'

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
    rl.close()
    return
  }

  console.log('\n🗑️  Starting database cleanup...\n')

  try {
    // Delete in correct order to respect foreign key constraints
    console.log('   Deleting reviews...')
    const reviewsDeleted = await prisma.review.deleteMany()
    console.log(`   ✅ Deleted ${reviewsDeleted.count} reviews`)

    console.log('   Deleting MOT results...')
    const motResultsDeleted = await prisma.motResult.deleteMany()
    console.log(`   ✅ Deleted ${motResultsDeleted.count} MOT results`)

    console.log('   Deleting bookings...')
    const bookingsDeleted = await prisma.booking.deleteMany()
    console.log(`   ✅ Deleted ${bookingsDeleted.count} bookings`)

    console.log('   Deleting garage time slot blocks...')
    const timeSlotBlocksDeleted = await prisma.garageTimeSlotBlock.deleteMany()
    console.log(`   ✅ Deleted ${timeSlotBlocksDeleted.count} time slot blocks`)

    console.log('   Deleting garage schedule exceptions...')
    const scheduleExceptionsDeleted = await prisma.garageScheduleException.deleteMany()
    console.log(`   ✅ Deleted ${scheduleExceptionsDeleted.count} schedule exceptions`)

    console.log('   Deleting garage schedules...')
    const schedulesDeleted = await prisma.garageSchedule.deleteMany()
    console.log(`   ✅ Deleted ${schedulesDeleted.count} garage schedules`)

    console.log('   Deleting MOT history...')
    const motHistoryDeleted = await prisma.motHistory.deleteMany()
    console.log(`   ✅ Deleted ${motHistoryDeleted.count} MOT history records`)

    console.log('   Deleting vehicles...')
    const vehiclesDeleted = await prisma.vehicle.deleteMany()
    console.log(`   ✅ Deleted ${vehiclesDeleted.count} vehicles`)

    console.log('   Deleting garages...')
    const garagesDeleted = await prisma.garage.deleteMany()
    console.log(`   ✅ Deleted ${garagesDeleted.count} garages`)

    console.log('   Deleting accounts...')
    const accountsDeleted = await prisma.account.deleteMany()
    console.log(`   ✅ Deleted ${accountsDeleted.count} accounts`)

    console.log('   Deleting sessions...')
    const sessionsDeleted = await prisma.session.deleteMany()
    console.log(`   ✅ Deleted ${sessionsDeleted.count} sessions`)

    console.log('   Deleting verification tokens...')
    const tokensDeleted = await prisma.verificationToken.deleteMany()
    console.log(`   ✅ Deleted ${tokensDeleted.count} verification tokens`)

    console.log('   Deleting users...')
    const usersDeleted = await prisma.user.deleteMany()
    console.log(`   ✅ Deleted ${usersDeleted.count} users`)

    console.log('\n✨ Database cleaned successfully!')
    console.log('\n📊 Summary:')
    console.log(`   - ${usersDeleted.count} users deleted`)
    console.log(`   - ${vehiclesDeleted.count} vehicles deleted`)
    console.log(`   - ${garagesDeleted.count} garages deleted`)
    console.log(`   - ${bookingsDeleted.count} bookings deleted`)
    console.log(`   - ${reviewsDeleted.count} reviews deleted`)
    console.log(`   - ${motResultsDeleted.count} MOT results deleted`)
    console.log(`   - ${motHistoryDeleted.count} MOT history records deleted`)
    console.log(`   - ${accountsDeleted.count} accounts deleted`)
    console.log(`   - ${sessionsDeleted.count} sessions deleted`)
    console.log(`   - ${schedulesDeleted.count} garage schedules deleted`)
    console.log(`   - ${scheduleExceptionsDeleted.count} schedule exceptions deleted`)
    console.log(`   - ${timeSlotBlocksDeleted.count} time slot blocks deleted`)
    console.log(`   - ${tokensDeleted.count} verification tokens deleted`)

  } catch (error) {
    console.error('\n❌ Error cleaning database:', error)
    process.exit(1)
  } finally {
    rl.close()
  }
}

cleanDatabase()
  .catch((e) => {
    console.error('❌ Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

