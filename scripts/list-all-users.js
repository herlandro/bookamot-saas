const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listAllUsers() {
  try {
    console.log('🔍 Buscando todos os usuários...');
    
    // Buscar todos os usuários
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        garage: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    console.log(`\n📊 Total de usuários encontrados: ${allUsers.length}`);
    
    // Separar usuários com e sem garagem
    const usersWithGarage = allUsers.filter(user => user.garage);
    const usersWithoutGarage = allUsers.filter(user => !user.garage);
    
    console.log(`\n🏢 Usuários que são proprietários de garagens: ${usersWithGarage.length}`);
    console.log(`👤 Usuários que NÃO são proprietários de garagens: ${usersWithoutGarage.length}`);
    
    if (usersWithoutGarage.length > 0) {
      console.log('\n=== USUÁRIOS QUE NÃO SÃO PROPRIETÁRIOS DE GARAGENS ===');
      usersWithoutGarage.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.name || 'Nome não informado'}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👤 Role: ${user.role}`);
        console.log(`   📅 Criado em: ${user.createdAt.toLocaleDateString('pt-BR')}`);
      });
    } else {
      console.log('\n✅ Todos os usuários cadastrados são proprietários de garagens.');
    }
    
    if (usersWithGarage.length > 0) {
      console.log('\n=== RESUMO DOS PROPRIETÁRIOS DE GARAGENS ===');
      usersWithGarage.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} - ${user.garage.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao buscar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listAllUsers();