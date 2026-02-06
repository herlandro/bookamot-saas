/**
 * Configuração Stripe para pagamentos MOTB10.
 * Chaves: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
 */
export const STRIPE_CONFIG = {
  secretKey: process.env.STRIPE_SECRET_KEY ?? '',
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
} as const

/** Produto MOTB10: 1 pacote = 10 reservas de MOT por £10 (sempre validado no backend) */
export const MOTB10_STRIPE = {
  /** Preço do pacote: £10 = 1000 pence (GBP) */
  amountPence: 1000,
  /** Número de reservas MOT a creditar por pacote (usado no webhook) */
  bookingsPerPackage: 10,
  productName: 'MOTB 10',
  productDescription: 'Package of 10 MOT bookings.',
  currency: 'gbp' as const,
} as const

export function isStripeConfigured(): boolean {
  return Boolean(STRIPE_CONFIG.secretKey && STRIPE_CONFIG.publishableKey)
}
