import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { geocodeAddress } from '@/lib/geocoding'
import { generateVerificationCode, sendGarageVerificationEmail } from '@/lib/email'

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
    // Using select to avoid issues if emailVerificationCode columns don't exist yet
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
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

      console.log('📝 Creating garage with data:', { garageName, address, city, postcode, phone, email, ownerId: user.id })
      
      const garage = await prisma.garage.create({
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
          dvlaApproved: false, // Requires admin approval
          isActive: false, // Inactive until approved
          // approvalStatus defaults to PENDING in schema
        }
      })
      
      console.log('✅ Garage created:', garage.id)

      // Create default schedules for the garage (Monday-Friday 09:00-17:30, Saturday 09:00-13:00, Sunday closed)
      const defaultSchedules = [
        { dayOfWeek: 1, isOpen: true, openTime: '09:00', closeTime: '17:30', slotDuration: 60 }, // Monday
        { dayOfWeek: 2, isOpen: true, openTime: '09:00', closeTime: '17:30', slotDuration: 60 }, // Tuesday
        { dayOfWeek: 3, isOpen: true, openTime: '09:00', closeTime: '17:30', slotDuration: 60 }, // Wednesday
        { dayOfWeek: 4, isOpen: true, openTime: '09:00', closeTime: '17:30', slotDuration: 60 }, // Thursday
        { dayOfWeek: 5, isOpen: true, openTime: '09:00', closeTime: '17:30', slotDuration: 60 }, // Friday
        { dayOfWeek: 6, isOpen: true, openTime: '09:00', closeTime: '13:00', slotDuration: 60 }, // Saturday
        { dayOfWeek: 0, isOpen: false, openTime: '09:00', closeTime: '17:00', slotDuration: 60 }, // Sunday (closed)
      ]

      await prisma.garageSchedule.createMany({
        data: defaultSchedules.map(schedule => ({
          garageId: garage.id,
          ...schedule
        }))
      })

      // Generate verification code and send email
      const verificationCode = generateVerificationCode()
      const verificationExpiry = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationCode: verificationCode,
          emailVerificationExpiry: verificationExpiry,
        }
      })

      // Send verification email
      try {
        await sendGarageVerificationEmail(email, garageName, verificationCode)
        console.log(`📧 Verification email sent to ${email}`)
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError)
        // Continue anyway - user can request resend
      }

      console.log(`✅ Created garage "${garageName}" with default schedules (pending approval)`)

      return NextResponse.json(
        {
          message: 'Garage account created successfully. Please verify your email.',
          user,
          requiresEmailVerification: true,
          garageName: garage.name,
        },
        { status: 201 }
      )
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
    
    // Provide more specific error message for debugging
    let errorMessage = 'Internal server error'
    if (error instanceof Error) {
      console.error('Error details:', error.message)
      console.error('Error stack:', error.stack)
      
      // Check for specific Prisma errors
      if (error.message.includes('Unique constraint')) {
        errorMessage = 'This email or garage is already registered'
      } else if (error.message.includes('Foreign key constraint')) {
        errorMessage = 'Database relationship error'
      } else if (error.message.includes('Invalid')) {
        errorMessage = error.message
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}