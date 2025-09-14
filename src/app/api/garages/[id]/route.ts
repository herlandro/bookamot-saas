import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const garage = await prisma.garage.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            bookings: true
          }
        }
      }
    })

    if (!garage) {
      return NextResponse.json(
        { error: 'Garage not found' },
        { status: 404 }
      )
    }

    // Calculate average rating (mock data for now)
    const rating = Math.random() * 2 + 3 // Random rating between 3-5
    const reviewCount = Math.floor(Math.random() * 50) + 5 // Random review count

    return NextResponse.json({
      id: garage.id,
      name: garage.name,
      address: garage.address,
      city: garage.city,
      postcode: garage.postcode,
      phone: garage.phone,
      email: garage.email,
      motPrice: garage.motPrice,
      latitude: garage.latitude,
      longitude: garage.longitude,
      dvlaApproved: garage.dvlaApproved,
      motLicenseNumber: garage.motLicenseNumber,
      rating: Math.round(rating * 10) / 10,
      reviewCount,
      totalBookings: garage._count.bookings,
      owner: garage.owner
    })

  } catch (error) {
    console.error('Error fetching garage:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}