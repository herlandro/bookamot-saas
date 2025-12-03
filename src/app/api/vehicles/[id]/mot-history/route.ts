import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { motCache, generateMotCacheKey, generateDvsaCacheKey } from '@/lib/cache/mot-cache'
import { checkAndNotifyMotStatus } from '@/lib/services/mot-notification-service'

// DVSA API Configuration
const DVSA_API_BASE_URL = process.env.DVSA_API_BASE_URL || 'https://beta.check-mot.service.gov.uk/trade/vehicles/mot-tests'
const DVSA_API_KEY = process.env.DVSA_API_KEY || ''
const DVSA_CLIENT_ID = process.env.DVSA_CLIENT_ID || ''
const DVSA_CLIENT_SECRET = process.env.DVSA_CLIENT_SECRET || ''
const DVSA_TOKEN_URL = process.env.DVSA_TOKEN_URL || 'https://login.microsoftonline.com/a455b827-244f-4c97-b5b4-ce5d13b4d00c/oauth2/v2.0/token'
const DVSA_SCOPE = process.env.DVSA_SCOPE || 'https://tapi.dvsa.gov.uk/.default'

// Token cache for DVSA authentication
interface TokenCache {
  accessToken: string
  expiresAt: number
}

let dvsaTokenCache: TokenCache | null = null

// Helper function to get DVSA authentication token
async function getDVSAToken(): Promise<string | null> {
  const now = Date.now()
  const bufferMs = 5 * 60 * 1000

  if (dvsaTokenCache && dvsaTokenCache.expiresAt > now + bufferMs) {
    console.log('🔑 [MOT History] Using cached DVSA token')
    return dvsaTokenCache.accessToken
  }

  console.log('🔐 [MOT History] Fetching new DVSA authentication token...')

  if (!DVSA_CLIENT_ID || !DVSA_CLIENT_SECRET) {
    console.error('❌ [MOT History] DVSA_CLIENT_ID or DVSA_CLIENT_SECRET not configured')
    return null
  }

  try {
    const tokenRequestBody = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: DVSA_CLIENT_ID,
      client_secret: DVSA_CLIENT_SECRET,
      scope: DVSA_SCOPE
    })

    const response = await fetch(DVSA_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: tokenRequestBody.toString()
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [MOT History] DVSA token request failed: ${response.status}`)
      console.error(`❌ [MOT History] Error details: ${errorText}`)
      return null
    }

    const tokenData = await response.json()

    if (!tokenData.access_token) {
      console.error('❌ [MOT History] DVSA token response missing access_token')
      return null
    }

    const expiresInSeconds = tokenData.expires_in || 3600
    dvsaTokenCache = {
      accessToken: tokenData.access_token,
      expiresAt: now + (expiresInSeconds * 1000)
    }

    console.log(`✅ [MOT History] DVSA token obtained, expires in ${expiresInSeconds} seconds`)
    return dvsaTokenCache.accessToken
  } catch (error) {
    console.error('❌ [MOT History] Error fetching DVSA token:', error)
    return null
  }
}

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
async function fetchMotHistoryFromDVSA(registration: string): Promise<any | null> {
  // Check if API key is configured
  if (!DVSA_API_KEY) {
    console.log('⚠️ [MOT History] DVSA_API_KEY not configured')
    return null
  }

  try {
    console.log(`🔍 [MOT History] Fetching MOT history from DVSA for registration: ${registration}`)

    // Correct DVSA API endpoint format
    const url = `${DVSA_API_BASE_URL}?registration=${encodeURIComponent(registration)}`

    // Try with API key first
    const headers: Record<string, string> = {
      'Accept': 'application/json+v6',
      'x-api-key': DVSA_API_KEY
    }

    console.log(`🔍 [MOT History] Making request to: ${url}`)

    const response = await fetch(url, {
      method: 'GET',
      headers
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`❌ [MOT History] DVSA API error: ${response.status} ${response.statusText}`)
      console.error(`❌ [MOT History] Response body: ${errorBody}`)

      // If authentication fails, try with OAuth token
      if (response.status === 401 || response.status === 403) {
        console.log('🔄 [MOT History] Trying with OAuth token...')
        return fetchMotHistoryFromDVSAWithToken(registration)
      }

      return null
    }

    const data = await response.json()
    console.log(`✅ [MOT History] Successfully fetched MOT data from DVSA for ${registration}`)

    // The API returns an array with one vehicle object
    const vehicleData = Array.isArray(data) ? data[0] : data
    console.log(`📊 [MOT History] Found ${vehicleData?.motTests?.length || 0} MOT records`)

    return vehicleData
  } catch (error) {
    console.error('❌ [MOT History] Error fetching from DVSA API:', error)
    return null
  }
}

// Alternative method using OAuth token
async function fetchMotHistoryFromDVSAWithToken(registration: string): Promise<any | null> {
  try {
    const token = await getDVSAToken()
    if (!token) {
      console.log('⚠️ [MOT History] No DVSA token available')
      return null
    }

    const url = `${DVSA_API_BASE_URL}?registration=${encodeURIComponent(registration)}`

    const headers: Record<string, string> = {
      'Accept': 'application/json+v6',
      'Authorization': `Bearer ${token}`
    }

    if (DVSA_API_KEY) {
      headers['x-api-key'] = DVSA_API_KEY
    }

    console.log(`🔍 [MOT History] Making OAuth request to: ${url}`)

    const response = await fetch(url, {
      method: 'GET',
      headers
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`❌ [MOT History] DVSA OAuth API error: ${response.status} ${response.statusText}`)
      console.error(`❌ [MOT History] Response body: ${errorBody}`)
      return null
    }

    const data = await response.json()
    console.log(`✅ [MOT History] Successfully fetched MOT data via OAuth for ${registration}`)

    const vehicleData = Array.isArray(data) ? data[0] : data
    console.log(`📊 [MOT History] Found ${vehicleData?.motTests?.length || 0} MOT records`)

    return vehicleData
  } catch (error) {
    console.error('❌ [MOT History] Error fetching from DVSA OAuth API:', error)
    return null
  }
}

/**
 * Helper function to validate MOT test date against vehicle manufacturing year
 * MOT tests in the UK start 3 years after the vehicle's first registration/manufacturing year
 * @param testDate - The MOT test date
 * @param vehicleYear - The vehicle's manufacturing/first registration year
 * @returns true if the MOT test is valid (3+ years after vehicle year)
 */
function isValidMotTestDate(testDate: string, vehicleYear: number): boolean {
  const testYear = new Date(testDate).getFullYear()
  const minValidYear = vehicleYear + 3

  return testYear >= minValidYear
}

/**
 * Helper function to get vehicle year from DVSA data
 * @param dvsaData - The DVSA vehicle data
 * @returns The vehicle's year
 */
function getVehicleYear(dvsaData: any): number {
  // Try to extract year from firstUsedDate
  if (dvsaData.firstUsedDate) {
    const dateMatch = dvsaData.firstUsedDate.match(/\d{4}/)
    if (dateMatch) {
      return parseInt(dateMatch[0], 10)
    }
  }

  // Fallback to manufactureYear
  if (dvsaData.manufactureYear) {
    return parseInt(dvsaData.manufactureYear, 10)
  }

  // If no year found, return current year (will allow all MOT records)
  return new Date().getFullYear()
}

// Helper function to transform DVSA data to our format
function transformDVSAData(dvsaData: any): any[] {
  if (!dvsaData.motTests || !Array.isArray(dvsaData.motTests)) {
    return []
  }

  // Get vehicle year for validation
  const vehicleYear = getVehicleYear(dvsaData)
  console.log(`🚗 [MOT History] Vehicle year: ${vehicleYear}, MOT tests valid from: ${vehicleYear + 3}`)

  // Filter and transform MOT tests
  const validTests = dvsaData.motTests.filter((test: any) => {
    const isValid = isValidMotTestDate(test.completedDate, vehicleYear)
    if (!isValid) {
      console.log(`⚠️ [MOT History] Filtering out invalid MOT test from ${test.completedDate} (before ${vehicleYear + 3})`)
    }
    return isValid
  })

  console.log(`📊 [MOT History] Filtered ${dvsaData.motTests.length} tests to ${validTests.length} valid tests`)

  return validTests.map((test: any) => {
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