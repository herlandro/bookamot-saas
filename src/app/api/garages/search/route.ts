import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateDistance } from '@/lib/utils'

// Function to get coordinates from postcode (simplified - in production use a geocoding service)
function getCoordinatesFromPostcode(postcode: string): { lat: number, lng: number } | null {
  // Simplified mapping for Hertfordshire postcodes
  const postcodeMap: { [key: string]: { lat: number, lng: number } } = {
    'SG1': { lat: 51.9025, lng: -0.2021 }, // Stevenage
    'SG4': { lat: 51.9489, lng: -0.2881 }, // Hitchin
    'SG5': { lat: 51.9501, lng: -0.2795 }, // Hitchin
    'SG6': { lat: 51.9781, lng: -0.2281 }, // Letchworth
    'SG7': { lat: 51.9906, lng: -0.1881 }, // Baldock
  };
  
  const prefix = postcode.substring(0, 3).toUpperCase();
  return postcodeMap[prefix] || null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postcode = searchParams.get('postcode')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const date = searchParams.get('date')
    const time = searchParams.get('time')
    const limit = parseInt(searchParams.get('limit') || '20')
    const radius = parseInt(searchParams.get('radius') || '25') // miles
    
    let searchLat: number | null = null;
    let searchLng: number | null = null;
    
    // Determine search coordinates
     if (lat && lng) {
       searchLat = parseFloat(lat);
       searchLng = parseFloat(lng);
     } else if (postcode && postcode !== 'Current Location') {
      const coords = getCoordinatesFromPostcode(postcode);
      if (coords) {
        searchLat = coords.lat;
        searchLng = coords.lng;
      }
    }

    // Build search conditions
    const searchConditions: any = {
      dvlaApproved: true // Only show approved garages
    }

    // Fetch garages with related data
    let garages = await prisma.garage.findMany({
      where: searchConditions,
      include: {
        availability: date ? {
          where: {
            date: new Date(date),
            isBooked: false,
            ...(time ? { timeSlot: time } : {})
          }
        } : false,
        reviews: {
          select: {
            rating: true
          }
        }
      }
    });

    // Calculate distances and process garages
    const garagesWithDistance = garages.map(garage => {
      let distance: number | undefined;
      
      if (searchLat !== null && searchLng !== null && garage.latitude && garage.longitude) {
        distance = calculateDistance(
          searchLat,
          searchLng,
          garage.latitude,
          garage.longitude
        );
      }
      
      // Calculate average rating
      const ratings = garage.reviews?.map(r => r.rating) || [];
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : undefined;
      
      // Get available time slots
      const availableSlots = garage.availability 
        ? garage.availability.map(slot => slot.timeSlot)
        : [];
      
      return {
        id: garage.id,
        name: garage.name,
        address: garage.address,
        city: garage.city,
        postcode: garage.postcode,
        phone: garage.phone || '',
        motPrice: garage.motPrice,
        distance,
        rating: averageRating,
        reviewCount: ratings.length,
        availableSlots
      };
    });
    
    // Filter by distance if coordinates provided (within radius)
    let filteredGarages = garagesWithDistance;
    if (searchLat !== null && searchLng !== null) {
      filteredGarages = garagesWithDistance.filter(garage => 
        garage.distance !== undefined && garage.distance <= radius
      );
    }
    
    // Sort by distance if available, otherwise by price
    filteredGarages.sort((a, b) => {
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      return a.motPrice - b.motPrice;
    });
    
    // Limit results
    const limitedGarages = filteredGarages.slice(0, limit);

    return NextResponse.json({
      success: true,
      garages: limitedGarages,
      total: limitedGarages.length
    })

  } catch (error) {
    console.error('Error searching garages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}