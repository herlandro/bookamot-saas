import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createVehicleSchema } from '@/lib/validations'

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
          },
          take: 1
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      vehicles: vehicles.map(vehicle => ({
        id: vehicle.id,
        registration: vehicle.registration,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        fuelType: vehicle.fuelType,
        engineSize: vehicle.engineSize,
        color: vehicle.color,
        lastMotDate: vehicle.motHistory[0]?.testDate || null,
        lastMotResult: vehicle.motHistory[0]?.result || null,
        createdAt: vehicle.createdAt
      }))
    })

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

    // Check if vehicle already exists for this user
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        registration: registration.toUpperCase(),
        ownerId: session.user.id
      }
    })

    if (existingVehicle) {
      return NextResponse.json(
        { error: 'Vehicle with this registration already exists' },
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

  } catch (error) {
    console.error('Error creating vehicle:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}