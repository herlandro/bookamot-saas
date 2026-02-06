/**
 * British English (en-GB) – default locale for user-facing copy.
 * Use for labels, headings, toasts, emails, and alt text.
 */
export const enGB = {
  // MOT Bookings dashboard
  'mot.bookings': 'MOT Bookings',
  'mot.bookings.count': '{consumed}/{quota}',
  'mot.purchase': 'Purchase',

  // Shopping screen
  'shopping.title': 'Shopping',
  'shopping.product.motb10': 'MOTB 10',
  'shopping.product.price': '£10',
  'shopping.product.quantity': '10 bookings',
  'shopping.product.description': 'Package of 10 MOT Bookings.',
  'shopping.buyNow': 'Buy Now',
  'shopping.comprar': 'Purchase',
  'shopping.paymentRedirect': 'Redirecting to secure payment…',
  'shopping.paymentError': 'Unable to start payment. Please try again.',
  'shopping.paymentNote': 'Secure payment by card or bank transfer (Stripe).',
  'shopping.subtitle': 'Purchase MOT booking quota for your garage.',
  'shopping.previousPurchasesDescription': 'History of your MOT booking purchases',
  'shopping.noPurchasesYet': 'No purchases yet.',
  'success.title': 'Payment complete',
  'success.message': 'Thank you. Your package of 10 MOT bookings has been credited.',
  'success.back': 'Back to shopping',
  'cancel.title': 'Payment cancelled',
  'cancel.message': 'Payment was cancelled. You can purchase whenever you like.',
  'cancel.back': 'Back to shopping',
  'shopping.purchaseIntent.title': 'Purchase intent',
  'shopping.bank.sortCode': 'Sort code',
  'shopping.bank.accountNumber': 'Account number',
  'shopping.bank.reference': 'Reference',
  'shopping.submit': 'Submit',
  'shopping.cancel': 'Cancel',
  'shopping.previousPurchases': 'Previous purchases',
  'shopping.table.dateRequested': 'Date requested',
  'shopping.table.dateApprovedRejected': 'Date approved/rejected',
  'shopping.table.bankReference': 'Bank reference',
  'shopping.table.quotaAdded': 'MOT bookings',
  'shopping.table.pending': 'Pending',

  // Sales (system admin)
  'sales.title': 'Sales',
  'sales.garageName': 'Garage name',
  'sales.garageOwner': 'Garage owner',
  'sales.requestedOn': 'Requested on',
  'sales.bankReference': 'Bank reference',
  'sales.amount': 'Amount',
  'sales.status': 'Status',
  'sales.status.pending': 'Pending',
  'sales.status.approved': 'Approved',
  'sales.status.rejected': 'Rejected',
  'sales.approve': 'Approve',
  'sales.reject': 'Reject',
  'sales.rejectionReason': 'Rejection reason (optional)',

  // Status / common
  'status.pending': 'Pending',
  'status.approved': 'Approved',
  'status.rejected': 'Rejected',
  'status.cancelled': 'Cancelled',
  'status.authorised': 'Authorised',

  // Toasts
  'toast.motQuotaWarning': 'MOT booking quota is over 80% used. Please purchase more to avoid interruption.',
  'toast.purchaseRequestSubmitted': 'Purchase request submitted. You will be notified once approved.',
  'toast.purchaseApproved': 'Purchase approved. Quota has been added.',
  'toast.purchaseRejected': 'Purchase request was rejected.',
  'toast.motQuotaExhausted': 'MOT quota exhausted. No further bookings can be confirmed until new quota is purchased.',

  // Emails (subjects / body)
  'email.purchaseRequest.subject': 'New MOT Booking Purchase Request – Garage {{name}}',
  'email.garageValidation.subject': 'Garage Validation Required – {{name}}',
  'email.purchaseApproved.subject': 'MOT Booking Purchase Approved – {{name}}',
  'email.purchaseRejected.subject': 'MOT Booking Purchase Request Rejected – {{name}}',
} as const

export type EnGBKeys = keyof typeof enGB
