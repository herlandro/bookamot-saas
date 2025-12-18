import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateVerificationCode, sendGarageVerificationEmail } from '@/lib/email'

// Track last resend time per user (in-memory for simplicity)
const resendCooldowns = new Map<string, number>()

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check cooldown (60 seconds)
    const lastResend = resendCooldowns.get(userId)
    if (lastResend) {
      const timeSinceLastResend = Date.now() - lastResend
      const cooldownMs = 60 * 1000 // 60 seconds
      
      if (timeSinceLastResend < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastResend) / 1000)
        return NextResponse.json(
          { 
            error: `Please wait ${remainingSeconds} seconds before requesting a new code`,
            remainingSeconds 
          },
          { status: 429 }
        )
      }
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

    // Generate new verification code
    const verificationCode = generateVerificationCode()
    const verificationExpiry = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    // Save new code to user
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

    // Update cooldown
    resendCooldowns.set(userId, Date.now())

    console.log(`📧 Verification code resent to ${user.email}`)

    return NextResponse.json({
      message: 'Verification code resent successfully',
      expiresAt: verificationExpiry.toISOString()
    })
  } catch (error) {
    console.error('Error resending verification email:', error)
    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    )
  }
}

