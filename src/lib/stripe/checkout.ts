import Stripe from 'stripe'
import { STRIPE_CONFIG, MOTB10_STRIPE } from './config'

if (!STRIPE_CONFIG.secretKey && process.env.NODE_ENV === 'production') {
  console.warn('[Stripe] STRIPE_SECRET_KEY is not set')
}

const stripe = STRIPE_CONFIG.secretKey
  ? new Stripe(STRIPE_CONFIG.secretKey)
  : null

export type CreateCheckoutSessionParams = {
  garageId: string
  userId: string
  userEmail: string
  successUrl: string
  cancelUrl: string
}

/**
 * Cria uma sessão de Checkout Stripe para o produto MOTB10.
 * Preço e quantidade vêm apenas do servidor (anti-manipulação).
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<{ url: string; sessionId: string } | { error: string }> {
  if (!stripe) {
    return { error: 'Stripe is not configured' }
  }

  const { garageId, userId, userEmail, successUrl, cancelUrl } = params

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'pay_by_bank'],
      line_items: [
        {
          price_data: {
            currency: MOTB10_STRIPE.currency,
            product_data: {
              name: MOTB10_STRIPE.productName,
              description: MOTB10_STRIPE.productDescription,
              metadata: { product: 'MOTB10' },
            },
            unit_amount: MOTB10_STRIPE.amountPence,
          },
          quantity: 1,
        },
      ],
      metadata: {
        garageId,
        userId,
        product: 'MOTB10',
      },
      customer_email: userEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    if (!session.url) {
      return { error: 'Failed to create checkout URL' }
    }

    return { url: session.url, sessionId: session.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Stripe] createCheckoutSession error:', message)
    return { error: message }
  }
}

export { stripe }
