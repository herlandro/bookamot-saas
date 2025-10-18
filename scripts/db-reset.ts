import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
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

async function resetDatabase() {
  console.log('⚠️  WARNING: This will delete ALL data and reseed the database!')
  console.log('   This action cannot be undone.\n')
  
  const answer = await askQuestion('Are you sure you want to continue? (yes/no): ')
  
  if (answer.toLowerCase() !== 'yes') {
    console.log('\n❌ Database reset cancelled.')
    rl.close()
    return
  }

  console.log('\n🔄 Starting database reset...\n')

  try {
    // Step 1: Clean the database
    console.log('📍 Step 1/2: Cleaning database...\n')
    
    console.log('   Deleting reviews...')
    await prisma.review.deleteMany()
    
    console.log('   Deleting MOT results...')
    await prisma.motResult.deleteMany()
    
    console.log('   Deleting bookings...')
    await prisma.booking.deleteMany()
    
    console.log('   Deleting garage time slot blocks...')
    await prisma.garageTimeSlotBlock.deleteMany()
    
    console.log('   Deleting garage schedule exceptions...')
    await prisma.garageScheduleException.deleteMany()
    
    console.log('   Deleting garage schedules...')
    await prisma.garageSchedule.deleteMany()
    
    console.log('   Deleting MOT history...')
    await prisma.motHistory.deleteMany()
    
    console.log('   Deleting vehicles...')
    await prisma.vehicle.deleteMany()
    
    console.log('   Deleting garages...')
    await prisma.garage.deleteMany()
    
    console.log('   Deleting accounts...')
    await prisma.account.deleteMany()
    
    console.log('   Deleting sessions...')
    await prisma.session.deleteMany()
    
    console.log('   Deleting verification tokens...')
    await prisma.verificationToken.deleteMany()
    
    console.log('   Deleting users...')
    await prisma.user.deleteMany()
    
    console.log('\n✅ Database cleaned successfully!\n')

    // Close readline before running seed
    rl.close()

    // Step 2: Seed the database
    console.log('📍 Step 2/2: Seeding database...\n')
    
    // Run the seed script
    execSync('tsx prisma/seed.ts', { stdio: 'inherit' })
    
    console.log('\n✨ Database reset completed successfully!')
    console.log('\n🎉 Your database is now clean and seeded with fresh data!')
    console.log('\n🔑 Test Credentials:')
    console.log('   Customer: See md/docs/SEED_DATA_CREDENTIALS.md')
    console.log('   Password: password123 (customers) / garage123 (garages)')

  } catch (error) {
    console.error('\n❌ Error resetting database:', error)
    process.exit(1)
  }
}

resetDatabase()
  .catch((e) => {
    console.error('❌ Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

