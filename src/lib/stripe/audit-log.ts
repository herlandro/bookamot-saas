/**
 * Logs de auditoria para transações Stripe (sem dados sensíveis).
 */
type AuditEvent = 
  | { type: 'checkout_session_created'; sessionId: string; garageId: string; userId: string }
  | { type: 'checkout_session_completed'; sessionId: string; garageId: string; paymentStatus: string }
  | { type: 'checkout_async_payment_succeeded'; sessionId: string; garageId: string }
  | { type: 'checkout_async_payment_failed'; sessionId: string; garageId: string }
  | { type: 'webhook_fulfillment'; sessionId: string; garageId: string; purchaseRequestId: string }
  | { type: 'webhook_error'; eventId: string; eventType: string; message: string }

export function logStripeAudit(event: AuditEvent): void {
  const timestamp = new Date().toISOString()
  const payload = { timestamp, ...event }
  console.info('[Stripe Audit]', JSON.stringify(payload))
}
