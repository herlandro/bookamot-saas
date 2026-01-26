import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Hash password
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

async function main() {
  console.log('🌱 Starting database seeding...\n')

  // Clear existing data (in correct order to respect foreign keys)
  console.log('🗑️  Cleaning existing data...')
  await prisma.review.deleteMany()
  await prisma.motNotification.deleteMany()
  await prisma.emailLog.deleteMany()
  await prisma.scheduledEmail.deleteMany()
  await prisma.motResult.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.garageTimeSlotBlock.deleteMany()
  await prisma.garageScheduleException.deleteMany()
  await prisma.garageSchedule.deleteMany()
  await prisma.motHistory.deleteMany()
  await prisma.garageApprovalLog.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.garage.deleteMany()
  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()
  console.log('✅ Existing data cleaned\n')

  // Create admin user
  console.log('👤 Creating admin user...')
  const adminPassword = await hashPassword('admin123!')
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@bookamot.co.uk' },
    update: {
      name: 'Admin',
      password: adminPassword,
      role: UserRole.ADMIN
    },
    create: {
      name: 'Admin',
      email: 'admin@bookamot.co.uk',
      password: adminPassword,
      role: UserRole.ADMIN
    }
  })
  console.log(`✅ Admin user created: ${adminUser.email}\n`)

  console.log('✨ Database seeding completed successfully!\n')
  console.log('📊 Summary:')
  console.log(`   - 1 admin user`)
  console.log('\n🔑 Admin Credentials:')
  console.log('   Email: admin@bookamot.co.uk')
  console.log('   Password: admin123!')
  console.log('\n💡 To add more admin users, run: npm run admin:add')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
