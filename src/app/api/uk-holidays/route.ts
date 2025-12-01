import { NextResponse } from 'next/server'

interface UKHoliday {
  title: string
  date: string
  notes: string
  bunting: boolean
}

interface UKHolidaysResponse {
  'england-and-wales': {
    division: string
    events: UKHoliday[]
  }
  'scotland': {
    division: string
    events: UKHoliday[]
  }
  'northern-ireland': {
    division: string
    events: UKHoliday[]
  }
}

// Cache for holidays data
let cachedHolidays: UKHoliday[] | null = null
let cacheTimestamp: number | null = null
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') || new Date().getFullYear().toString()
    const region = searchParams.get('region') || 'england-and-wales'

    // Check cache
    const now = Date.now()
    if (cachedHolidays && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      const filteredHolidays = filterHolidaysByYear(cachedHolidays, year)
      return NextResponse.json({ holidays: filteredHolidays })
    }

    // Fetch from UK Government API
    const response = await fetch('https://www.gov.uk/bank-holidays.json', {
      next: { revalidate: 86400 } // Revalidate every 24 hours
    })

    if (!response.ok) {
      throw new Error('Failed to fetch UK holidays')
    }

    const data: UKHolidaysResponse = await response.json()
    
    // Get holidays for the specified region
    const regionData = data[region as keyof UKHolidaysResponse]
    if (!regionData) {
      return NextResponse.json({ error: 'Invalid region' }, { status: 400 })
    }

    // Update cache
    cachedHolidays = regionData.events
    cacheTimestamp = now

    const filteredHolidays = filterHolidaysByYear(regionData.events, year)

    return NextResponse.json({
      holidays: filteredHolidays.map(h => ({
        title: h.title,
        date: h.date,
        notes: h.notes || '',
        bunting: h.bunting
      }))
    })
  } catch (error) {
    console.error('Error fetching UK holidays:', error)
    
    // Return fallback holidays if API fails
    return NextResponse.json({
      holidays: getFallbackHolidays(new Date().getFullYear())
    })
  }
}

function filterHolidaysByYear(holidays: UKHoliday[], year: string): UKHoliday[] {
  return holidays.filter(h => h.date.startsWith(year))
}

function getFallbackHolidays(year: number): { title: string; date: string; notes: string }[] {
  // Fallback holidays in case API is unavailable
  return [
    { title: "New Year's Day", date: `${year}-01-01`, notes: '' },
    { title: 'Good Friday', date: '', notes: 'Date varies' },
    { title: 'Easter Monday', date: '', notes: 'Date varies' },
    { title: 'Early May bank holiday', date: '', notes: 'First Monday of May' },
    { title: 'Spring bank holiday', date: '', notes: 'Last Monday of May' },
    { title: 'Summer bank holiday', date: '', notes: 'Last Monday of August' },
    { title: 'Christmas Day', date: `${year}-12-25`, notes: '' },
    { title: 'Boxing Day', date: `${year}-12-26`, notes: '' },
  ]
}

