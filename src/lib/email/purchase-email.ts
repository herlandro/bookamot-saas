import { prisma } from '@/lib/prisma'
import { EmailType } from '@prisma/client'
import { sendSystemEmail } from './booking-email-service'
import { enGB } from '@/lib/i18n/en-GB'

const BACK_OFFICE_EMAIL = 'bookanmot@gmail.com'

function purchaseRequestSubject(garageName: string): string {
  return enGB['email.purchaseRequest.subject'].replace('{{name}}', garageName)
}

function purchaseRequestBody(garageName: string, bankReference: string): { html: string; text: string } {
  const html = `
    <p>A new MOT Booking purchase request has been submitted.</p>
    <p><strong>Garage:</strong> ${escapeHtml(garageName)}</p>
    <p><strong>Bank reference:</strong> ${escapeHtml(bankReference)}</p>
    <p>Please review in the Sales screen and approve or reject the request.</p>
  `
  const text = `New MOT Booking Purchase Request – Garage: ${garageName}. Bank reference: ${bankReference}. Please review in the Sales screen.`
  return { html, text }
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * Send purchase request notification to back office (bookanmot@gmail.com).
 * Uses at-least-once delivery with retry in sendSystemEmail.
 */
export async function queuePurchaseRequestEmail(
  garageName: string,
  _purchaseRequestId: string,
  bankReference: string
): Promise<void> {
  const subject = purchaseRequestSubject(garageName)
  const { html, text } = purchaseRequestBody(garageName, bankReference)
  await sendSystemEmail(
    BACK_OFFICE_EMAIL,
    EmailType.PURCHASE_REQUEST_NOTIFICATION,
    subject,
    html,
    text
  )
}

/**
 * Send garage validation required email to back office.
 */
export async function sendGarageValidationEmail(garageName: string): Promise<void> {
  const subject = enGB['email.garageValidation.subject'].replace('{{name}}', garageName)
  const html = `<p>Garage validation required for: <strong>${escapeHtml(garageName)}</strong>.</p>`
  const text = `Garage Validation Required – ${garageName}`
  await sendSystemEmail(
    BACK_OFFICE_EMAIL,
    EmailType.GARAGE_VALIDATION_REQUEST,
    subject,
    html,
    text
  )
}

/**
 * Send purchase approved email to garage owner.
 */
export async function sendPurchaseApprovedEmail(
  garageName: string,
  ownerEmail: string,
  ownerName?: string
): Promise<void> {
  const subject = enGB['email.purchaseApproved.subject'].replace('{{name}}', garageName)
  const html = `
    <p>Your MOT booking purchase request for <strong>${escapeHtml(garageName)}</strong> has been approved.</p>
    <p>10 MOT bookings have been added to your quota. You can now accept customer bookings.</p>
  `
  const text = `Your MOT booking purchase for ${garageName} has been approved. 10 MOT bookings have been added to your quota.`
  await sendSystemEmail(ownerEmail, EmailType.PURCHASE_APPROVED, subject, html, text)
}

/**
 * Send purchase rejected email to garage owner.
 */
export async function sendPurchaseRejectedEmail(
  garageName: string,
  ownerEmail: string,
  _ownerName?: string,
  reason?: string
): Promise<void> {
  const subject = enGB['email.purchaseRejected.subject'].replace('{{name}}', garageName)
  const reasonHtml = reason ? `<p><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : ''
  const html = `
    <p>Your MOT booking purchase request for <strong>${escapeHtml(garageName)}</strong> has been rejected.</p>
    ${reasonHtml}
    <p>If you have questions, please contact us.</p>
  `
  const text = `Your MOT booking purchase for ${garageName} has been rejected.${reason ? ` Reason: ${reason}` : ''}`
  await sendSystemEmail(ownerEmail, EmailType.PURCHASE_REJECTED, subject, html, text)
}
