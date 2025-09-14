const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listGarageOwners() {
  try {
    console.log('Buscando usuários que são proprietários de garagens...');
    
    const garageOwners = await prisma.user.findMany({
      where: {
        garage: {
          isNot: null
        }
      },
      include: {
        garage: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            isActive: true,
            motLicenseNumber: true
          }
        }
      }
    });
    
    console.log(`\n📊 Total de usuários proprietários de garagens: ${garageOwners.length}\n`);
    
    if (garageOwners.length > 0) {
      garageOwners.forEach((user, index) => {
        console.log(`${index + 1}. 👤 Usuário: ${user.name || 'Sem nome'} (${user.email})`);
        console.log(`   🏢 Garagem: ${user.garage.name}`);
        console.log(`   📧 Email da Garagem: ${user.garage.email}`);
        console.log(`   📞 Telefone: ${user.garage.phone}`);
        console.log(`   📍 Cidade: ${user.garage.city}`);
        console.log(`   🔑 Licença MOT: ${user.garage.motLicenseNumber}`);
        console.log(`   ✅ Ativa: ${user.garage.isActive ? 'Sim' : 'Não'}`);
        console.log(`   📅 Criado em: ${user.createdAt.toLocaleDateString('pt-BR')}`);
        console.log('   ' + '-'.repeat(50));
      });
    } else {
      console.log('❌ Nenhum usuário proprietário de garagem encontrado.');
    }
    
  } catch (error) {
    console.error('❌ Erro ao buscar proprietários de garagens:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listGarageOwners();