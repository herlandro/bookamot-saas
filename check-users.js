const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        name: true
      }
    });
    
    console.log('Users in database:');
    console.log(JSON.stringify(users, null, 2));
    
    const garages = await prisma.garage.findMany({
      select: {
        id: true,
        name: true,
        ownerId: true,
        owner: {
          select: {
            email: true,
            role: true
          }
        }
      }
    });
    
    console.log('\nGarages in database:');
    console.log(JSON.stringify(garages, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();