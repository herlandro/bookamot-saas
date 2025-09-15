import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateDistance } from '@/lib/utils'

// Function to get available time slots based on garage schedules
function getAvailableTimeSlots(garage: any, date: Date, requestedTime?: string): string[] {
  // Get day of week (0 = Sunday, 1 = Monday, ...)
  const dayOfWeek = date.getDay();
  
  // Find the schedule for this day
  const schedule = garage.schedules.find((s: any) => s.dayOfWeek === dayOfWeek);
  
  // If no schedule or garage is closed on this day, return empty array
  if (!schedule || !schedule.isOpen) {
    return [];
  }
  
  // Check for schedule exceptions
  const exception = garage.scheduleExceptions.find(
    (e: any) => e.date.toDateString() === date.toDateString()
  );
  
  // If there's a closed exception for this date, return empty array
  if (exception && !exception.isOpen) {
    return [];
  }
  
  // Generate all possible time slots based on opening hours and slot duration
  const [openHour, openMinute] = schedule.openTime.split(':').map(Number);
  const [closeHour, closeMinute] = schedule.closeTime.split(':').map(Number);
  
  const slots: string[] = [];
  const slotDuration = schedule.slotDuration || 60; // Default to 60 minutes if not specified
  
  // Start time in minutes from midnight
  let currentMinutes = openHour * 60 + openMinute;
  const endMinutes = closeHour * 60 + closeMinute - slotDuration; // Last slot must end before closing
  
  while (currentMinutes <= endMinutes) {
    const hour = Math.floor(currentMinutes / 60);
    const minute = currentMinutes % 60;
    
    const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    // Check if this slot is blocked
    const isBlocked = garage.timeSlotBlocks.some(
      (block: any) => 
        block.date.toDateString() === date.toDateString() && 
        block.timeSlot === timeSlot
    );
    
    // If not blocked, add to available slots
    if (!isBlocked) {
      slots.push(timeSlot);
    }
    
    // Move to next slot
    currentMinutes += slotDuration;
  }
  
  // If a specific time was requested, only return that time if it's available
  if (requestedTime && slots.includes(requestedTime)) {
    return [requestedTime];
  }
  
  return slots;
}

// Function to get coordinates from postcode or city name (simplified - in production use a geocoding service)
function getCoordinatesFromPostcode(input: string): { lat: number, lng: number } | null {
  // Simplified mapping for Hertfordshire postcodes and cities
  const locationMap: { [key: string]: { lat: number, lng: number } } = {
    // Postcodes
    'SG1': { lat: 51.9025, lng: -0.2021 }, // Stevenage
    'SG4': { lat: 51.9489, lng: -0.2881 }, // Hitchin
    'SG5': { lat: 51.9501, lng: -0.2795 }, // Hitchin
    'SG6': { lat: 51.9781, lng: -0.2281 }, // Letchworth
    'SG7': { lat: 51.9906, lng: -0.1881 }, // Baldock
    // Cities
    'STEVENAGE': { lat: 51.9025, lng: -0.2021 },
    'HITCHIN': { lat: 51.9489, lng: -0.2881 },
    'LETCHWORTH': { lat: 51.9781, lng: -0.2281 },
    'BALDOCK': { lat: 51.9906, lng: -0.1881 },
    'LONDON': { lat: 51.5074, lng: -0.1278 },
  };
  
  // Try to match by postcode prefix (first 2-3 characters)
  const prefix = input.substring(0, 3).toUpperCase();
  if (locationMap[prefix]) {
    return locationMap[prefix];
  }
  
  // Try to match by city name
  const cityName = input.toUpperCase().trim();
  return locationMap[cityName] || null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
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
     } else if (location && location !== 'Current Location') {
      const coords = getCoordinatesFromPostcode(location);
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
        schedules: true,
        scheduleExceptions: date ? {
          where: {
            date: new Date(date)
          }
        } : false,
        timeSlotBlocks: date ? {
          where: {
            date: new Date(date),
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
    const garagesWithDistance = garages.map((garage: any) => {
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
      const ratings = garage.reviews?.map((r: any) => r.rating) || [];
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length 
        : undefined;
      
      // Get available time slots based on schedules and blocks
      const availableSlots = date 
        ? getAvailableTimeSlots(garage, new Date(date), time || undefined)
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
      filteredGarages = garagesWithDistance.filter((garage: any) => 
        garage.distance !== undefined && garage.distance <= radius
      );
    }
    
    // Sort by distance if available, otherwise by price
    filteredGarages.sort((a: any, b: any) => {
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