import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateDistance } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const limit = parseInt(searchParams.get('limit') || '20')
    const radius = parseInt(searchParams.get('radius') || '25') // miles

    if (!location) {
      return NextResponse.json(
        { error: 'Location parameter is required' },
        { status: 400 }
      )
    }

    // Build search conditions
    const searchConditions: any = {
      dvlaApproved: true, // Only show approved garages
      OR: [
        {
          city: {
            contains: location,
            mode: 'insensitive'
          }
        },
        {
          postcode: {
            contains: location.replace(/\s/g, ''), // Remove spaces for postcode search
            mode: 'insensitive'
          }
        },
        {
          name: {
            contains: location,
            mode: 'insensitive'
          }
        }
      ]
    }

    // Fetch garages with related data
    const garages = await prisma.garage.findMany({
      where: searchConditions,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        bookings: {
          select: {
            id: true
          }
        },
        _count: {
          select: {
            bookings: true
          }
        }
      },
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate distances if user location is provided
    let processedGarages = garages.map(garage => {
      let distance: number | undefined
      
      if (lat && lng && garage.latitude && garage.longitude) {
        distance = calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          garage.latitude,
          garage.longitude
        )
      }

      // Calculate average rating (mock data for now)
      const rating = Math.random() * 2 + 3 // Random rating between 3-5
      const reviewCount = Math.floor(Math.random() * 50) + 5 // Random review count

      return {
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
        distance,
        rating: Math.round(rating * 10) / 10,
        reviewCount,
        totalBookings: garage._count.bookings
      }
    })

    // Filter by radius if user location is provided
    if (lat && lng) {
      processedGarages = processedGarages.filter(garage => 
        !garage.distance || garage.distance <= radius
      )
      
      // Sort by distance
      processedGarages.sort((a, b) => {
        if (!a.distance && !b.distance) return 0
        if (!a.distance) return 1
        if (!b.distance) return -1
        return a.distance - b.distance
      })
    }

    return NextResponse.json({
      garages: processedGarages,
      total: processedGarages.length,
      searchLocation: location,
      userLocation: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null
    })

  } catch (error) {
    console.error('Error searching garages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}