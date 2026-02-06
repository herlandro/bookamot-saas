import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import Stripe from 'stripe'
import { authOptions } from '@/lib/auth'
import { STRIPE_CONFIG } from '@/lib/stripe/config'
import { fulfillStripePayment } from '@/lib/stripe/fulfill'
import { prisma } from '@/lib/prisma'

const LOG_ENDPOINT = 'http://127.0.0.1:7242/ingest/8de4aadb-cb33-4785-b101-b6442ed7baed'
function agentLog(payload: Record<string, unknown>) {
  fetch(LOG_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, timestamp: Date.now(), sessionId: 'debug-session' }) }).catch(() => {})
}

/**
 * GET /api/confirm-stripe-session?session_id=cs_xxx
 * Fallback quando o webhook Stripe não é chamado (ex.: em dev local).
 * O utilizador chega à página de sucesso com session_id; esta API confirma o pagamento
 * na Stripe e executa o fulfillment (cria PurchaseRequest, incrementa motQuota).
 * Idempotente: se o webhook já tiver corrido, não duplica.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  // #region agent log
  agentLog({ location: 'confirm-stripe-session:entry', message: 'API entry', data: { hasUser: Boolean(session?.user?.id), role: session?.user?.role }, hypothesisId: 'H2' })
  // #endregion
  if (!session?.user?.id || session.user.role !== 'GARAGE_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!STRIPE_CONFIG.secretKey) {
    agentLog({ location: 'confirm-stripe-session', message: 'early exit', data: { reason: 'stripe_not_configured' }, hypothesisId: 'H2' })
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const sessionId = request.nextUrl.searchParams.get('session_id')
  if (!sessionId || !sessionId.startsWith('cs_')) {
    agentLog({ location: 'confirm-stripe-session', message: 'early exit', data: { reason: 'invalid_session_id', sessionId: sessionId ?? null }, hypothesisId: 'H2' })
    return NextResponse.json({ error: 'Invalid session_id' }, { status: 400 })
  }

  const garage = await prisma.garage.findFirst({
    where: { ownerId: session.user.id },
    select: { id: true },
  })
  if (!garage) {
    agentLog({ location: 'confirm-stripe-session', message: 'early exit', data: { reason: 'garage_not_found' }, hypothesisId: 'H2' })
    return NextResponse.json({ error: 'Garage not found' }, { status: 404 })
  }

  const stripe = new Stripe(STRIPE_CONFIG.secretKey)
  let checkoutSession: Stripe.Checkout.Session
  try {
    checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)
  } catch (err) {
    console.error('[confirm-stripe-session] Stripe retrieve error:', err)
    agentLog({ location: 'confirm-stripe-session', message: 'Stripe retrieve failed', data: { error: String(err) }, hypothesisId: 'H2' })
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // #region agent log
  agentLog({ location: 'confirm-stripe-session', message: 'Stripe session', data: { payment_status: checkoutSession.payment_status, metadata_garageId: checkoutSession.metadata?.garageId, metadata_product: checkoutSession.metadata?.product, garageId: garage.id }, hypothesisId: 'H2-H3' })
  // #endregion
  if (checkoutSession.payment_status !== 'paid') {
    agentLog({ location: 'confirm-stripe-session', message: 'early exit', data: { reason: 'not_paid', payment_status: checkoutSession.payment_status }, hypothesisId: 'H2' })
    return NextResponse.json(
      { error: 'Payment not completed', payment_status: checkoutSession.payment_status },
      { status: 400 }
    )
  }

  const metadataGarageId = checkoutSession.metadata?.garageId
  if (metadataGarageId !== garage.id) {
    agentLog({ location: 'confirm-stripe-session', message: 'early exit', data: { reason: 'garage_mismatch', metadataGarageId, garageId: garage.id }, hypothesisId: 'H2' })
    return NextResponse.json({ error: 'Session does not belong to this garage' }, { status: 403 })
  }

  // #region agent log
  agentLog({ location: 'confirm-stripe-session', message: 'about to fulfill', data: { sessionId: checkoutSession.id }, hypothesisId: 'H4' })
  // #endregion
  await fulfillStripePayment(checkoutSession)
  // #region agent log
  agentLog({ location: 'confirm-stripe-session', message: 'fulfill done', data: { fulfilled: true }, hypothesisId: 'H4' })
  // #endregion
  return NextResponse.json({ fulfilled: true })
}
