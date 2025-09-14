const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSlots() {
  try {
    const count = await prisma.garageAvailability.count();
    console.log('Total de slots disponíveis:', count);
    
    const sampleSlots = await prisma.garageAvailability.findMany({
      take: 5,
      select: {
        id: true,
        date: true,
        timeSlot: true,
        isBooked: true,
        isBlocked: true
      }
    });
    
    console.log('Exemplos de slots:');
    sampleSlots.forEach(slot => {
      console.log(`- ${slot.date.toISOString().split('T')[0]} ${slot.timeSlot} (Reservado: ${slot.isBooked}, Bloqueado: ${slot.isBlocked})`);
    });
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSlots();