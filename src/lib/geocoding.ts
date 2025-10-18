/**
 * Geocoding service for converting addresses/postcodes to coordinates
 * Uses multiple strategies:
 * 1. Database lookup (for existing garages)
 * 2. External geocoding API (Nominatim/OpenStreetMap - free)
 */

import { prisma } from '@/lib/prisma'

export interface Coordinates {
  lat: number
  lng: number
}

/**
 * Try to find coordinates from a garage in the database with matching postcode
 */
async function geocodeFromDatabase(postcode: string): Promise<Coordinates | null> {
  try {
    // Clean the postcode (remove spaces, uppercase)
    const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase()
    
    // Try to find a garage with this exact postcode
    const garage = await prisma.garage.findFirst({
      where: {
        postcode: {
          equals: postcode,
          mode: 'insensitive'
        },
        latitude: { not: null },
        longitude: { not: null }
      },
      select: {
        latitude: true,
        longitude: true,
        postcode: true
      }
    })
    
    if (garage && garage.latitude && garage.longitude) {
      console.log(`🗄️ Database geocoding: ${postcode} → ${garage.postcode} (${garage.latitude}, ${garage.longitude})`)
      return {
        lat: garage.latitude,
        lng: garage.longitude
      }
    }
    
    // Try to find a garage with similar postcode (same area)
    // e.g., "SG2 7HG" → find any garage starting with "SG2"
    const postcodeArea = cleanPostcode.substring(0, 3) // First 3 chars
    const areaGarage = await prisma.garage.findFirst({
      where: {
        postcode: {
          startsWith: postcodeArea,
          mode: 'insensitive'
        },
        latitude: { not: null },
        longitude: { not: null }
      },
      select: {
        latitude: true,
        longitude: true,
        postcode: true
      }
    })
    
    if (areaGarage && areaGarage.latitude && areaGarage.longitude) {
      console.log(`🗄️ Database area geocoding: ${postcode} → ${areaGarage.postcode} area (${areaGarage.latitude}, ${areaGarage.longitude})`)
      return {
        lat: areaGarage.latitude,
        lng: areaGarage.longitude
      }
    }
    
    return null
  } catch (error) {
    console.error('Database geocoding error:', error)
    return null
  }
}

/**
 * Geocode using Nominatim API (OpenStreetMap - free, no API key required)
 * Rate limit: 1 request per second
 */
async function geocodeFromNominatim(address: string): Promise<Coordinates | null> {
  try {
    // Add "UK" to the search to improve accuracy
    const searchQuery = `${address}, UK`
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&countrycodes=gb`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BookAMOT-SaaS/1.0' // Nominatim requires a User-Agent
      }
    })
    
    if (!response.ok) {
      console.error('Nominatim API error:', response.status, response.statusText)
      return null
    }
    
    const data = await response.json()
    
    if (data && data.length > 0) {
      const result = data[0]
      console.log(`🌍 Nominatim geocoding: ${address} → (${result.lat}, ${result.lon})`)
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon)
      }
    }
    
    return null
  } catch (error) {
    console.error('Nominatim geocoding error:', error)
    return null
  }
}

/**
 * Main geocoding function - tries multiple strategies
 * 1. Database lookup (fastest, most accurate for known postcodes)
 * 2. Nominatim API (fallback for unknown addresses)
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  if (!address || address.trim() === '') {
    return null
  }
  
  console.log(`🔍 Geocoding: "${address}"`)
  
  // Strategy 1: Try database lookup first (for postcodes)
  const dbResult = await geocodeFromDatabase(address)
  if (dbResult) {
    return dbResult
  }
  
  // Strategy 2: Try external geocoding API
  const apiResult = await geocodeFromNominatim(address)
  if (apiResult) {
    return apiResult
  }
  
  console.log(`❌ Could not geocode: "${address}"`)
  return null
}

/**
 * Batch geocode multiple addresses (with rate limiting for external API)
 */
export async function geocodeAddresses(addresses: string[]): Promise<Map<string, Coordinates>> {
  const results = new Map<string, Coordinates>()
  
  for (const address of addresses) {
    const coords = await geocodeAddress(address)
    if (coords) {
      results.set(address, coords)
    }
    
    // Rate limiting: wait 1 second between requests to respect Nominatim's rate limit
    if (addresses.indexOf(address) < addresses.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return results
}

