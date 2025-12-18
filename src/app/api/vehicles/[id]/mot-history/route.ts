import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { fetchMotHistoryFromDVSA, readLocalMotJson, validateMotSchema, transformDVSAData } from '@/lib/mot-utils'
// Helper function to refresh MOT data manually
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vehicleId = (await params).id

    // Check if vehicle exists and belongs to user
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
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vehicleId = (await params).id

    // Check if vehicle exists and belongs to user
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
    const headers: Record<string, string> = {}
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
