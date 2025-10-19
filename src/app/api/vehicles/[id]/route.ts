import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateVehicleSchema } from '@/lib/validations'

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