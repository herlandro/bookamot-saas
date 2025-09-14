const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearGarageAvailability() {
  try {
    console.log('Removendo todos os dados da tabela GarageAvailability...');
    
    const result = await prisma.garageAvailability.deleteMany({});
    
    console.log(`✅ ${result.count} registros removidos da tabela GarageAvailability`);
  } catch (error) {
    console.error('❌ Erro ao remover dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearGarageAvailability();