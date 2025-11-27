import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { geocodeAddress } from '@/lib/geocoding'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role, garageName, address, phone } = body

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { error: 'Invalid user role' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    })

    // If user is a garage owner, create garage record
    if (role === UserRole.GARAGE_OWNER) {
      if (!garageName || !address || !phone) {
        // Delete the user if garage creation fails
        await prisma.user.delete({ where: { id: user.id } })
        return NextResponse.json(
          { error: 'Garage name, address, and phone are required for garage accounts' },
          { status: 400 }
        )
      }

      // Try to geocode the address to get coordinates
      console.log(`🏢 Geocoding garage address: ${address}`)
      const coords = await geocodeAddress(address)

      // Extract city and postcode from address (simple extraction)
      // Format expected: "123 Street Name, City, Postcode" or similar
      const addressParts = address.split(',').map((part: string) => part.trim())
      let city = 'Unknown'
      let postcode = 'N/A'

      // Try to extract postcode (UK postcode pattern)
      const postcodeRegex = /\b[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}\b/i
      const postcodeMatch = address.match(postcodeRegex)
      if (postcodeMatch) {
        postcode = postcodeMatch[0].toUpperCase()
      }

      // Try to extract city (usually second-to-last or last part before postcode)
      if (addressParts.length >= 2) {
        // If we found a postcode, city is likely the part before it
        const cityPart = addressParts[addressParts.length - (postcodeMatch ? 2 : 1)]
        if (cityPart && !postcodeRegex.test(cityPart)) {
          city = cityPart
        }
      }

      console.log(`📍 Extracted: city="${city}", postcode="${postcode}", coords=${coords ? `(${coords.lat}, ${coords.lng})` : 'null'}`)

      await prisma.garage.create({
        data: {
          name: garageName,
          address,
          city,
          postcode,
          latitude: coords?.lat,
          longitude: coords?.lng,
          phone,
          email,
          ownerId: user.id,
          motLicenseNumber: `MOT-${Date.now()}`, // Generate temporary license number
          dvlaApproved: false, // Garages need approval
        }
      })
    }

    return NextResponse.json(
      {
        message: 'User created successfully',
        user,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}