import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateVerificationCode, sendGarageVerificationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Find user with garage
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { garage: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.garage) {
      return NextResponse.json(
        { error: 'User does not have a garage' },
        { status: 400 }
      )
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      )
    }

    // Generate verification code
    const verificationCode = generateVerificationCode()
    const verificationExpiry = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    // Save code to user
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationCode: verificationCode,
        emailVerificationExpiry: verificationExpiry,
      }
    })

    // Send verification email
    await sendGarageVerificationEmail(
      user.email,
      user.garage.name,
      verificationCode
    )

    console.log(`📧 Verification code sent to ${user.email}`)

    return NextResponse.json({
      message: 'Verification code sent successfully',
      expiresAt: verificationExpiry.toISOString()
    })
  } catch (error) {
    console.error('Error sending verification email:', error)
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    )
  }
}

