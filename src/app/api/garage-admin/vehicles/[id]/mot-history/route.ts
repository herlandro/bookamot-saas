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
          'Front right tyre with irregular wear',
          'Engine oil near minimum limit',
          'Windscreen wiper with minor wear'
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
          'Brake pads with moderate wear'
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
          'Rear right tyre with moderate wear',
          'Air filter needs replacement',
          'Front shock absorber with minor leak'
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
          'Brake system with critical leak',
          'Left rear tyre below legal limit',
          'Right main headlight not functional'
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
          'Alternator belt worn',
          'Transmission oil near limit',
          'Front tyres with uneven wear',
          'Battery with low capacity'
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
          'Brake pads with 30% wear',
          'Rear tyres near legal limit',
          'Fuel filter needs replacement',
          'Rear number plate lamp with low brightness'
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
          'Engine oil near minimum limit',
          'Rear wiper with minor wear'
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
          'Exhaust system with significant leak',
          'Front left tyre with sidewall cut',
          'Rear right shock absorber with leak',
          'Air filter very dirty'
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
          'Power steering belt with minor wear',
          'Brake fluid near minimum limit'
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
          'Tyres with minimal but even wear'
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