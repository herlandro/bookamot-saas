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

    // Fetch actual reviews from database
    const reviews = await prisma.review.findMany({
      where: {
        garageId: garage.id
      },
      select: {
        rating: true
      }
    })
    
    // Calcular média de avaliações reais
    const reviewCount = reviews.length
    const rating = reviewCount > 0
      ? reviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0) / reviewCount
      : 0 // If there are no reviews, average is 0

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