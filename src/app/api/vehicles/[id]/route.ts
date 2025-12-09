import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'
import { updateVehicleSchema } from '@/lib/validations'

// DVSA API Configuration (used to enrich vehicle with motTests)
const DVSA_API_BASE_URL = process.env.DVSA_API_BASE_URL || 'https://beta.check-mot.service.gov.uk/trade/vehicles/mot-tests'
const DVSA_API_KEY = process.env.DVSA_API_KEY || ''
const DVSA_CLIENT_ID = process.env.DVSA_CLIENT_ID || ''
const DVSA_CLIENT_SECRET = process.env.DVSA_CLIENT_SECRET || ''
const DVSA_TOKEN_URL = process.env.DVSA_TOKEN_URL || 'https://login.microsoftonline.com/a455b827-244f-4c97-b5b4-ce5d13b4d00c/oauth2/v2.0/token'
const DVSA_SCOPE = process.env.DVSA_SCOPE || 'https://tapi.dvsa.gov.uk/.default'

interface TokenCache { accessToken: string; expiresAt: number }
let dvsaTokenCache: TokenCache | null = null

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
    const response = await fetch(DVSA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenRequestBody.toString()
    })
    if (!response.ok) return null
    const tokenData = await response.json()
    if (!tokenData.access_token) return null
    const expiresInSeconds = tokenData.expires_in || 3600
    dvsaTokenCache = { accessToken: tokenData.access_token, expiresAt: now + (expiresInSeconds * 1000) }
    return dvsaTokenCache.accessToken
  } catch { return null }
}

async function fetchVehicleMotFromDVSA(registration: string): Promise<any | null> {
  const url = `${DVSA_API_BASE_URL}?registration=${encodeURIComponent(registration)}`
  const headers: Record<string, string> = { Accept: 'application/json+v6' }
  if (DVSA_API_KEY) headers['x-api-key'] = DVSA_API_KEY
  let response = await fetch(url, { method: 'GET', headers })
  if (!response.ok && (response.status === 401 || response.status === 403)) {
    const token = await getDVSAToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
      response = await fetch(url, { method: 'GET', headers })
    }
  }
  if (!response.ok) return null
  const data = await response.json()
  return Array.isArray(data) ? data[0] : data
}

function milesToKm(value: number | null): number | null {
  if (value == null) return null
  return Math.round(value * 1.60934)
}

function mapTestResult(testResult: string): 'PASS' | 'FAIL' | 'ADVISORY' | 'REFUSED' {
  const resultMap: Record<string, 'PASS' | 'FAIL' | 'ADVISORY' | 'REFUSED'> = {
    'PASSED': 'PASS',
    'FAILED': 'FAIL',
    'ADVISORY': 'ADVISORY',
  }
  return resultMap[testResult] || 'REFUSED'
}

function transformMotTests(dvsaData: any): Array<{
  id: string
  testDate: string
  expiryDate: string | null
  result: 'PASS' | 'FAIL' | 'ADVISORY' | 'REFUSED'
  mileage: number | null
  odometerUnit?: string
  odometerResultType?: string
  testNumber?: string
  defects: { dangerous: number; major: number; minor: number; advisory: number; prs: number }
  details: string[]
}> {
  const tests = dvsaData?.motTests
  if (!Array.isArray(tests)) return []
  return tests.map((test: any) => {
    const defects = Array.isArray(test.defects) ? test.defects : []
    const dangerousCount = defects.filter((d: any) => d.dangerous === true).length
    const majorCount = defects.filter((d: any) => d.type === 'MAJOR').length
    const minorCount = defects.filter((d: any) => d.type === 'MINOR').length
    const advisoryCount = defects.filter((d: any) => d.type === 'ADVISORY').length
    const prsCount = defects.filter((d: any) => d.type === 'PRS').length

    const rawMileage = test?.odometerValue ? parseInt(test.odometerValue, 10) : null
    const unitStr = (test?.odometerUnit || '').toUpperCase()
    const isMiles = unitStr.startsWith('MI')
    const mileageKm = rawMileage !== null ? (isMiles ? milesToKm(rawMileage) : rawMileage) : null

    return {
      id: test.motTestNumber || `${test.completedDate}-${test.registrationAtTimeOfTest || ''}`,
      testDate: test.completedDate,
      expiryDate: test.expiryDate || null,
      result: mapTestResult(test.testResult),
      mileage: mileageKm,
      odometerUnit: test.odometerUnit,
      odometerResultType: test.odometerResultType,
      testNumber: test.motTestNumber,
      defects: { dangerous: dangerousCount, major: majorCount, minor: minorCount, advisory: advisoryCount, prs: prsCount },
      details: defects.map((d: any) => d.text).filter((t: any) => typeof t === 'string')
    }
  }).sort((a: any, b: any) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime())
}

async function readLocalMotJson(registration: string): Promise<any | null> {
  try {
    const filePath = path.join(process.cwd(), 'src', 'app', 'api', 'vehicles', '[id]', 'mot-history', `vehicle-${registration}.json`)
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
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

// GET a specific vehicle
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Usando await para desempacotar params, que agora é uma Promise no Next.js
    const vehicleId = (await params).id

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
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
      }
    })

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }

    const latestMot = vehicle.motHistory[0]

    // Fetch DVSA MOT tests for this vehicle's registration
    let motTests: ReturnType<typeof transformMotTests> = []
    let motError: string | null = null
    try {
      const dvsaData = await fetchVehicleMotFromDVSA(vehicle.registration)
      if (dvsaData && Array.isArray(dvsaData.motTests) && dvsaData.motTests.length > 0) {
        motTests = transformMotTests(dvsaData)
      } else {
        const localData = await readLocalMotJson(vehicle.registration)
        if (localData) {
          const schemaErr = validateMotSchema(localData)
          if (!schemaErr && Array.isArray(localData.motTests) && localData.motTests.length > 0) {
            motTests = transformMotTests(localData)
            motError = null
          } else {
            motError = schemaErr || 'MOT history not available from DVSA'
          }
        } else {
          motError = 'MOT history not available from DVSA'
        }
      }
    } catch {
      const localData = await readLocalMotJson(vehicle.registration)
      if (localData) {
        const schemaErr = validateMotSchema(localData)
        if (!schemaErr && Array.isArray(localData.motTests) && localData.motTests.length > 0) {
          motTests = transformMotTests(localData)
          motError = null
        } else {
          motError = schemaErr || 'Failed to fetch MOT history from DVSA'
        }
      } else {
        motError = 'Failed to fetch MOT history from DVSA'
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

    return NextResponse.json({
      id: vehicle.id,
      registration: vehicle.registration,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      fuelType: vehicle.fuelType,
      engineSize: vehicle.engineSize,
      color: vehicle.color,
      lastMotDate: latestMot?.testDate ? latestMot.testDate.toISOString().split('T')[0] : null,
      lastMotResult: latestMot?.result || null,
      nextMotDate: latestMot?.expiryDate ? latestMot.expiryDate.toISOString().split('T')[0] : null,
      motStatus: motStatus,
      createdAt: vehicle.createdAt,
      motTests,
      motError
    })

  } catch (error) {
    console.error('Error fetching vehicle:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// UPDATE a vehicle
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if vehicle exists and belongs to user
    // Usando await para desempacotar params, que agora é uma Promise no Next.js
    const vehicleId = (await params).id
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        ownerId: session.user.id
      }
    })

    if (!existingVehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found or does not belong to user' },
        { status: 404 }
      )
    }

    const body = await request.json()
    
    // Validate request data
    const validationResult = updateVehicleSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    // Update vehicle
    // Usando o vehicleId já obtido anteriormente
    const updatedVehicle = await prisma.vehicle.update({
      where: {
        id: vehicleId
      },
      data: validationResult.data
    })

    return NextResponse.json({
      message: 'Vehicle updated successfully',
      vehicle: {
        id: updatedVehicle.id,
        registration: updatedVehicle.registration,
        make: updatedVehicle.make,
        model: updatedVehicle.model,
        year: updatedVehicle.year,
        fuelType: updatedVehicle.fuelType,
        engineSize: updatedVehicle.engineSize,
        color: updatedVehicle.color,
        createdAt: updatedVehicle.createdAt,
        updatedAt: updatedVehicle.updatedAt
      }
    })

  } catch (error) {
    console.error('Error updating vehicle:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE a vehicle
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if vehicle exists and belongs to user
    // Usando await para desempacotar params, que agora é uma Promise no Next.js
    const vehicleId = (await params).id
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        ownerId: session.user.id
      },
      include: {
        bookings: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED']
            }
          }
        }
      }
    })

    if (!existingVehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found or does not belong to user' },
        { status: 404 }
      )
    }

    // Check if vehicle has active bookings
    if (existingVehicle.bookings.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete vehicle with active bookings' },
        { status: 400 }
      )
    }

    // Delete vehicle
    // Usando o vehicleId já obtido anteriormente
    await prisma.vehicle.delete({
      where: {
        id: vehicleId
      }
    })

    return NextResponse.json({
      message: 'Vehicle deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting vehicle:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
