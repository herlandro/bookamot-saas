// Script para adicionar garagens de teste ao banco de dados
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  console.log('Iniciando seed de garagens de teste...');

  // Dados das garagens de teste
  const garageData = [
    {
      garage: {
        name: 'Stevenage MOT Center',
        address: '123 High Street',
        city: 'Stevenage',
        postcode: 'SG1 1AB',
        phone: '01438 123456',
        email: 'stevenage@test.com',
        motPrice: 5499, // £54.99
        latitude: 51.9025,
        longitude: -0.2021,
        dvlaApproved: true,
        motLicenseNumber: 'MOT12345',
      },
      owner: {
        name: 'John Smith',
        email: 'john.smith@test.com',
        password: 'password123',
        role: 'GARAGE_OWNER',
      }
    },
    {
      garage: {
        name: 'Hitchin Auto Services',
        address: '45 Queen Street',
        city: 'Hitchin',
        postcode: 'SG4 9TZ',
        phone: '01462 987654',
        email: 'hitchin@test.com',
        motPrice: 4999, // £49.99
        latitude: 51.9489,
        longitude: -0.2881,
        dvlaApproved: true,
        motLicenseNumber: 'MOT67890',
      },
      owner: {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@test.com',
        password: 'password123',
        role: 'GARAGE_OWNER',
      }
    },
    {
      garage: {
        name: 'Letchworth Garage',
        address: '78 Station Road',
        city: 'Letchworth',
        postcode: 'SG6 3BQ',
        phone: '01462 456789',
        email: 'letchworth@test.com',
        motPrice: 5299, // £52.99
        latitude: 51.9781,
        longitude: -0.2281,
        dvlaApproved: true,
        motLicenseNumber: 'MOT24680',
      },
      owner: {
        name: 'David Brown',
        email: 'david.brown@test.com',
        password: 'password123',
        role: 'GARAGE_OWNER',
      }
    },
    {
      garage: {
        name: 'London Central MOT',
        address: '10 Baker Street',
        city: 'London',
        postcode: 'W1U 6TT',
        phone: '020 7123 4567',
        email: 'london@test.com',
        motPrice: 6499, // £64.99
        latitude: 51.5074,
        longitude: -0.1278,
        dvlaApproved: true,
        motLicenseNumber: 'MOT13579',
      },
      owner: {
        name: 'Emma Wilson',
        email: 'emma.wilson@test.com',
        password: 'password123',
        role: 'GARAGE_OWNER',
      }
    },
  ];

  for (const data of garageData) {
    // Verificar se o usuário já existe
    let owner = await prisma.user.findUnique({
      where: {
        email: data.owner.email,
      },
    });

    if (!owner) {
      const hashedPassword = await bcrypt.hash(data.owner.password, 10);
      owner = await prisma.user.create({
        data: {
          name: data.owner.name,
          email: data.owner.email,
          password: hashedPassword,
          role: data.owner.role,
        },
      });
      console.log(`Usuário criado: ${data.owner.name}`);
    } else {
      console.log(`Usuário já existe: ${data.owner.email}`);
    }

    // Verificar se a garagem já existe
    const existingGarage = await prisma.garage.findFirst({
      where: {
        email: data.garage.email,
      },
    });

    if (!existingGarage) {
      await prisma.garage.create({
        data: {
          ...data.garage,
          ownerId: owner.id,
        },
      });
      console.log(`Garagem criada: ${data.garage.name}`);
    } else {
      console.log(`Garagem já existe: ${data.garage.name}`);
    }
  }

  console.log('Seed de garagens de teste concluído!');
}

main()
  .catch((e) => {
    console.error('Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });