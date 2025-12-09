import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'
import { validateMotSchema } from '@/lib/mot-utils'

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


export async function fetchWithRetries(url: string, headers: Record<string, string>, retries = 2, timeoutMs = 10000): Promise<Response | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, { method: 'GET', headers, signal: controller.signal })
      clearTimeout(timer)
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') || '0', 10)
        const backoff = retryAfter > 0 ? retryAfter * 1000 : Math.min(2000 * (attempt + 1), 10000)
        await new Promise(r => setTimeout(r, backoff))
        continue
      }
      if (!res.ok && res.status >= 500 && attempt < retries) {
        const backoff = Math.min(1000 * Math.pow(2, attempt), 8000)
        await new Promise(r => setTimeout(r, backoff))
        continue
      }
      return res
    } catch (e) {
      clearTimeout(timer)
      if (attempt < retries) {
        const backoff = Math.min(1000 * Math.pow(2, attempt), 8000)
        await new Promise(r => setTimeout(r, backoff))
        continue
      }
      return null
    }
  }
  return null
}

async function fetchMotHistoryFromDVSA(registration: string): Promise<any | null> {
  if (!DVSA_API_KEY) {
    console.log('⚠️ [MOT History] DVSA_API_KEY not configured')
    return null
  }
  const url = `${DVSA_API_BASE_URL}?registration=${encodeURIComponent(registration)}`
  const headers: Record<string, string> = {
    'Accept': 'application/json+v6',
    'x-api-key': DVSA_API_KEY
  }
  console.log(`🔍 [MOT History] Requesting DVSA: ${url}`)
  const response = await fetchWithRetries(url, headers)
  if (!response) {
    console.error('❌ [MOT History] DVSA request failed after retries')
    return fetchMotHistoryFromDVSAWithToken(registration)
  }
  if (!response.ok) {
    const errorBody = await response.text()
    console.error(`❌ [MOT History] DVSA API error: ${response.status} ${response.statusText}`)
    console.error(`❌ [MOT History] Response body: ${errorBody}`)
    if (response.status === 401 || response.status === 403) {
      console.log('🔄 [MOT History] Trying with OAuth token...')
      return fetchMotHistoryFromDVSAWithToken(registration)
    }
    if (response.status === 404) {
      return { motTests: [] }
    }
    return null
  }
  const data = await response.json()
  const vehicleData = Array.isArray(data) ? data[0] : data
  console.log(`✅ [MOT History] DVSA returned ${vehicleData?.motTests?.length || 0} tests for ${registration}`)
  return vehicleData
}

// Alternative method using OAuth token
export async function fetchMotHistoryFromDVSAWithToken(registration: string): Promise<any | null> {
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
export function transformDVSAData(dvsaData: any): any[] {
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
    const defects = Array.isArray(test.defects) ? test.defects : []
    const dangerousCount = defects.filter((d: any) => d.dangerous === true).length
    const majorCount = defects.filter((d: any) => d.type === 'MAJOR').length
    const minorCount = defects.filter((d: any) => d.type === 'MINOR').length
    const advisoryCount = defects.filter((d: any) => d.type === 'ADVISORY').length
    const prsCount = defects.filter((d: any) => d.type === 'PRS').length

    const rawMileage = test?.odometerValue ? parseInt(test.odometerValue, 10) : null
    const unitStr = (test?.odometerUnit || '').toUpperCase()
    const isMiles = unitStr.startsWith('MI')
    const mileageKm = rawMileage !== null ? (isMiles ? Math.round(rawMileage * 1.60934) : rawMileage) : null
    const normalizedUnit = isMiles ? 'KILOMETRES' : unitStr || null

    return {
      id: test.motTestNumber || `${test.completedDate}-${test.registrationAtTimeOfTest || ''}`,
      testDate: test.completedDate,
      expiryDate: test.expiryDate || null,
      result: test.testResult === 'PASSED' ? 'PASS' : test.testResult === 'FAILED' ? 'FAIL' : 'REFUSED',
      mileage: mileageKm,
      odometerUnit: normalizedUnit,
      odometerResultType: test.odometerResultType,
      testNumber: test.motTestNumber,
      dataSource: test.dataSource,
      registrationAtTimeOfTest: test.registrationAtTimeOfTest,
      defects: { dangerous: dangerousCount, major: majorCount, minor: minorCount, advisory: advisoryCount, prs: prsCount },
      details: defects.map((d: any) => d.text).filter((t: any) => typeof t === 'string')
    }
  })
}

function validateMotSchema(data: any): string | null {
  if (!data || typeof data !== 'object') return 'Invalid JSON structure'
  if (!Array.isArray(data.motTests)) return 'motTests must be an array'
  const allowedResults = new Set(['PASSED', 'FAILED', 'REFUSED'])
  for (const t of data.motTests) {
    if (!t || typeof t !== 'object') return 'motTests contains invalid entries'
    if (!t.completedDate || typeof t.completedDate !== 'string') return 'completedDate missing or invalid'
    if (!t.testResult || typeof t.testResult !== 'string' || !allowedResults.has(t.testResult)) return 'testResult missing or invalid'
    if (t.odometerValue != null && isNaN(parseInt(String(t.odometerValue), 10))) return 'odometerValue must be numeric'
    if (t.defects != null && !Array.isArray(t.defects)) return 'defects must be an array'
    if (Array.isArray(t.defects)) {
      for (const d of t.defects) {
        if (!d || typeof d !== 'object' || typeof d.text !== 'string') return 'defect entries must include text'
      }
    }
  }
  return null
}

export async function readLocalMotJson(registration: string): Promise<any | null> {
  try {
    const filePath = path.join(process.cwd(), 'src', 'app', 'api', 'vehicles', '[id]', 'mot-history', `vehicle-${registration}.json`)
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
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

    // Transform and return data (no persistence)
    const transformedData = transformDVSAData(dvsaData)
    console.log(`✅ Manual refresh completed. Returned ${transformedData.length} MOT records (no persistence)`)
    return NextResponse.json({
      success: true,
      message: `Successfully refreshed MOT data. Found ${transformedData.length} records.`,
      data: transformedData,
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

    console.log(`📡 Fetching MOT history from DVSA for registration: ${vehicle.registration}`)
    const dvsaData = await fetchMotHistoryFromDVSA(vehicle.registration)
    if (!dvsaData || !Array.isArray(dvsaData.motTests)) {
      const localData = await readLocalMotJson(vehicle.registration)
      if (localData) {
        const schemaErr = validateMotSchema(localData)
        if (schemaErr) {
          return NextResponse.json({ error: `Invalid MOT JSON file: ${schemaErr}` }, { status: 422 })
        }
      }
      if (localData && Array.isArray(localData.motTests) && localData.motTests.length > 0) {
        const transformedLocal = transformDVSAData(localData)
        return NextResponse.json(transformedLocal)
      }
      return NextResponse.json(
        { error: 'MOT history not available from DVSA' },
        { status: 503 }
      )
    }
    const transformedData = transformDVSAData(dvsaData)
    if (transformedData.length === 0) {
      const localData = await readLocalMotJson(vehicle.registration)
      if (localData) {
        const schemaErr = validateMotSchema(localData)
        if (schemaErr) {
          return NextResponse.json({ error: `Invalid MOT JSON file: ${schemaErr}` }, { status: 422 })
        }
      }
      if (localData && Array.isArray(localData.motTests) && localData.motTests.length > 0) {
        const transformedLocal = transformDVSAData(localData)
        return NextResponse.json(transformedLocal)
      }
      return NextResponse.json(
        { error: 'No MOT data available for this vehicle' },
        { status: 404 }
      )
    }
    const dbVehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, ownerId: session.user.id },
      include: { motHistory: { orderBy: { testDate: 'desc' } } }
    })
    let headers: Record<string, string> = {}
    if (dbVehicle && dbVehicle.motHistory.length > 0) {
      const dbMap = new Map<string, { testDate: string; result: string; mileage: number | null }>()
      for (const r of dbVehicle.motHistory) {
        const key = r.testNumber || r.testDate.toISOString()
        dbMap.set(key, { testDate: r.testDate.toISOString(), result: r.result, mileage: r.mileage ?? null })
      }
      let mismatches = 0
      for (const t of transformedData) {
        const key = t.testNumber || t.testDate
        const db = dbMap.get(key)
        if (!db) { mismatches++; continue }
        const sameResult = db.result === t.result
        const sameMileage = (db.mileage ?? null) === (t.mileage ?? null)
        const sameDate = new Date(db.testDate).getTime() === new Date(t.testDate).getTime()
        if (!sameResult || !sameMileage || !sameDate) mismatches++
      }
      headers['x-mot-sync'] = mismatches === 0 ? 'match' : 'mismatch'
      headers['x-mot-sync-counts'] = `${transformedData.length}/${dbVehicle.motHistory.length}`
    } else {
      headers['x-mot-sync'] = 'no-db'
    }
    const res = NextResponse.json(transformedData)
    Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v))
    return res
  } catch (error) {
    console.error('❌ MOT history error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
