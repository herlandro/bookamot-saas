const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGarageOwner() {
  try {
    const garage = await prisma.garage.findFirst({
      where: { name: 'Stevenage MOT Centre' },
      include: { owner: true }
    });
    
    if (garage) {
      console.log('Garage ID:', garage.id);
      console.log('Garage name:', garage.name);
      console.log('Owner ID:', garage.ownerId);
      console.log('Owner email:', garage.owner?.email);
      console.log('Owner name:', garage.owner?.name);
    } else {
      console.log('Garage not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGarageOwner();