import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { forgotPasswordRateLimit } from '@/lib/rate-limit'

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function POST(req: NextRequest) {
  try {
    // Check rate limiting
    const rateLimitResult = forgotPasswordRateLimit(req)
    if (!rateLimitResult.success) {
      const resetTime = new Date(rateLimitResult.resetTime!)
      return NextResponse.json(
        { 
          error: 'Too many attempts. Please try again in 1 hour.',
          resetTime: resetTime.toISOString()
        },
        { status: 429 }
      )
    }

    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    // Using select to avoid issues if emailVerificationCode columns don't exist yet
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
      }
    })

    // For security, always return success even if user doesn't exist
    // This prevents attackers from discovering which emails are registered
    if (!user) {
      return NextResponse.json(
        { message: 'If the email is registered, you will receive a reset link' },
        { status: 200 }
      )
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      } as any,
    })

    // Reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`

    // Email template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reset Password - BookaMOT</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { color: #2563eb; font-size: 24px; font-weight: bold; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 8px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { margin-top: 30px; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🛡️ BookaMOT</div>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>Hello,</p>
              <p>We received a request to reset the password for your BookaMOT account.</p>
              <p>Click the button below to create a new password:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p><strong>This link expires in 1 hour.</strong></p>
              <p>If you did not request this reset, you can safely ignore this email.</p>
              <p>For security, never share this link with others.</p>
            </div>
            <div class="footer">
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all;">${resetUrl}</p>
              <p>© 2024 BookaMOT. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Send email
    await transporter.sendMail({
      from: `"BookaMOT" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: 'Reset your password - BookaMOT',
      html: emailHtml,
    })

    return NextResponse.json(
      { message: 'Password reset email sent successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error processing reset request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
