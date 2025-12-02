import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createVehicleSchema } from '@/lib/validations'

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
  expiresAt: number // Unix timestamp in milliseconds
}

let dvsaTokenCache: TokenCache | null = null

// Helper function to get DVSA authentication token
async function getDVSAToken(): Promise<string | null> {
  // Check if we have a cached token that's still valid (with 5 minute buffer)
  const now = Date.now()
  const bufferMs = 5 * 60 * 1000 // 5 minutes buffer before expiry

  if (dvsaTokenCache && dvsaTokenCache.expiresAt > now + bufferMs) {
    console.log('🔑 Using cached DVSA token')
    return dvsaTokenCache.accessToken
  }

  // Token expired or doesn't exist, fetch a new one
  console.log('🔐 Fetching new DVSA authentication token...')

  if (!DVSA_CLIENT_ID || !DVSA_CLIENT_SECRET) {
    console.error('❌ DVSA_CLIENT_ID or DVSA_CLIENT_SECRET not configured')
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
      console.error(`❌ DVSA token request failed: ${response.status} ${response.statusText}`)
      console.error(`❌ Error details: ${errorText}`)
      return null
    }

    const tokenData = await response.json()

    if (!tokenData.access_token) {
      console.error('❌ DVSA token response missing access_token')
      return null
    }

    // Cache the token with expiry time
    // Default to 1 hour if expires_in not provided
    const expiresInSeconds = tokenData.expires_in || 3600
    dvsaTokenCache = {
      accessToken: tokenData.access_token,
      expiresAt: now + (expiresInSeconds * 1000)
    }

    console.log(`✅ DVSA token obtained, expires in ${expiresInSeconds} seconds`)
    return dvsaTokenCache.accessToken
  } catch (error) {
    console.error('❌ Error fetching DVSA token:', error)
    return null
  }
}

// Helper function to fetch MOT history from DVSA API
async function fetchMotHistoryFromDVSA(registration: string, retryCount = 0): Promise<any | null> {
  const MAX_RETRIES = 2

  try {
    console.log(`🔍 Fetching MOT history from DVSA for registration: ${registration}`)

    // Get authentication token first
    const token = await getDVSAToken()
    if (!token) {
      console.error('❌ Failed to obtain DVSA authentication token')
      return null
    }

    const url = `${DVSA_API_BASE_URL}?registration=${registration}`

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }

    // Add API key if configured
    if (DVSA_API_KEY) {
      headers['x-api-key'] = DVSA_API_KEY
    }

    const response = await fetch(url, {
      method: 'GET',
      headers
    })

    // Handle 401 - token might be invalid, retry with fresh token
    if (response.status === 401 && retryCount < MAX_RETRIES) {
      console.log('🔄 Token invalid, clearing cache and retrying...')
      dvsaTokenCache = null
      return fetchMotHistoryFromDVSA(registration, retryCount + 1)
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ DVSA API error: ${response.status} ${response.statusText}`)
      console.error(`❌ Response: ${errorText}`)
      return null
    }

    const data = await response.json()
    console.log(`✅ Successfully fetched MOT data from DVSA for ${registration}`)
    return data
  } catch (error) {
    console.error('❌ Error fetching from DVSA API:', error)

    // Retry on network errors
    if (retryCount < MAX_RETRIES) {
      console.log(`🔄 Retrying DVSA request (attempt ${retryCount + 2}/${MAX_RETRIES + 1})...`)
      return fetchMotHistoryFromDVSA(registration, retryCount + 1)
    }

    return null
  }
}

// Helper function to transform DVSA data to our format
function transformDVSAData(dvsaData: any): any[] {
  if (!dvsaData.motTests || !Array.isArray(dvsaData.motTests)) {
    return []
  }

  return dvsaData.motTests.map((test: any) => ({
    testDate: test.completedDate,
    result: test.testResult === 'PASSED' ? 'PASS' : 'FAIL',
    testNumber: test.motTestNumber,
    expiryDate: test.expiryDate || null,
    mileage: test.odometerValue ? parseInt(test.odometerValue, 10) : null,
    odometerUnit: test.odometerUnit || 'mi',
    odometerResultType: test.odometerResultType || 'READ',
    dataSource: 'DVSA',
    registrationAtTimeOfTest: dvsaData.registration,
    defects: {
      dangerous: test.rfrAndComments?.filter((d: any) => d.type === 'DANGEROUS').length || 0,
      major: test.rfrAndComments?.filter((d: any) => d.type === 'MAJOR').length || 0,
      minor: test.rfrAndComments?.filter((d: any) => d.type === 'MINOR').length || 0,
      advisory: test.rfrAndComments?.filter((d: any) => d.type === 'ADVISORY').length || 0,
      prs: test.rfrAndComments?.filter((d: any) => d.type === 'PRS').length || 0
    }
  }))
}

// Helper function to save MOT history to database
async function saveMotHistoryToDatabase(vehicleId: string, motData: any[]) {
  for (const record of motData) {
    try {
      // Check if record already exists by testNumber
      if (record.testNumber) {
        const existing = await prisma.motHistory.findUnique({
          where: { testNumber: record.testNumber }
        })
        if (existing) continue
      }

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
          prsDefects: record.defects?.prs || 0
        }
      })
    } catch (error) {
      console.error(`Error saving MOT record:`, error)
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const vehicles = await prisma.vehicle.findMany({
      where: {
        owner: {
          email: session.user.email
        }
      },
      include: {
        motHistory: {
          orderBy: {
            testDate: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Process vehicles and fetch missing MOT data from DVSA
    const processedVehicles = await Promise.all(
      vehicles.map(async (vehicle) => {
        let latestMot = vehicle.motHistory[0]

        // If no MOT history, try to fetch from DVSA API
        if (!latestMot) {
          console.log(`📡 No MOT history for ${vehicle.registration}, fetching from DVSA...`)
          const dvsaData = await fetchMotHistoryFromDVSA(vehicle.registration)

          if (dvsaData && dvsaData.motTests && dvsaData.motTests.length > 0) {
            const transformedData = transformDVSAData(dvsaData)
            await saveMotHistoryToDatabase(vehicle.id, transformedData)

            // Fetch the newly saved data
            const updatedHistory = await prisma.motHistory.findMany({
              where: { vehicleId: vehicle.id },
              orderBy: { testDate: 'desc' }
            })
            latestMot = updatedHistory[0]
            console.log(`✅ Saved ${updatedHistory.length} MOT records for ${vehicle.registration}`)
          }
        }

        // Calculate MOT status
        let motStatus = 'NO_MOT'
        if (latestMot?.expiryDate) {
          const today = new Date()
          const expiryDate = new Date(latestMot.expiryDate)
          const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

          if (daysUntilExpiry < 0) {
            motStatus = 'EXPIRED'
          } else if (daysUntilExpiry <= 30) {
            motStatus = 'EXPIRING_SOON'
          } else {
            motStatus = 'VALID'
          }
        }

        return {
          id: vehicle.id,
          registration: vehicle.registration,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          fuelType: vehicle.fuelType,
          engineSize: vehicle.engineSize,
          color: vehicle.color,
          mileage: latestMot?.mileage || vehicle.mileage || null,
          lastMotDate: latestMot?.testDate ? latestMot.testDate.toISOString().split('T')[0] : null,
          lastMotResult: latestMot?.result || null,
          motExpiryDate: latestMot?.expiryDate ? latestMot.expiryDate.toISOString().split('T')[0] : null,
          motStatus: motStatus,
          createdAt: vehicle.createdAt
        }
      })
    )

    return NextResponse.json({ vehicles: processedVehicles })

  } catch (error) {
    console.error('Error fetching vehicles:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate request data
    const validationResult = createVehicleSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { registration, make, model, year, fuelType, engineSize, color } = validationResult.data

    // Check if this user has already registered this specific vehicle
    // Note: Different users CAN register vehicles with the same registration number
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        registration: registration.toUpperCase(),
        ownerId: session.user.id
      }
    })

    if (existingVehicle) {
      return NextResponse.json(
        { error: 'You have already registered this vehicle' },
        { status: 409 }
      )
    }

    // Create vehicle
    const vehicle = await prisma.vehicle.create({
      data: {
        registration: registration.toUpperCase(),
        make,
        model,
        year,
        fuelType,
        engineSize,
        color,
        ownerId: session.user.id
      }
    })

    return NextResponse.json({
      vehicle: {
        id: vehicle.id,
        registration: vehicle.registration,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        fuelType: vehicle.fuelType,
        engineSize: vehicle.engineSize,
        color: vehicle.color
      },
      message: 'Vehicle added successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating vehicle:', error)

    // Handle specific Prisma errors
    if (error.code === 'P2003') {
      // Foreign key constraint violation - user doesn't exist
      return NextResponse.json(
        { error: 'Your session is invalid. Please log out and log in again.' },
        { status: 401 }
      )
    }

    if (error.code === 'P2002') {
      // Unique constraint violation
      return NextResponse.json(
        { error: 'This vehicle registration is already in use.' },
        { status: 409 }
      )
    }

    // Provide more detailed error information in development
    const errorMessage = process.env.NODE_ENV === 'development'
      ? `Internal server error: ${error.message}`
      : 'Internal server error'

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}