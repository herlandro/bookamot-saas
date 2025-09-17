import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const vehicleId = (await params).id;

    // For demonstration purposes, we'll skip authentication and authorization
    // In a real application, you would verify user session and vehicle access

    // Generate comprehensive mock MOT history data for demonstration
    // In a real application, this would come from an external MOT API or database
    const mockMotHistory = [
      {
        id: '1',
        testDate: '2024-03-15',
        expiryDate: '2025-03-14',
        result: 'PASS',
        mileage: 45000,
        testNumber: 'MOT2024001',
        defects: {
          dangerous: 0,
          major: 0,
          minor: 1,
          advisory: 2
        },
        details: [
          'Pneu dianteiro direito com desgaste irregular',
          'Óleo do motor próximo ao limite mínimo',
          'Limpador de para-brisa com pequeno desgaste'
        ]
      },
      {
        id: '2',
        testDate: '2023-03-10',
        expiryDate: '2024-03-09',
        result: 'PASS',
        mileage: 38000,
        testNumber: 'MOT2023001',
        defects: {
          dangerous: 0,
          major: 0,
          minor: 0,
          advisory: 1
        },
        details: [
          'Pastilhas de freio com desgaste moderado'
        ]
      },
      {
        id: '3',
        testDate: '2022-11-22',
        expiryDate: '2023-11-21',
        result: 'PASS',
        mileage: 35500,
        testNumber: 'MOT2022002',
        defects: {
          dangerous: 0,
          major: 0,
          minor: 2,
          advisory: 1
        },
        details: [
          'Pneu traseiro direito com desgaste moderado',
          'Filtro de ar necessita substituição',
          'Amortecedor dianteiro com pequeno vazamento'
        ]
      },
      {
        id: '4',
        testDate: '2022-03-08',
        expiryDate: '2023-03-07',
        result: 'FAIL',
        mileage: 31000,
        testNumber: 'MOT2022001',
        defects: {
          dangerous: 1,
          major: 2,
          minor: 0,
          advisory: 0
        },
        details: [
          'Sistema de freios com vazamento crítico',
          'Pneu traseiro esquerdo abaixo do limite legal',
          'Farol principal direito não funcional'
        ]
      },
      {
        id: '5',
        testDate: '2021-08-15',
        expiryDate: '2022-08-14',
        result: 'PASS',
        mileage: 28500,
        testNumber: 'MOT2021002',
        defects: {
          dangerous: 0,
          major: 0,
          minor: 1,
          advisory: 3
        },
        details: [
          'Correia do alternador com desgaste',
          'Óleo da transmissão próximo ao limite',
          'Pneus dianteiros com desgaste irregular',
          'Bateria com baixa capacidade'
        ]
      },
      {
        id: '6',
        testDate: '2021-03-05',
        expiryDate: '2022-03-04',
        result: 'PASS',
        mileage: 24000,
        testNumber: 'MOT2021001',
        defects: {
          dangerous: 0,
          major: 0,
          minor: 0,
          advisory: 0
        },
        details: []
      },
      {
        id: '7',
        testDate: '2020-09-12',
        expiryDate: '2021-09-11',
        result: 'ADVISORY',
        mileage: 21500,
        testNumber: 'MOT2020002',
        defects: {
          dangerous: 0,
          major: 0,
          minor: 0,
          advisory: 4
        },
        details: [
          'Pastilhas de freio com 30% de desgaste',
          'Pneus traseiros próximos ao limite legal',
          'Filtro de combustível necessita substituição',
          'Lâmpada da placa traseira com baixa luminosidade'
        ]
      },
      {
        id: '8',
        testDate: '2020-03-01',
        expiryDate: '2021-02-28',
        result: 'PASS',
        mileage: 18000,
        testNumber: 'MOT2020001',
        defects: {
          dangerous: 0,
          major: 0,
          minor: 1,
          advisory: 1
        },
        details: [
          'Óleo do motor próximo ao limite mínimo',
          'Limpador traseiro com pequeno desgaste'
        ]
      },
      {
        id: '9',
        testDate: '2019-07-20',
        expiryDate: '2020-07-19',
        result: 'FAIL',
        mileage: 15500,
        testNumber: 'MOT2019002',
        defects: {
          dangerous: 0,
          major: 1,
          minor: 2,
          advisory: 1
        },
        details: [
          'Sistema de escape com vazamento significativo',
          'Pneu dianteiro esquerdo com corte lateral',
          'Amortecedor traseiro direito com vazamento',
          'Filtro de ar muito sujo'
        ]
      },
      {
        id: '10',
        testDate: '2019-02-28',
        expiryDate: '2020-02-27',
        result: 'PASS',
        mileage: 12000,
        testNumber: 'MOT2019001',
        defects: {
          dangerous: 0,
          major: 0,
          minor: 0,
          advisory: 2
        },
        details: [
          'Correia da direção hidráulica com pequeno desgaste',
          'Fluido de freio próximo ao limite mínimo'
        ]
      },
      {
        id: '11',
        testDate: '2018-10-15',
        expiryDate: '2019-10-14',
        result: 'PASS',
        mileage: 9500,
        testNumber: 'MOT2018002',
        defects: {
          dangerous: 0,
          major: 0,
          minor: 0,
          advisory: 1
        },
        details: [
          'Pneus com desgaste mínimo mas uniforme'
        ]
      },
      {
        id: '12',
        testDate: '2018-02-10',
        expiryDate: '2019-02-09',
        result: 'PASS',
        mileage: 6000,
        testNumber: 'MOT2018001',
        defects: {
          dangerous: 0,
          major: 0,
          minor: 0,
          advisory: 0
        },
        details: []
      }
    ];

    return NextResponse.json(mockMotHistory);
  } catch (error) {
    console.error('Error fetching MOT history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}