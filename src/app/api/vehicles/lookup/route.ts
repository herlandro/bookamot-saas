import { NextRequest, NextResponse } from 'next/server'

// DVSA API Configuration
const DVSA_API_BASE_URL = process.env.DVSA_API_BASE_URL || 'https://beta.check-mot.service.gov.uk/trade/vehicles/mot-tests'
const DVSA_API_KEY = process.env.DVSA_API_KEY || ''
const DVSA_CLIENT_ID = process.env.DVSA_CLIENT_ID || ''
const DVSA_CLIENT_SECRET = process.env.DVSA_CLIENT_SECRET || ''
const DVSA_TOKEN_URL = process.env.DVSA_TOKEN_URL || 'https://login.microsoftonline.com/a455b827-244f-4c97-b5b4-ce5d13b4d00c/oauth2/v2.0/token'
const DVSA_SCOPE = process.env.DVSA_SCOPE || 'https://tapi.dvsa.gov.uk/.default'
const DVSA_FETCH_TIMEOUT_MS = Number(process.env.DVSA_FETCH_TIMEOUT_MS || 5000)

let lastDVSAError: { status?: number; message?: string; kind?: 'network' | 'timeout' | 'auth' | 'not_found' | 'rate_limit' | 'unknown'; dvsaErrorCode?: string; dvsaErrorMessage?: string; requestId?: string } | null = null

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
    
    return dvsaTokenCache.accessToken
  }

  

  if (!DVSA_CLIENT_ID || !DVSA_CLIENT_SECRET) {
    
    return null
  }

  try {
    const tokenRequestBody = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: DVSA_CLIENT_ID,
      client_secret: DVSA_CLIENT_SECRET,
      scope: DVSA_SCOPE
    })

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), DVSA_FETCH_TIMEOUT_MS)
    const response = await fetch(DVSA_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: tokenRequestBody.toString(),
      signal: controller.signal
    })
    clearTimeout(timer)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [Lookup] DVSA token request failed: ${response.status}`)
      console.error(`❌ [Lookup] Error details: ${errorText}`)
      return null
    }

    const tokenData = await response.json()

    if (!tokenData.access_token) {
      
      return null
    }

    const expiresInSeconds = tokenData.expires_in || 3600
    dvsaTokenCache = {
      accessToken: tokenData.access_token,
      expiresAt: now + (expiresInSeconds * 1000)
    }

    
    return dvsaTokenCache.accessToken
  } catch (error) {
    if ((error as any)?.name === 'AbortError') {
      
    } else {
      
    }
    return null
  }
}

// Helper function to fetch vehicle data from DVSA API
// Uses the DVSA MOT History API with x-api-key authentication
// Documentation: https://dvsa.github.io/mot-history-api-documentation/
async function fetchVehicleFromDVSA(registration: string, retryCount = 0): Promise<any | null> {
  const MAX_RETRIES = 2

  try {
    

    const url = buildDVSAUrl(registration)

    const headers: Record<string, string> = {
      Accept: getDVSAAcceptHeader()
    }

    const token = await getDVSAToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
    if (DVSA_API_KEY) headers['x-api-key'] = DVSA_API_KEY

    if (!headers['Authorization'] && !headers['x-api-key']) {
      lastDVSAError = { status: 503, message: 'DVSA not configured', kind: 'auth' }
      return null
    }

    

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), DVSA_FETCH_TIMEOUT_MS)
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal
    })
    clearTimeout(timer)

    if (!response.ok) {
      const errorRaw = await response.text()
      let errorBody: any = null
      try { errorBody = JSON.parse(errorRaw) } catch {}
      const reqIdHdr = response.headers.get('x-ms-request-id') || response.headers.get('x-request-id') || undefined
      

      if ((response.status === 401 || response.status === 403) && headers['Authorization'] && retryCount === 0) {
        dvsaTokenCache = null
        
        return fetchVehicleFromDVSA(registration, retryCount + 1)
      }
      if (response.status === 404) {
        lastDVSAError = { status: 404, message: 'Vehicle not found', kind: 'not_found', dvsaErrorCode: errorBody?.errorCode, dvsaErrorMessage: errorBody?.errorMessage, requestId: errorBody?.requestId || reqIdHdr }
      } else if (response.status === 429) {
        lastDVSAError = { status: 429, message: 'Rate limit exceeded', kind: 'rate_limit', dvsaErrorCode: errorBody?.errorCode, dvsaErrorMessage: errorBody?.errorMessage, requestId: errorBody?.requestId || reqIdHdr }
      } else if (response.status === 401 || response.status === 403) {
        lastDVSAError = { status: response.status, message: 'Unauthorized', kind: 'auth', dvsaErrorCode: errorBody?.errorCode, dvsaErrorMessage: errorBody?.errorMessage, requestId: errorBody?.requestId || reqIdHdr }
      } else {
        lastDVSAError = { status: response.status, message: 'DVSA API error', kind: 'unknown', dvsaErrorCode: errorBody?.errorCode, dvsaErrorMessage: errorBody?.errorMessage, requestId: errorBody?.requestId || reqIdHdr }
      }
      return null
    }

    const data = await response.json()
    
    return data
  } catch (error) {
    if ((error as any)?.name === 'AbortError') {
      
      lastDVSAError = { kind: 'timeout', message: 'DVSA timeout' }
    } else {
      
      lastDVSAError = { kind: 'network', message: 'Network error calling DVSA' }
    }

    if (retryCount < MAX_RETRIES) {
      
      await new Promise(resolve => setTimeout(resolve, 1000))
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

    const url = buildDVSAUrl(registration)

    const headers: Record<string, string> = {
      'Accept': getDVSAAcceptHeader(),
      'Authorization': `Bearer ${token}`
    }

    if (DVSA_API_KEY) {
      headers['x-api-key'] = DVSA_API_KEY
    }

    

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), DVSA_FETCH_TIMEOUT_MS)
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal
    })
    clearTimeout(timer)

    if (!response.ok) {
      const errorRaw = await response.text()
      let errorBody: any = null
      try { errorBody = JSON.parse(errorRaw) } catch {}
      
      if (response.status === 404) {
        lastDVSAError = { status: 404, message: 'Vehicle not found', kind: 'not_found', dvsaErrorCode: errorBody?.errorCode, dvsaErrorMessage: errorBody?.errorMessage, requestId: errorBody?.requestId }
      } else if (response.status === 429) {
        lastDVSAError = { status: 429, message: 'Rate limit exceeded', kind: 'rate_limit', dvsaErrorCode: errorBody?.errorCode, dvsaErrorMessage: errorBody?.errorMessage, requestId: errorBody?.requestId }
      } else if (response.status === 401 || response.status === 403) {
        lastDVSAError = { status: response.status, message: 'Unauthorized', kind: 'auth', dvsaErrorCode: errorBody?.errorCode, dvsaErrorMessage: errorBody?.errorMessage, requestId: errorBody?.requestId }
      } else {
        lastDVSAError = { status: response.status, message: 'DVSA OAuth API error', kind: 'unknown', dvsaErrorCode: errorBody?.errorCode, dvsaErrorMessage: errorBody?.errorMessage, requestId: errorBody?.requestId }
      }
      return null
    }

    const data = await response.json()
    
    return data
  } catch (error) {
    
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
 * Returns error if DVSA API is not configured or fails
 */
export async function GET(request: NextRequest) {
  try {
    

    if (isTokenEndpoint(DVSA_API_BASE_URL)) {
      
      return NextResponse.json(
        { error: 'DVSA API base URL misconfigured', code: 'MISCONFIGURED_ENDPOINT' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const registration = searchParams.get('registration')

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration number is required' },
        { status: 400 }
      )
    }

    const normalizedReg = registration.toUpperCase().replace(/\s/g, '')

    // Basic format validation: 5-8 alphanumeric characters
    if (!/^[A-Z0-9]{5,8}$/.test(normalizedReg)) {
      return NextResponse.json(
        { error: 'Invalid registration format', code: 'INVALID_FORMAT' },
        { status: 400 }
      )
    }

    // Try DVSA API first
    const dvsaData = await fetchVehicleFromDVSA(normalizedReg)

    if (dvsaData) {
      const vehicleData = transformDVSAToVehicle(dvsaData)
      if (vehicleData) {
        return NextResponse.json(vehicleData, { status: 200 })
      }
    }

    // If DVSA is configured but failed, return specific error
    if (DVSA_API_KEY) {
      const err = lastDVSAError
      if (err?.kind === 'not_found') {
        return NextResponse.json(
          { error: 'Vehicle not found', code: 'NOT_FOUND', error_code: err.dvsaErrorCode, error_message: err.dvsaErrorMessage, request_id: err.requestId },
          { status: 404 }
        )
      }
      if (err?.kind === 'rate_limit') {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.', code: 'RATE_LIMIT', error_code: err.dvsaErrorCode, error_message: err.dvsaErrorMessage, request_id: err.requestId },
          { status: 429 }
        )
      }
      if (err?.kind === 'timeout') {
        return NextResponse.json(
          { error: 'DVSA request timed out. Please retry.', code: 'TIMEOUT', error_code: err.dvsaErrorCode, error_message: err.dvsaErrorMessage, request_id: err.requestId },
          { status: 504 }
        )
      }
      if (err?.kind === 'auth') {
        return NextResponse.json(
          { error: 'DVSA authentication failed. Check credentials.', code: 'AUTH_ERROR', error_code: err.dvsaErrorCode, error_message: err.dvsaErrorMessage, request_id: err.requestId },
          { status: 403 }
        )
      }
      return NextResponse.json(
        { error: 'DVSA service unavailable', code: 'DVSA_UNAVAILABLE', error_code: err?.dvsaErrorCode, error_message: err?.dvsaErrorMessage, request_id: err?.requestId },
        { status: 503 }
      )
    }

    // DVSA not configured: return explicit error
    return NextResponse.json(
      { error: 'DVSA not configured', code: 'DVSA_NOT_CONFIGURED' },
      { status: 503 }
    )
  } catch (error) {
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
function isTokenEndpoint(url: string): boolean {
  return /oauth2\/v2\.0\/token/i.test(url)
}

function logConfigSummary() {}
function buildDVSAUrl(registration: string): string {
  const base = DVSA_API_BASE_URL.replace(/\/$/, '')
  if (/mot-tests/i.test(base)) {
    // Legacy beta endpoint with query parameter
    return `${base}?registration=${encodeURIComponent(registration)}`
  }
  // v1 API style: use path parameter for registration
  if (/\/registration(\/)?$/i.test(base)) {
    return `${base}/${encodeURIComponent(registration)}`
  }
  if (/\/v1\/trade\/vehicles/i.test(base)) {
    return `${base}/registration/${encodeURIComponent(registration)}`
  }
  // Base host only: default to official v1 path
  if (/^https?:\/\/history\.mot\.api\.gov\.uk$/i.test(base)) {
    return `${base}/v1/trade/vehicles/registration/${encodeURIComponent(registration)}`
  }
  // Default fallback to query param
  return `${base}?registration=${encodeURIComponent(registration)}`
}
function getDVSAAcceptHeader(): string {
  const base = DVSA_API_BASE_URL.toLowerCase()
  if (base.includes('history.mot.api.gov.uk') || base.includes('/v1/')) {
    return 'application/json'
  }
  return 'application/json+v6'
}
