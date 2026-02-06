import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import Stripe from 'stripe'
import { authOptions } from '@/lib/auth'
import { STRIPE_CONFIG } from '@/lib/stripe/config'
import { fulfillStripePayment } from '@/lib/stripe/fulfill'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/confirm-stripe-session?session_id=cs_xxx
 * Fallback quando o webhook Stripe não é chamado (ex.: em dev local).
 * O utilizador chega à página de sucesso com session_id; esta API confirma o pagamento
 * na Stripe e executa o fulfillment (cria PurchaseRequest, incrementa motQuota).
 * Idempotente: se o webhook já tiver corrido, não duplica.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'GARAGE_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!STRIPE_CONFIG.secretKey) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const sessionId = request.nextUrl.searchParams.get('session_id')
  if (!sessionId || !sessionId.startsWith('cs_')) {
    return NextResponse.json({ error: 'Invalid session_id' }, { status: 400 })
  }

  const garage = await prisma.garage.findFirst({
    where: { ownerId: session.user.id },
    select: { id: true },
  })
  if (!garage) {
    return NextResponse.json({ error: 'Garage not found' }, { status: 404 })
  }

  const stripe = new Stripe(STRIPE_CONFIG.secretKey)
  let checkoutSession: Stripe.Checkout.Session
  try {
    checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)
  } catch (err) {
    console.error('[confirm-stripe-session] Stripe retrieve error:', err)
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  if (checkoutSession.payment_status !== 'paid') {
    return NextResponse.json(
      { error: 'Payment not completed', payment_status: checkoutSession.payment_status },
      { status: 400 }
    )
  }

  const metadataGarageId = checkoutSession.metadata?.garageId
  if (metadataGarageId !== garage.id) {
    return NextResponse.json({ error: 'Session does not belong to this garage' }, { status: 403 })
  }

  await fulfillStripePayment(checkoutSession)
  return NextResponse.json({ fulfilled: true })
}
