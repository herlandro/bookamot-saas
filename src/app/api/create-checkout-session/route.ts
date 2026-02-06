import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createCheckoutSession } from '@/lib/stripe/checkout'
import { isStripeConfigured } from '@/lib/stripe/config'
import { logStripeAudit } from '@/lib/stripe/audit-log'
import { checkoutRateLimit } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'

const DEFAULT_BASE_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

/**
 * POST /api/create-checkout-session
 * Cria sessão Stripe Checkout para MOTB10. Preço/quantidade vêm apenas do servidor.
 */
export async function POST(request: NextRequest) {
  const rateLimitResult = checkoutRateLimit(request)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'GARAGE_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Payment system is not configured' },
      { status: 503 }
    )
  }

  const garage = await prisma.garage.findFirst({
    where: { ownerId: session.user.id },
    select: { id: true },
  })
  if (!garage) {
    return NextResponse.json({ error: 'Garage not found' }, { status: 404 })
  }

  const host = request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https')
  const baseUrl = host ? `${protocol}://${host}` : DEFAULT_BASE_URL

  const body = await request.json().catch(() => ({}))
  const successPath = typeof body.successPath === 'string' && body.successPath.startsWith('/') ? body.successPath : '/sucesso'
  const cancelPath = typeof body.cancelPath === 'string' && body.cancelPath.startsWith('/') ? body.cancelPath : '/cancelado'

  const successUrl = `${baseUrl}${successPath}?session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${baseUrl}${cancelPath}`

  const result = await createCheckoutSession({
    garageId: garage.id,
    userId: session.user.id,
    userEmail: session.user.email ?? '',
    successUrl,
    cancelUrl,
  })

  if ('error' in result) {
    console.error('[create-checkout-session]', result.error)
    return NextResponse.json(
      { error: result.error === 'Stripe is not configured' ? 'Payment system unavailable' : result.error },
      { status: 400 }
    )
  }

  logStripeAudit({
    type: 'checkout_session_created',
    sessionId: result.sessionId,
    garageId: garage.id,
    userId: session.user.id,
  })

  return NextResponse.json({ url: result.url, sessionId: result.sessionId })
}
