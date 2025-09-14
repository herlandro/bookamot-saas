const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAuthFlow() {
  try {
    console.log('=== Testing Authentication Flow ===');
    
    // 1. Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: 'info@stevenagmot.co.uk' }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hasPassword: !!user.password
    });
    
    // 2. Test password
    const isPasswordValid = await bcrypt.compare('password123', user.password || '');
    console.log('✅ Password valid:', isPasswordValid);
    
    // 3. Check garage
    const garage = await prisma.garage.findFirst({
      where: { ownerId: user.id }
    });
    
    if (!garage) {
      console.log('❌ No garage found for user');
      return;
    }
    
    console.log('✅ Garage found:', {
      id: garage.id,
      name: garage.name,
      ownerId: garage.ownerId
    });
    
    // 4. Check bookings
    const bookings = await prisma.booking.findMany({
      where: { garageId: garage.id },
      include: {
        customer: { select: { name: true, email: true } },
        vehicle: { select: { registration: true, make: true, model: true } }
      }
    });
    
    console.log('✅ Bookings found:', bookings.length);
    bookings.forEach((booking, index) => {
      console.log(`  ${index + 1}. ${booking.reference} - ${booking.status} - ${booking.date}`);
    });
    
    console.log('\n=== Auth Flow Test Complete ===');
    
  } catch (error) {
    console.error('❌ Error in auth flow test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuthFlow();