import { NextRequest, NextResponse } from 'next/server'

/**
 * Vehicle Lookup API
 * GET /api/vehicles/lookup?registration={registration}
 *
 * Looks up vehicle details from registration number
 * This is a mock implementation - in production, integrate with DVLA API
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const registration = searchParams.get('registration')

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration number is required' },
        { status: 400 }
      )
    }

    // Mock vehicle data - In production, call DVLA API
    // Example: https://developer-portal.driver-vehicle-licensing.api.gov.uk/apis/vehicle-enquiry-service/vehicle-enquiry-service-description.html

    const mockVehicleData: Record<string, any> = {
      'AB12CDE': {
        make: 'Ford',
        model: 'Focus',
        year: 2020,
        fuelType: 'PETROL',
        color: 'Blue',
        engineSize: '1.6'
      },
      'WJ11USE': {
        make: 'Volkswagen',
        model: 'Golf',
        year: 2011,
        fuelType: 'DIESEL',
        color: 'Silver',
        engineSize: '2.0'
      },
      'XY99ZZZ': {
        make: 'Toyota',
        model: 'Corolla',
        year: 2019,
        fuelType: 'HYBRID',
        color: 'White',
        engineSize: '1.8'
      }
    }

    const normalizedReg = registration.toUpperCase().replace(/\s/g, '')
    const vehicleData = mockVehicleData[normalizedReg]

    if (vehicleData) {
      return NextResponse.json(vehicleData, { status: 200 })
    } else {
      // Vehicle not found in mock data - return 404
      // In production, this would mean the DVLA API didn't find the vehicle
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Error in vehicle lookup:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
