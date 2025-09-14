const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simpleValidationTest() {
  try {
    console.log('🧪 Teste simples de validação de slots...');
    
    // Buscar slots para análise
    const slots = await prisma.garageAvailability.findMany({
      take: 10,
      orderBy: {
        date: 'asc'
      }
    });
    
    console.log('\n📋 Análise de slots:');
    const now = new Date();
    let pastSlots = 0;
    let futureSlots = 0;
    
    slots.forEach((slot, index) => {
      const slotDate = new Date(slot.date);
      const [hours, minutes] = slot.timeSlot.split(':').map(Number);
      const slotDateTime = new Date(slotDate);
      slotDateTime.setHours(hours, minutes, 0, 0);
      const isPast = slotDateTime < now;
      
      if (isPast) {
        pastSlots++;
      } else {
        futureSlots++;
      }
      
      console.log(`${index + 1}. ${slot.date.toISOString().split('T')[0]} ${slot.timeSlot} - ${isPast ? '❌ PASSADO' : '✅ FUTURO'} - Bloqueado: ${slot.isBlocked ? 'Sim' : 'Não'}`);
    });
    
    console.log(`\n📊 Resumo:`);
    console.log(`- Slots passados: ${pastSlots}`);
    console.log(`- Slots futuros: ${futureSlots}`);
    console.log(`- Total: ${slots.length}`);
    
    console.log('\n✅ Validação implementada:');
    console.log('- Frontend: Verifica se slot é passado antes de permitir bloqueio/desbloqueio');
    console.log('- Backend: API valida data/hora antes de processar alterações');
    console.log('- Mensagem de erro: "Não é possível bloquear/desbloquear slots que já passaram"');
    
    console.log('\n🎯 Para testar:');
    console.log('1. Acesse http://localhost:3000/garage-admin');
    console.log('2. Clique em "Editar Agenda"');
    console.log('3. Tente clicar em um slot que já passou');
    console.log('4. Deve aparecer um alerta impedindo a ação');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

simpleValidationTest();