import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateVehicleSchema } from '@/lib/validations'

// GET a specific vehicle
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: params.id,
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
      }
    })

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
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
      lastMotDate: vehicle.motHistory[0]?.testDate || null,
      lastMotResult: vehicle.motHistory[0]?.result || null,
      createdAt: vehicle.createdAt
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
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if vehicle exists and belongs to user
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        id: params.id,
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
    const updatedVehicle = await prisma.vehicle.update({
      where: {
        id: params.id
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
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if vehicle exists and belongs to user
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        id: params.id,
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
    await prisma.vehicle.delete({
      where: {
        id: params.id
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