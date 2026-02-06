import type Stripe from 'stripe'
import { MOTB10_STRIPE } from './config'
import { logStripeAudit } from './audit-log'
import { prisma } from '@/lib/prisma'
import { AdminNotificationType } from '@prisma/client'

/**
 * Cria/atualiza PurchaseRequest e incrementa motQuota da garagem.
 * Idempotente: se já existir PurchaseRequest com este stripeSessionId, não faz nada.
 * Usado pelo webhook Stripe e pelo fallback da página de sucesso (quando o webhook não é chamado, ex. em dev).
 */
export async function fulfillStripePayment(session: Stripe.Checkout.Session): Promise<void> {
  const sessionId = session.id
  const garageId = session.metadata?.garageId
  if (!garageId || session.metadata?.product !== 'MOTB10') {
    return
  }

  const existing = await prisma.purchaseRequest.findFirst({
    where: { stripeSessionId: sessionId },
  })
  if (existing) {
    logStripeAudit({
      type: 'webhook_fulfillment',
      sessionId,
      garageId,
      purchaseRequestId: existing.id,
    })
    return
  }

  const amountPence = MOTB10_STRIPE.amountPence
  const quantity = MOTB10_STRIPE.bookingsPerPackage
  const bankReference = `stripe-${sessionId}`

  const purchaseRequest = await prisma.purchaseRequest.create({
    data: {
      garageId,
      bankReference,
      amountPence,
      quantity,
      status: 'APPROVED',
      approvedAt: new Date(),
      stripeSessionId: sessionId,
    },
  })
  await prisma.garage.update({
    where: { id: garageId },
    data: { motQuota: { increment: quantity }, isActive: true },
  })
  await prisma.adminNotification.create({
    data: {
      type: AdminNotificationType.MOT_PURCHASE_REQUEST,
      referenceId: purchaseRequest.id,
      title: 'MOT Booking Purchase (Stripe)',
      message: `Stripe payment completed. Garage received ${quantity} MOT bookings. Reference: ${bankReference}.`,
    },
  })

  logStripeAudit({
    type: 'webhook_fulfillment',
    sessionId,
    garageId,
    purchaseRequestId: purchaseRequest.id,
  })
}
