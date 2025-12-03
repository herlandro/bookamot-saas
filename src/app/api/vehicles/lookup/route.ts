import { NextRequest, NextResponse } from 'next/server'

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
    console.log('🔑 [Lookup] Using cached DVSA token')
    return dvsaTokenCache.accessToken
  }

  console.log('🔐 [Lookup] Fetching new DVSA authentication token...')

  if (!DVSA_CLIENT_ID || !DVSA_CLIENT_SECRET) {
    console.error('❌ [Lookup] DVSA_CLIENT_ID or DVSA_CLIENT_SECRET not configured')
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
      console.error(`❌ [Lookup] DVSA token request failed: ${response.status}`)
      console.error(`❌ [Lookup] Error details: ${errorText}`)
      return null
    }

    const tokenData = await response.json()

    if (!tokenData.access_token) {
      console.error('❌ [Lookup] DVSA token response missing access_token')
      return null
    }

    const expiresInSeconds = tokenData.expires_in || 3600
    dvsaTokenCache = {
      accessToken: tokenData.access_token,
      expiresAt: now + (expiresInSeconds * 1000)
    }

    console.log(`✅ [Lookup] DVSA token obtained, expires in ${expiresInSeconds} seconds`)
    return dvsaTokenCache.accessToken
  } catch (error) {
    console.error('❌ [Lookup] Error fetching DVSA token:', error)
    return null
  }
}

// Helper function to fetch vehicle data from DVSA API
// Uses the DVSA MOT History API with x-api-key authentication
// Documentation: https://dvsa.github.io/mot-history-api-documentation/
async function fetchVehicleFromDVSA(registration: string, retryCount = 0): Promise<any | null> {
  const MAX_RETRIES = 2

  // Check if API key is configured
  if (!DVSA_API_KEY) {
    console.log('⚠️ [Lookup] DVSA_API_KEY not configured, falling back to mock data')
    return null
  }

  try {
    console.log(`🔍 [Lookup] Fetching vehicle data from DVSA for: ${registration}`)

    // Correct DVSA API endpoint format
    const url = `${DVSA_API_BASE_URL}?registration=${encodeURIComponent(registration)}`

    // DVSA MOT API requires specific Accept header and x-api-key
    // Per documentation: Accept: application/json+v6, x-api-key: <your api key>
    const headers: Record<string, string> = {
      'Accept': 'application/json+v6',
      'x-api-key': DVSA_API_KEY
    }

    console.log(`🔍 [Lookup] Making request to: ${url}`)
    console.log(`🔑 [Lookup] Using API key: ${DVSA_API_KEY.substring(0, 10)}...`)

    const response = await fetch(url, {
      method: 'GET',
      headers
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`❌ [Lookup] DVSA API error: ${response.status} ${response.statusText}`)
      console.error(`❌ [Lookup] Response body: ${errorBody}`)

      // If we get 401/403, the API key might be invalid
      if ((response.status === 401 || response.status === 403) && retryCount === 0) {
        console.log('🔄 [Lookup] Authentication failed, trying with OAuth token...')
        return fetchVehicleFromDVSAWithToken(registration)
      }

      return null
    }

    const data = await response.json()
    console.log(`✅ [Lookup] Successfully fetched vehicle data from DVSA for ${registration}`)
    console.log(`📊 [Lookup] Data structure:`, JSON.stringify(data).substring(0, 200))
    return data
  } catch (error) {
    console.error('❌ [Lookup] Error fetching from DVSA API:', error)

    if (retryCount < MAX_RETRIES) {
      console.log(`🔄 [Lookup] Retrying (attempt ${retryCount + 2}/${MAX_RETRIES + 1})...`)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second before retry
      return fetchVehicleFromDVSA(registration, retryCount + 1)
    }

    return null
  }
}

// Alternative method using OAuth token (for new DVSA API)
async function fetchVehicleFromDVSAWithToken(registration: string): Promise<any | null> {
  try {
    const token = await getDVSAToken()
    if (!token) {
      console.log('⚠️ [Lookup] No DVSA token available')
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

    console.log(`🔍 [Lookup] Making OAuth request to: ${url}`)
    console.log(`🔑 [Lookup] Using OAuth token: ${token.substring(0, 20)}...`)

    const response = await fetch(url, {
      method: 'GET',
      headers
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`❌ [Lookup] DVSA OAuth API error: ${response.status} ${response.statusText}`)
      console.error(`❌ [Lookup] Response body: ${errorBody}`)
      return null
    }

    const data = await response.json()
    console.log(`✅ [Lookup] Successfully fetched vehicle data from DVSA (OAuth) for ${registration}`)
    return data
  } catch (error) {
    console.error('❌ [Lookup] Error fetching from DVSA OAuth API:', error)
    return null
  }
}

/**
 * Helper function to validate MOT test date against vehicle manufacturing year
 * MOT tests in the UK start 3 years after the vehicle's first registration/manufacturing year
 */
function isValidMotTestDate(testDate: string, vehicleYear: number): boolean {
  const testYear = new Date(testDate).getFullYear()
  const minValidYear = vehicleYear + 3

  return testYear >= minValidYear
}

// Transform DVSA response to our vehicle format
function transformDVSAToVehicle(dvsaData: any): any {
  // DVSA MOT API returns an array of vehicles, get the first one
  const vehicle = Array.isArray(dvsaData) ? dvsaData[0] : dvsaData

  if (!vehicle) return null

  // Map fuel type from DVSA format to our format
  const fuelTypeMap: Record<string, string> = {
    'Petrol': 'PETROL',
    'Diesel': 'DIESEL',
    'Electric': 'ELECTRIC',
    'Hybrid Electric (Clean)': 'HYBRID',
    'Hybrid Electric': 'HYBRID',
    'Plug-in Hybrid Electric': 'HYBRID',
    'Gas': 'LPG',
    'LPG': 'LPG'
  }

  // Extract year from first registration date
  let year = new Date().getFullYear()
  if (vehicle.firstUsedDate) {
    const dateMatch = vehicle.firstUsedDate.match(/\d{4}/)
    if (dateMatch) {
      year = parseInt(dateMatch[0], 10)
    }
  } else if (vehicle.manufactureYear) {
    year = parseInt(vehicle.manufactureYear, 10)
  }

  // Filter MOT tests to only include valid ones (3+ years after vehicle year)
  let validMotTests = vehicle.motTests || []
  if (validMotTests.length > 0) {
    const originalCount = validMotTests.length
    validMotTests = validMotTests.filter((test: any) =>
      isValidMotTestDate(test.completedDate, year)
    )

    if (validMotTests.length < originalCount) {
      console.log(`🔍 [Lookup] Filtered ${originalCount} MOT tests to ${validMotTests.length} valid tests (vehicle year: ${year})`)
    }
  }

  // Get latest valid MOT test for mileage info
  const latestMot = validMotTests[0]

  return {
    make: vehicle.make || '',
    model: vehicle.model || '',
    year: year,
    fuelType: fuelTypeMap[vehicle.fuelType] || 'PETROL',
    color: vehicle.primaryColour || vehicle.colour || '',
    engineSize: vehicle.engineSize ? `${(parseInt(vehicle.engineSize, 10) / 1000).toFixed(1)}L` : '',
    // Include MOT history info for display (only valid tests)
    motHistory: validMotTests.length > 0 ? {
      lastTestDate: latestMot?.completedDate || null,
      lastTestResult: latestMot?.testResult || null,
      expiryDate: latestMot?.expiryDate || null,
      mileage: latestMot?.odometerValue ? parseInt(latestMot.odometerValue, 10) : null,
      totalTests: validMotTests.length
    } : null
  }
}

/**
 * Vehicle Lookup API
 * GET /api/vehicles/lookup?registration={registration}
 *
 * Looks up vehicle details from registration number using DVSA MOT History API
 * Falls back to mock data if DVSA API is not configured or fails
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const registration = searchParams.get('registration')

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration number is required' },
        { status: 400 }
      )
    }

    const normalizedReg = registration.toUpperCase().replace(/\s/g, '')

    // Try DVSA API first
    const dvsaData = await fetchVehicleFromDVSA(normalizedReg)

    if (dvsaData) {
      const vehicleData = transformDVSAToVehicle(dvsaData)
      if (vehicleData) {
        return NextResponse.json(vehicleData, { status: 200 })
      }
    }

    // Fallback to mock data for development/testing
    console.log('⚠️ [Lookup] Using mock data fallback')

    const mockVehicleData: Record<string, any> = {
      'AB12CDE': {
        make: 'Ford',
        model: 'Focus',
        year: 2020,
        fuelType: 'PETROL',
        color: 'Blue',
        engineSize: '1.6L'
      },
      'WJ11USE': {
        make: 'Volkswagen',
        model: 'Golf',
        year: 2011,
        fuelType: 'DIESEL',
        color: 'Silver',
        engineSize: '2.0L'
      },
      'XY99ZZZ': {
        make: 'Toyota',
        model: 'Corolla',
        year: 2019,
        fuelType: 'HYBRID',
        color: 'White',
        engineSize: '1.8L'
      }
    }

    const vehicleData = mockVehicleData[normalizedReg]

    if (vehicleData) {
      return NextResponse.json(vehicleData, { status: 200 })
    } else {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Error in vehicle lookup:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
