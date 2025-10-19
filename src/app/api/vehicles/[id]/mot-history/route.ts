import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { motCache, generateMotCacheKey, generateDvsaCacheKey } from '@/lib/cache/mot-cache'
import { checkAndNotifyMotStatus } from '@/lib/services/mot-notification-service'

// DVSA API Configuration
const DVSA_API_BASE_URL = 'https://history.mot.api.gov.uk/v1/trade/vehicles'
const DVSA_API_KEY = process.env.DVSA_API_KEY || 'Y65dFlmMDD1wgqGNnyGJ95QYK813NRjvarLCrsX0'
const DVSA_API_TOKEN = process.env.DVSA_API_TOKEN || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6InlFVXdtWFdMMTA3Q2MtN1FaMldTYmVPYjNzUSIsImtpZCI6InlFVXdtWFdMMTA3Q2MtN1FaMldTYmVPYjNzUSJ9.eyJhdWQiOiJodHRwczovL3RhcGkuZHZzYS5nb3YudWsiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9hNDU1YjgyNy0yNDRmLTRjOTctYjViNC1jZTVkMTNiNGQwMGMvIiwiaWF0IjoxNzYwODY4NDA5LCJuYmYiOjE3NjA4Njg0MDksImV4cCI6MTc2MDg3MjMwOSwiYWlvIjoiazJKZ1lKQm5DQzk3ZGpIWjQ4aWh3d1czT0RpRkFBPT0iLCJhcHBpZCI6IjdhZDAyZjljLTVlODUtNDM4MS04ZjI0LWMyYmQzNDQwNzI3YSIsImFwcGlkYWNyIjoiMSIsImlkcCI6Imh0dHBzOi8vc3RzLndpbmRvd3MubmV0L2E0NTViODI3LTI0NGYtNGM5Ny1iNWI0LWNlNWQxM2I0ZDAwYy8iLCJvaWQiOiJhZDVmY2UzNS0xM2I5LTQzOGEtYmE3YS00MTI3ZmNhMzI5YmIiLCJyaCI6IjEuQVVjQUo3aFZwRThrbDB5MXRNNWRFN1RRREZSR2EtSU5mSTFKbTNjbFJzczdYeGhIQUFCSEFBLiIsInJvbGVzIjpbInRhcGkucHVibGljIl0sInN1YiI6ImFkNWZjZTM1LTEzYjktNDM4YS1iYTdhLTQxMjdmY2EzMjliYiIsInRpZCI6ImE0NTViODI3LTI0NGYtNGM5Ny1iNWI0LWNlNWQxM2I0ZDAwYyIsInV0aSI6IkdNNlhtbjVGeVVtM014c3R3Y0ZyQUEiLCJ2ZXIiOiIxLjAiLCJ4bXNfZnRkIjoiRGFSbWNPM3REbnRtSXBlMXI5aWQ1TWRHQklQT2FmVHZfNVYtaDhDT2xwSUJaWFZ5YjNCbGJtOXlkR2d0WkhOdGN3In0.dbClwQEw-CiSFf3bgEkRk2JflGqz3iSGzMpRWUOXae4amECuelTTql1oOMhVTs_Z6t4J9Ft6f3f7m07cQM-SBZOsvrsSmvRGH_CSzyCfjv6gWxRmMXmSggSJCrA_y1aa4X1emIztwQ_mmhM3eLWINezVvfUW4Jwjy3t6Egxw01bMfOqIWbFA76fc2uVuQ2sRBei7kfPkz42nEL6C3ljybd1G2fQJaKAQLucAc2WpVHSMBpjhPHNpY1Rp2iZgpf--MViz3V9meXn7XBoqzSttN3yRakAxtyLDf6SeRQ7o9ATT2b0YAOYFd07AeTqmHMu2j9xZZKlvsjio3p8jW6KbWg'

// Mock MOT history data for demonstration (fallback)
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
  }
]

// Helper function to fetch MOT history from DVSA API
async function fetchMotHistoryFromDVSA(registration: string) {
  try {
    console.log(`🔍 Fetching MOT history from DVSA for registration: ${registration}`)

    const url = `${DVSA_API_BASE_URL}/registration/${registration}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DVSA_API_TOKEN}`,
        'x-api-key': DVSA_API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error(`❌ DVSA API error: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()
    console.log(`✅ Successfully fetched MOT data from DVSA for ${registration}`)
    console.log(`📊 Found ${data.motTests?.length || 0} MOT records`)

    return data
  } catch (error) {
    console.error('❌ Error fetching from DVSA API:', error)
    return null
  }
}

// Helper function to transform DVSA data to our format
function transformDVSAData(dvsaData: any): any[] {
  if (!dvsaData.motTests || !Array.isArray(dvsaData.motTests)) {
    return []
  }

  return dvsaData.motTests.map((test: any) => {
    // Count defects by type
    const defects = test.defects || []
    const dangerousCount = defects.filter((d: any) => d.dangerous === true).length
    const majorCount = defects.filter((d: any) => d.type === 'MAJOR').length
    const minorCount = defects.filter((d: any) => d.type === 'MINOR').length
    const advisoryCount = defects.filter((d: any) => d.type === 'ADVISORY').length
    const prsCount = defects.filter((d: any) => d.type === 'PRS').length

    return {
      testDate: test.completedDate,
      expiryDate: test.expiryDate,
      result: test.testResult === 'PASSED' ? 'PASS' : test.testResult === 'FAILED' ? 'FAIL' : 'REFUSED',
      mileage: test.odometerValue ? parseInt(test.odometerValue) : null,
      odometerUnit: test.odometerUnit,
      odometerResultType: test.odometerResultType,
      testNumber: test.motTestNumber,
      dataSource: test.dataSource,
      registrationAtTimeOfTest: test.registrationAtTimeOfTest,
      defects: {
        dangerous: dangerousCount,
        major: majorCount,
        minor: minorCount,
        advisory: advisoryCount,
        prs: prsCount
      },
      details: defects.map((d: any) => ({
        text: d.text,
        type: d.type,
        dangerous: d.dangerous
      }))
    }
  })
}

// Helper function to save MOT history to database
async function saveMotHistoryToDatabase(vehicleId: string, motData: any[]) {
  try {
    // Delete existing MOT history for this vehicle
    await prisma.motHistory.deleteMany({
      where: { vehicleId }
    })

    console.log(`🗑️  Cleared existing MOT records for vehicle ${vehicleId}`)

    // Save new MOT history
    for (const record of motData) {
      try {
        await prisma.motHistory.create({
          data: {
            vehicleId,
            testDate: new Date(record.testDate),
            result: record.result,
            certificateNumber: record.testNumber,
            testNumber: record.testNumber,
            expiryDate: record.expiryDate ? new Date(record.expiryDate) : null,
            mileage: record.mileage,
            odometerUnit: record.odometerUnit,
            odometerResultType: record.odometerResultType,
            testLocation: 'DVSA',
            dataSource: record.dataSource,
            registrationAtTimeOfTest: record.registrationAtTimeOfTest,
            dangerousDefects: record.defects?.dangerous || 0,
            majorDefects: record.defects?.major || 0,
            minorDefects: record.defects?.minor || 0,
            advisoryDefects: record.defects?.advisory || 0,
            prsDefects: record.defects?.prs || 0,
            defectDetails: record.details ? JSON.stringify(record.details) : null
          }
        })
      } catch (error: any) {
        // Handle unique constraint violation for testNumber
        if (error.code === 'P2002') {
          console.log(`⚠️  Test number ${record.testNumber} already exists, skipping...`)
        } else {
          throw error
        }
      }
    }

    console.log(`💾 Saved ${motData.length} MOT records for vehicle ${vehicleId}`)
  } catch (error) {
    console.error('❌ Error saving MOT history to database:', error)
    throw error
  }
}

// Helper function to refresh MOT data manually
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vehicleId = (await params).id

    // Verificar se o veículo existe e pertence ao usuário
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        ownerId: session.user.id,
      },
    })

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    console.log(`🔄 Manual refresh requested for vehicle ${vehicleId} (${vehicle.registration})`)

    // Fetch fresh data from DVSA API
    const dvsaData = await fetchMotHistoryFromDVSA(vehicle.registration)

    if (!dvsaData || !dvsaData.motTests || dvsaData.motTests.length === 0) {
      console.log(`⚠️  No data returned from DVSA API for ${vehicle.registration}`)
      return NextResponse.json(
        { error: 'No MOT data found from DVSA API' },
        { status: 404 }
      )
    }

    // Transform and save data
    const transformedData = transformDVSAData(dvsaData)
    await saveMotHistoryToDatabase(vehicleId, transformedData)

    // Fetch updated data from database
    const updatedRecords = await prisma.motHistory.findMany({
      where: { vehicleId },
      orderBy: { testDate: 'desc' }
    })

    const formattedHistory = updatedRecords.map(record => ({
      id: record.id,
      testDate: record.testDate.toISOString().split('T')[0],
      expiryDate: record.expiryDate ? record.expiryDate.toISOString().split('T')[0] : null,
      result: record.result,
      mileage: record.mileage || 0,
      odometerUnit: record.odometerUnit,
      odometerResultType: record.odometerResultType,
      testNumber: record.testNumber || record.certificateNumber || 'N/A',
      dataSource: record.dataSource,
      registrationAtTimeOfTest: record.registrationAtTimeOfTest,
      defects: {
        dangerous: record.dangerousDefects || 0,
        major: record.majorDefects || 0,
        minor: record.minorDefects || 0,
        advisory: record.advisoryDefects || 0,
        prs: record.prsDefects || 0
      },
      details: record.defectDetails ? JSON.parse(record.defectDetails) : []
    }))

    console.log(`✅ Manual refresh completed. Updated ${updatedRecords.length} MOT records`)

    // Check and create notifications if needed
    await checkAndNotifyMotStatus(vehicleId)

    return NextResponse.json({
      success: true,
      message: `Successfully refreshed MOT data. Found ${updatedRecords.length} records.`,
      data: formattedHistory,
      refreshedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Error during manual refresh:', error)
    return NextResponse.json(
      { error: 'Failed to refresh MOT data' },
      { status: 500 }
    )
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vehicleId = (await params).id

    // Verificar se o veículo existe e pertence ao usuário
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        ownerId: session.user.id,
      },
    })

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    // Try to fetch MOT history from database first
    const dbMotHistory = await prisma.motHistory.findMany({
      where: { vehicleId },
      orderBy: { testDate: 'desc' }
    })

    // If we have data in database, return it
    if (dbMotHistory.length > 0) {
      console.log(`✅ Found ${dbMotHistory.length} MOT records in database for vehicle ${vehicleId}`)

      const formattedHistory = dbMotHistory.map(record => ({
        id: record.id,
        testDate: record.testDate.toISOString().split('T')[0],
        expiryDate: record.expiryDate ? record.expiryDate.toISOString().split('T')[0] : null,
        result: record.result,
        mileage: record.mileage || 0,
        odometerUnit: record.odometerUnit,
        odometerResultType: record.odometerResultType,
        testNumber: record.testNumber || record.certificateNumber || 'N/A',
        dataSource: record.dataSource,
        registrationAtTimeOfTest: record.registrationAtTimeOfTest,
        defects: {
          dangerous: record.dangerousDefects || 0,
          major: record.majorDefects || 0,
          minor: record.minorDefects || 0,
          advisory: record.advisoryDefects || 0,
          prs: record.prsDefects || 0
        },
        details: record.defectDetails ? JSON.parse(record.defectDetails) : []
      }))

      // Check and create notifications if needed
      await checkAndNotifyMotStatus(vehicleId)

      return NextResponse.json(formattedHistory)
    }

    // If no data in database, try to fetch from DVSA API
    console.log(`📡 No MOT records in database. Attempting to fetch from DVSA API for registration: ${vehicle.registration}`)

    // Check cache first
    const dvsaCacheKey = generateDvsaCacheKey(vehicle.registration)
    let dvsaData = motCache.get(dvsaCacheKey)

    if (!dvsaData) {
      console.log(`📡 DVSA cache miss. Fetching from API...`)
      dvsaData = await fetchMotHistoryFromDVSA(vehicle.registration)

      // Cache the result if successful
      if (dvsaData && dvsaData.motTests) {
        motCache.set(dvsaCacheKey, dvsaData)
      }
    } else {
      console.log(`✅ Using cached DVSA data for ${vehicle.registration}`)
    }

    if (dvsaData && dvsaData.motTests && dvsaData.motTests.length > 0) {
      // Transform DVSA data to our format
      const transformedData = transformDVSAData(dvsaData)

      // Save to database
      await saveMotHistoryToDatabase(vehicleId, transformedData)

      // Fetch from database to return formatted data
      const savedRecords = await prisma.motHistory.findMany({
        where: { vehicleId },
        orderBy: { testDate: 'desc' }
      })

      const formattedHistory = savedRecords.map(record => ({
        id: record.id,
        testDate: record.testDate.toISOString().split('T')[0],
        expiryDate: record.expiryDate ? record.expiryDate.toISOString().split('T')[0] : null,
        result: record.result,
        mileage: record.mileage || 0,
        odometerUnit: record.odometerUnit,
        odometerResultType: record.odometerResultType,
        testNumber: record.testNumber || record.certificateNumber || 'N/A',
        dataSource: record.dataSource,
        registrationAtTimeOfTest: record.registrationAtTimeOfTest,
        defects: {
          dangerous: record.dangerousDefects || 0,
          major: record.majorDefects || 0,
          minor: record.minorDefects || 0,
          advisory: record.advisoryDefects || 0,
          prs: record.prsDefects || 0
        },
        details: record.defectDetails ? JSON.parse(record.defectDetails) : []
      }))

      // Check and create notifications if needed
      await checkAndNotifyMotStatus(vehicleId)

      return NextResponse.json(formattedHistory)
    }

    // Fallback to mock data if DVSA API fails
    console.log(`⚠️  DVSA API failed or returned no data. Using mock data as fallback.`)
    console.log(`📋 Mock data contains ${mockMotHistory.length} records`)
    await saveMotHistoryToDatabase(vehicleId, mockMotHistory)

    // Verify that data was saved
    const savedRecords = await prisma.motHistory.findMany({
      where: { vehicleId },
      orderBy: { testDate: 'desc' }
    })
    console.log(`✅ Verified: ${savedRecords.length} mock records saved to database`)

    // Check and create notifications if needed
    await checkAndNotifyMotStatus(vehicleId)

    return NextResponse.json(mockMotHistory)
  } catch (error) {
    console.error('❌ MOT history error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}