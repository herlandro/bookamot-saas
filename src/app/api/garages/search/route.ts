import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateDistance } from '@/lib/utils'
import { geocodeAddress } from '@/lib/geocoding'

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
  const slotDuration = schedule.slotDuration || 30; // Default to 30 minutes if not specified
  
  // Start time in minutes from midnight
  let currentMinutes = openHour * 60 + openMinute;
  const endMinutes = closeHour * 60 + closeMinute - slotDuration; // Last slot must end before closing
  
  // Get current time for filtering past slots
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

  while (currentMinutes <= endMinutes) {
    const hour = Math.floor(currentMinutes / 60);
    const minute = currentMinutes % 60;

    const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    // Check if this slot is in the past (for today only)
    const isPast = isToday && currentMinutes <= currentTimeMinutes;

    // Check if this slot is blocked
    const isBlocked = garage.timeSlotBlocks.some(
      (block: any) =>
        block.date.toDateString() === date.toDateString() &&
        block.timeSlot === timeSlot
    );

    // Check if this slot is already booked
    const isBooked = garage.bookings && garage.bookings.some(
      (booking: any) =>
        booking.date.toDateString() === date.toDateString() &&
        booking.timeSlot === timeSlot &&
        ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(booking.status)
    );

    // If not past, not blocked and not booked, add to available slots
    if (!isPast && !isBlocked && !isBooked) {
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

    console.log('🔍 Search params:', { location, lat, lng, date, time, limit, radius })
    console.log('🔄 API recompiled - distance ordering active')

    let searchLat: number | null = null;
    let searchLng: number | null = null;

    // Determine search coordinates
     if (lat && lng) {
       searchLat = parseFloat(lat);
       searchLng = parseFloat(lng);
       console.log('📍 Using provided coordinates:', { searchLat, searchLng })
     } else if (location && location !== 'Current Location') {
      // Use the new geocoding service (database + external API)
      const coords = await geocodeAddress(location);
      console.log('📍 Geocoded location:', location, '→', coords)
      if (coords) {
        searchLat = coords.lat;
        searchLng = coords.lng;
      }
    }

    // Build search conditions (visibility for MOT search is driven by available quota below, not isActive)
    const searchConditions: any = {
      dvlaApproved: true // Only show approved garages
    }

    // If location is provided but couldn't be geocoded, search by text (name, city, postcode)
    if (location && searchLat === null && searchLng === null) {
      console.log(`🔤 Searching by text: "${location}"`)
      searchConditions.OR = [
        { name: { contains: location, mode: 'insensitive' } },
        { city: { contains: location, mode: 'insensitive' } },
        { postcode: { contains: location, mode: 'insensitive' } },
        { address: { contains: location, mode: 'insensitive' } }
      ]
    }

    // Regra: só mostrar garagens com MOT quota disponível (consumido = bookings não cancelados)
    const withQuota = await prisma.garage.findMany({
      where: { ...searchConditions, motQuota: { gt: 0 } },
      select: { id: true, motQuota: true }
    })
    const consumedByGarage = await prisma.booking.groupBy({
      by: ['garageId'],
      where: { status: { not: 'CANCELLED' } },
      _count: true
    })
    const consumedCountByGarageId = Object.fromEntries(
      consumedByGarage.map((c) => [c.garageId, c._count])
    )
    const availableGarageIds = withQuota
      .filter((g) => (consumedCountByGarageId[g.id] ?? 0) < (g.motQuota ?? 0))
      .map((g) => g.id)
    if (availableGarageIds.length === 0) {
      console.log('🔒 No garages with MOT quota available for customer search')
    }
    searchConditions.id = availableGarageIds.length > 0
      ? { in: availableGarageIds }
      : { in: ['__none__'] } // garante 0 resultados quando nenhuma garagem tem quota

    // Fetch garages with related data
    const garages = await prisma.garage.findMany({
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
        bookings: date ? {
          where: {
            date: new Date(date),
            status: {
              notIn: ['CANCELLED'] // Exclude cancelled bookings
            }
          }
        } : false,
        reviews: {
          select: {
            rating: true
          }
        }
      }
    });

    console.log(`🏢 Found ${garages.length} garages in database`);

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
        console.log(`📍 ${garage.name}: ${distance.toFixed(2)} miles from search location`)
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
      
      const result = {
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

      console.log(`🔧 Returning garage: ${garage.name}, distance: ${distance}`)

      return result;
    });
    
    // Filter by distance if coordinates provided (within radius)
    let filteredGarages = garagesWithDistance;
    if (searchLat !== null && searchLng !== null) {
      console.log(`📏 Filtering by distance (radius: ${radius} miles)`)
      // Include garages within radius OR garages without coordinates (so they still appear)
      filteredGarages = garagesWithDistance.filter((garage: any) =>
        garage.distance === undefined || garage.distance <= radius
      );
      console.log(`✅ ${filteredGarages.length} garages within radius (or without coordinates)`)
    }

    // Sort by distance if available, otherwise by price
    filteredGarages.sort((a: any, b: any) => {
      // Garages with distance come first, sorted by distance
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      // If only one has distance, it comes first
      if (a.distance !== undefined) return -1;
      if (b.distance !== undefined) return 1;
      // If neither has distance, sort by price
      return a.motPrice - b.motPrice;
    });

    // Limit results
    const limitedGarages = filteredGarages.slice(0, limit);

    console.log(`📤 Returning ${limitedGarages.length} garages`)
    console.log(`📦 First garage in response:`, JSON.stringify(limitedGarages[0], null, 2))

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