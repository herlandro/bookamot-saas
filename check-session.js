const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSession() {
  try {
    // Verificar todos os usuários
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });
    
    console.log('\n=== TODOS OS USUÁRIOS ===');
    users.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.name}`);
      console.log(`Role: ${user.role}`);
      console.log('---');
    });
    
    // Verificar garagens e seus donos
    const garages = await prisma.garage.findMany({
      include: {
        owner: true
      }
    });
    
    console.log('\n=== GARAGENS E DONOS ===');
    garages.forEach(garage => {
      console.log(`Garage: ${garage.name}`);
      console.log(`Owner ID: ${garage.ownerId}`);
      console.log(`Owner Email: ${garage.owner?.email}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSession();