import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/garage-admin/bank-details
 * Returns display-only UK bank details for MOT purchase payments (garage owners only).
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'GARAGE_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sortCode = process.env.BANK_SORT_CODE ?? '00-00-00'
  const accountNumber = process.env.BANK_ACCOUNT_NUMBER ?? '00000000'

  return NextResponse.json({
    sortCode,
    accountNumber,
    referenceFormat: 'Garage ID + timestamp (e.g. ABC123-1738675200000)',
  })
}
