import { NextRequest, NextResponse } from 'next/server'
import { processScheduledReminders } from '@/lib/email/email-queue'

// This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions, etc.)
// For security, you should verify the request comes from your cron service
export async function GET(request: NextRequest) {
  try {
    // Optional: Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await processScheduledReminders()

    return NextResponse.json({
      success: true,
      message: 'Scheduled reminders processed',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error processing scheduled reminders:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Also support POST for cron services that use POST
export async function POST(request: NextRequest) {
  return GET(request)
}

