import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userId, code } = await request.json()

    if (!userId || !code) {
      return NextResponse.json(
        { error: 'User ID and verification code are required' },
        { status: 400 }
      )
    }

    // Find user
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

    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      )
    }

    // Check if code exists
    if (!user.emailVerificationCode || !user.emailVerificationExpiry) {
      return NextResponse.json(
        { error: 'No verification code found. Please request a new code.' },
        { status: 400 }
      )
    }

    // Check if code expired
    if (new Date() > user.emailVerificationExpiry) {
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new code.' },
        { status: 400 }
      )
    }

    // Check if code matches (case insensitive)
    if (user.emailVerificationCode.toUpperCase() !== code.toUpperCase()) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Mark email as verified and clear verification fields
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: new Date(),
        emailVerificationCode: null,
        emailVerificationExpiry: null,
      }
    })

    console.log(`✅ Email verified for user ${user.email}`)

    return NextResponse.json({
      message: 'Email verified successfully',
      garageName: user.garage?.name,
      approvalStatus: user.garage?.approvalStatus || 'PENDING'
    })
  } catch (error) {
    console.error('Error verifying email:', error)
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    )
  }
}

