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