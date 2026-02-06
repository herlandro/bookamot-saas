/**
 * Stripe configuration for MOTB10 payments.
 * Keys: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
 */
export const STRIPE_CONFIG = {
  secretKey: process.env.STRIPE_SECRET_KEY ?? '',
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
} as const

/** MOTB10 product: 1 package = 10 MOT bookings for £1 (always validated on the backend) */
export const MOTB10_STRIPE = {
  /** Package price: £10 = 1000 pence (GBP) */
  // amountPence: 1000,
  /** Package price: £0.30 = 30 pence (GBP) */ 
  amountPence: 30,
  /** Number of MOT bookings to credit per package (used in the webhook) */
  bookingsPerPackage: 10,
  productName: 'MOTB 10',
  productDescription: 'Package of 10 MOT bookings.',
  currency: 'gbp' as const,
} as const

export function isStripeConfigured(): boolean {
  return Boolean(STRIPE_CONFIG.secretKey && STRIPE_CONFIG.publishableKey)
}
