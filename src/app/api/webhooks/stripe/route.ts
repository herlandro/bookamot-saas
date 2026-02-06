import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { STRIPE_CONFIG } from '@/lib/stripe/config'
import { logStripeAudit } from '@/lib/stripe/audit-log'
import { fulfillStripePayment } from '@/lib/stripe/fulfill'

// Next.js must not parse body for webhook signature verification
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const secret = STRIPE_CONFIG.webhookSecret
  const secretKey = STRIPE_CONFIG.secretKey
  if (!secret || !secretKey) {
    console.error('[webhooks/stripe] STRIPE_WEBHOOK_SECRET or STRIPE_SECRET_KEY is not set')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 501 })
  }

  let body: string
  try {
    body = await request.text()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const stripe = new Stripe(secretKey)
    event = stripe.webhooks.constructEvent(body, signature, secret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown'
    logStripeAudit({
      type: 'webhook_error',
      eventId: '',
      eventType: 'signature_verification',
      message,
    })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const session = event.data?.object as Stripe.Checkout.Session | undefined

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        if (session?.payment_status === 'paid') {
          logStripeAudit({
            type: 'checkout_session_completed',
            sessionId: session.id,
            garageId: session.metadata?.garageId ?? '',
            paymentStatus: session.payment_status,
          })
          await fulfillStripePayment(session)
        }
        break
      }
      case 'checkout.session.async_payment_succeeded': {
        if (session) {
          logStripeAudit({
            type: 'checkout_async_payment_succeeded',
            sessionId: session.id,
            garageId: session.metadata?.garageId ?? '',
          })
          await fulfillStripePayment(session)
        }
        break
      }
      case 'checkout.session.async_payment_failed': {
        if (session) {
          logStripeAudit({
            type: 'checkout_async_payment_failed',
            sessionId: session.id,
            garageId: session.metadata?.garageId ?? '',
          })
        }
        break
      }
      default:
        // ignore other events
        break
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown'
    console.error('[webhooks/stripe]', message)
    logStripeAudit({
      type: 'webhook_error',
      eventId: event.id,
      eventType: event.type,
      message,
    })
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
