import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const config = {
    SMTP_HOST: process.env.SMTP_HOST ? 'SET' : 'NOT SET',
    SMTP_PORT: process.env.SMTP_PORT || 'NOT SET',
    SMTP_SECURE: process.env.SMTP_SECURE || 'NOT SET',
    SMTP_USER: process.env.SMTP_USER ? 'SET' : 'NOT SET',
    SMTP_PASS: process.env.SMTP_PASS ? 'SET (hidden)' : 'NOT SET',
    SMTP_FROM: process.env.SMTP_FROM || 'NOT SET',
  }

  return NextResponse.json({
    message: 'SMTP Configuration Check',
    config,
    allConfigured: Object.values(config).every(v => v !== 'NOT SET'),
  })
}

