import type Stripe from 'stripe'
import { MOTB10_STRIPE } from './config'
import { logStripeAudit } from './audit-log'
import { prisma } from '@/lib/prisma'
import { AdminNotificationType } from '@prisma/client'

const LOG_ENDPOINT = 'http://127.0.0.1:7242/ingest/8de4aadb-cb33-4785-b101-b6442ed7baed'
const LOG_PATH = '/Users/h2/H2/Projects/bookamot-saas/.cursor/debug.log'
function agentLog(payload: Record<string, unknown>) {
  const obj = { ...payload, timestamp: Date.now(), sessionId: 'debug-session' }
  const line = JSON.stringify(obj) + '\n'
  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      require('fs').appendFileSync(LOG_PATH, line)
    } catch (_) {}
  }
  fetch(LOG_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) }).catch(() => {})
}

/**
 * Cria/atualiza PurchaseRequest e incrementa motQuota da garagem.
 * Idempotente: se já existir PurchaseRequest com este stripeSessionId, não faz nada.
 * Usado pelo webhook Stripe e pelo fallback da página de sucesso (quando o webhook não é chamado, ex. em dev).
 */
export async function fulfillStripePayment(session: Stripe.Checkout.Session): Promise<void> {
  const sessionId = session.id
  const garageId = session.metadata?.garageId
  const product = session.metadata?.product
  // #region agent log
  agentLog({ location: 'fulfill.ts:entry', message: 'fulfill entry', data: { sessionId, garageId, product }, hypothesisId: 'H3-H4' })
  // #endregion
  if (!garageId || session.metadata?.product !== 'MOTB10') {
    agentLog({ location: 'fulfill.ts', message: 'early exit metadata', data: { reason: 'missing_garageId_or_product' }, hypothesisId: 'H3' })
    return
  }

  let existing: Awaited<ReturnType<typeof prisma.purchaseRequest.findFirst>> = null
  try {
    // #region agent log
    agentLog({ location: 'fulfill.ts', message: 'before findFirst', data: {}, hypothesisId: 'H4' })
    // #endregion
    existing = await prisma.purchaseRequest.findFirst({
      where: { stripeSessionId: sessionId },
    })
    // #region agent log
    agentLog({ location: 'fulfill.ts', message: 'after findFirst', data: { existing: !!existing, existingId: existing?.id }, hypothesisId: 'H3-H4' })
    // #endregion
  } catch (findErr) {
    agentLog({ location: 'fulfill.ts', message: 'findFirst error', data: { error: String(findErr), message: findErr instanceof Error ? findErr.message : '' }, hypothesisId: 'H4' })
    throw findErr
  }
  if (existing) {
    agentLog({ location: 'fulfill.ts', message: 'already fulfilled', data: { purchaseRequestId: existing.id }, hypothesisId: 'H3' })
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

  try {
    // #region agent log
    agentLog({ location: 'fulfill.ts', message: 'before create', data: { bankReference }, hypothesisId: 'H4' })
    // #endregion
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
    // #region agent log
    agentLog({ location: 'fulfill.ts', message: 'after create', data: { purchaseRequestId: purchaseRequest.id }, hypothesisId: 'H4' })
    // #endregion
    await prisma.garage.update({
      where: { id: garageId },
      data: { motQuota: { increment: quantity }, isActive: true },
    })
    // #region agent log
    agentLog({ location: 'fulfill.ts', message: 'created and incremented', data: { purchaseRequestId: purchaseRequest.id, quantity }, hypothesisId: 'H4' })
    // #endregion
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
  } catch (err) {
    // #region agent log
    agentLog({ location: 'fulfill.ts', message: 'fulfill error', data: { error: String(err), name: err instanceof Error ? err.name : '', message: err instanceof Error ? err.message : '' }, hypothesisId: 'H4' })
    // #endregion
    throw err
  }
}
