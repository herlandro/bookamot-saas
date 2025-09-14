const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function testLogin() {
  try {
    // Verificar se o usuário existe e tem senha
    const user = await prisma.user.findUnique({
      where: { email: 'info@stevenagmot.co.uk' }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User found:');
    console.log('- ID:', user.id);
    console.log('- Email:', user.email);
    console.log('- Name:', user.name);
    console.log('- Role:', user.role);
    console.log('- Has password:', !!user.password);
    
    // Verificar se a senha funciona
    if (user.password) {
      const testPassword = 'password123';
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log('- Password test (password123):', isValid ? 'VALID' : 'INVALID');
      
      if (!isValid) {
        console.log('\nTrying to set a known password...');
        const hashedPassword = await bcrypt.hash('password123', 12);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        });
        console.log('Password updated to: password123');
      }
    }
    
    // Verificar a garagem do usuário
    const garage = await prisma.garage.findFirst({
      where: { ownerId: user.id }
    });
    
    if (garage) {
      console.log('\nGarage found:');
      console.log('- ID:', garage.id);
      console.log('- Name:', garage.name);
      
      // Verificar bookings para esta garagem
      const bookings = await prisma.booking.findMany({
        where: { garageId: garage.id },
        include: {
          customer: true,
          vehicle: true
        }
      });
      
      console.log('\nBookings for this garage:', bookings.length);
      bookings.forEach(booking => {
        console.log(`- Booking ${booking.id}: ${booking.date} ${booking.timeSlot} (${booking.status})`);
      });
    } else {
      console.log('\nNo garage found for this user');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();