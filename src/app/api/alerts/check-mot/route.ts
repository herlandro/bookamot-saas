import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkAllVehiclesAndAlert } from '@/lib/services/alert-service'

/**
 * POST /api/alerts/check-mot
 * Manually trigger MOT expiry check and send alerts
 * 
 * This endpoint can be:
 * 1. Called manually by admin
 * 2. Called by a cron job (e.g., daily at 8 AM)
 * 3. Called by a scheduled task
 */
export async function POST(req: NextRequest) {
  try {
    // Optional: Verify admin access
    const session = await getServerSession(authOptions)
    
    // For now, allow any authenticated user to trigger
    // TODO: Add admin role check if needed
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`\n🚀 MOT Alert Check triggered by user ${session.user.id}`)

    // Run the check
    const result = await checkAllVehiclesAndAlert()

    return NextResponse.json({
      success: true,
      message: 'MOT expiry check completed',
      result
    })
  } catch (error) {
    console.error('❌ Error in MOT alert check:', error)
    return NextResponse.json(
      { error: 'Failed to check MOT expiry' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/alerts/check-mot
 * Get status of last MOT check
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Store and retrieve last check status from database
    return NextResponse.json({
      success: true,
      message: 'MOT alert check endpoint is active',
      lastCheck: null,
      nextScheduledCheck: null
    })
  } catch (error) {
    console.error('❌ Error getting alert status:', error)
    return NextResponse.json(
      { error: 'Failed to get alert status' },
      { status: 500 }
    )
  }
}

