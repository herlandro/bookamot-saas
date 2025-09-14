const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSlotValidation() {
  try {
    console.log('🧪 Testando validação de slots...');
    
    // Buscar alguns slots para teste
    const slots = await prisma.garageAvailability.findMany({
      take: 5,
      orderBy: {
        date: 'asc'
      }
    });
    
    console.log('\n📋 Slots encontrados:');
    slots.forEach((slot, index) => {
      const slotDate = new Date(slot.date);
      const [hours, minutes] = slot.timeSlot.split(':').map(Number);
      const slotDateTime = new Date(slotDate);
      slotDateTime.setHours(hours, minutes, 0, 0);
      const now = new Date();
      const isPast = slotDateTime < now;
      
      console.log(`${index + 1}. ID: ${slot.id}`);
      console.log(`   Data: ${slot.date.toISOString().split('T')[0]}`);
      console.log(`   Horário: ${slot.timeSlot}`);
      console.log(`   Status: ${isPast ? '❌ PASSADO' : '✅ FUTURO'}`);
      console.log(`   Bloqueado: ${slot.isBlocked ? 'Sim' : 'Não'}`);
      console.log('');
    });
    
    // Encontrar um slot passado para teste
    const pastSlot = slots.find(slot => {
      const slotDate = new Date(slot.date);
      const [hours, minutes] = slot.timeSlot.split(':').map(Number);
      const slotDateTime = new Date(slotDate);
      slotDateTime.setHours(hours, minutes, 0, 0);
      return slotDateTime < new Date();
    });
    
    if (pastSlot) {
      console.log('🔍 Testando validação com slot passado...');
      console.log(`Slot ID: ${pastSlot.id} (${pastSlot.date.toISOString().split('T')[0]} ${pastSlot.timeSlot})`);
      
      // Simular requisição para bloquear slot passado
      const testUrl = 'http://localhost:3000/api/garage-admin/schedule';
      const response = await fetch(testUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=test' // Simulação
        },
        body: JSON.stringify({
          slotId: pastSlot.id,
          isBlocked: true
        })
      });
      
      const result = await response.json();
      console.log('📤 Resposta da API:');
      console.log(`Status: ${response.status}`);
      console.log(`Mensagem: ${result.error || result.message}`);
      
      if (response.status === 400 && result.error?.includes('já passaram')) {
        console.log('✅ Validação funcionando corretamente!');
      } else {
        console.log('❌ Validação não está funcionando como esperado.');
      }
    } else {
      console.log('ℹ️  Nenhum slot passado encontrado para teste.');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testSlotValidation();