const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function testGarageLogin() {
  try {
    // Find the Stevenage MOT Centre owner
    const garage = await prisma.garage.findFirst({
      where: {
        name: 'Stevenage MOT Centre'
      },
      include: {
        owner: true
      }
    });
    
    if (!garage) {
      console.log('Garage not found');
      return;
    }
    
    console.log('Garage found:');
    console.log(`Name: ${garage.name}`);
    console.log(`Owner: ${garage.owner.email}`);
    console.log(`Role: ${garage.owner.role}`);
    
    // Check if user has a password
    if (!garage.owner.password) {
      console.log('\nUser has no password set. Setting a test password...');
      
      const hashedPassword = await bcrypt.hash('testpassword123', 12);
      
      await prisma.user.update({
        where: {
          id: garage.owner.id
        },
        data: {
          password: hashedPassword
        }
      });
      
      console.log('Password set successfully!');
      console.log('You can now login with:');
      console.log(`Email: ${garage.owner.email}`);
      console.log('Password: testpassword123');
    } else {
      console.log('\nUser already has a password set.');
      console.log('Login credentials:');
      console.log(`Email: ${garage.owner.email}`);
      console.log('Password: [existing password]');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testGarageLogin();