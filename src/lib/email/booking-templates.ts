import { Booking, User, Garage, Vehicle } from '@prisma/client'

type BookingWithRelations = Booking & {
  customer: Pick<User, 'id' | 'name' | 'email' | 'phone'>
  garage: Pick<Garage, 'id' | 'name' | 'address' | 'city' | 'postcode' | 'phone' | 'email'>
  vehicle: Pick<Vehicle, 'id' | 'registration' | 'make' | 'model' | 'year'>
}

interface EmailTemplate {
  html: string
  text: string
  subject: string
}

// Base email template wrapper
function getEmailTemplate(content: string, title: string, unsubscribeLink?: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en-GB">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>${title} - BookaMOT</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #333333; 
            background-color: #f4f4f4; 
            margin: 0; 
            padding: 0; 
          }
          .email-wrapper { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
          }
          .email-header { 
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); 
            padding: 30px 20px; 
            text-align: center; 
          }
          .logo { 
            color: #ffffff; 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 10px; 
          }
          .email-body { 
            padding: 40px 30px; 
          }
          .email-footer { 
            background-color: #f8f9fa; 
            padding: 30px 20px; 
            text-align: center; 
            font-size: 12px; 
            color: #666666; 
            border-top: 1px solid #e9ecef; 
          }
          .button { 
            display: inline-block; 
            background-color: #2563eb; 
            color: #ffffff !important; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0; 
            font-weight: 600; 
            text-align: center; 
          }
          .button:hover { 
            background-color: #1e40af; 
          }
          .info-box { 
            background-color: #fef3cd; 
            border-left: 4px solid #ffc107; 
            padding: 15px; 
            margin: 20px 0; 
            border-radius: 4px; 
          }
          .success-box { 
            background-color: #d4edda; 
            border-left: 4px solid #28a745; 
            padding: 15px; 
            margin: 20px 0; 
            border-radius: 4px; 
          }
          .error-box { 
            background-color: #f8d7da; 
            border-left: 4px solid #dc3545; 
            padding: 15px; 
            margin: 20px 0; 
            border-radius: 4px; 
          }
          .booking-details { 
            background-color: #f8f9fa; 
            border-radius: 8px; 
            padding: 20px; 
            margin: 20px 0; 
          }
          .detail-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 10px 0; 
            border-bottom: 1px solid #e9ecef; 
          }
          .detail-row:last-child { 
            border-bottom: none; 
          }
          .detail-label { 
            font-weight: 600; 
            color: #495057; 
          }
          .detail-value { 
            color: #212529; 
          }
          h1 { 
            color: #1a1a1a; 
            margin-bottom: 20px; 
            font-size: 24px; 
          }
          h2 { 
            color: #1a1a1a; 
            margin-bottom: 15px; 
            font-size: 20px; 
          }
          p { 
            margin-bottom: 15px; 
            color: #495057; 
          }
          ul { 
            margin: 15px 0; 
            padding-left: 25px; 
          }
          li { 
            margin-bottom: 8px; 
            color: #495057; 
          }
          .unsubscribe { 
            margin-top: 20px; 
            font-size: 11px; 
            color: #999999; 
          }
          .unsubscribe a { 
            color: #999999; 
            text-decoration: underline; 
          }
          @media only screen and (max-width: 600px) {
            .email-body { 
              padding: 30px 20px; 
            }
            .detail-row { 
              flex-direction: column; 
            }
            .detail-label { 
              margin-bottom: 5px; 
            }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-header">
            <div class="logo">🛡️ BookaMOT</div>
          </div>
          <div class="email-body">
            ${content}
          </div>
          <div class="email-footer">
            <p>This is an automated email, please do not reply.</p>
            <p>© ${new Date().getFullYear()} BookaMOT. All rights reserved.</p>
            <p>Need help? Contact us: <a href="mailto:support@bookamot.co.uk" style="color: #2563eb;">support@bookamot.co.uk</a></p>
            ${unsubscribeLink ? `<p class="unsubscribe"><a href="${unsubscribeLink}">Unsubscribe</a></p>` : ''}
          </div>
        </div>
      </body>
    </html>
  `
}

// Helper to format date
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Helper to format time
function formatTime(timeSlot: string): string {
  return timeSlot
}

// Helper to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(amount)
}

// Helper to create booking details section
function createBookingDetailsSection(booking: BookingWithRelations): string {
  return `
    <div class="booking-details">
      <h2 style="margin-top: 0;">Booking Details</h2>
      <div class="detail-row">
        <span class="detail-label">Reference:</span>
        <span class="detail-value"><strong>${booking.bookingRef}</strong></span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date:</span>
        <span class="detail-value">${formatDate(booking.date)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Time:</span>
        <span class="detail-value">${formatTime(booking.timeSlot)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Vehicle:</span>
        <span class="detail-value">${booking.vehicle.registration} - ${booking.vehicle.make} ${booking.vehicle.model} (${booking.vehicle.year})</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Garage:</span>
        <span class="detail-value">${booking.garage.name}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Address:</span>
        <span class="detail-value">${booking.garage.address}, ${booking.garage.city} ${booking.garage.postcode}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Price:</span>
        <span class="detail-value"><strong>${formatCurrency(booking.totalPrice)}</strong></span>
      </div>
      ${booking.notes ? `
      <div class="detail-row">
        <span class="detail-label">Notes:</span>
        <span class="detail-value">${booking.notes}</span>
      </div>
      ` : ''}
    </div>
  `
}

// 1. Booking confirmation for customer
export function getBookingConfirmationCustomerTemplate(
  booking: BookingWithRelations
): EmailTemplate {
  const bookingUrl = `${process.env.NEXTAUTH_URL}/booking/${booking.id}`
  const unsubscribeLink = `${process.env.NEXTAUTH_URL}/unsubscribe?email=${encodeURIComponent(booking.customer.email)}`

  const content = `
    <h1>Booking Pending Approval</h1>
    <p>Hello ${booking.customer.name || 'Customer'},</p>
    <p>We have successfully received your booking request. Your booking is <strong>pending approval</strong> from the garage.</p>
    
    ${createBookingDetailsSection(booking)}
    
    <div class="info-box">
      <strong>⏳ Status: Pending Approval</strong>
      <p style="margin: 10px 0 0 0;">You will be notified by email once the garage approves or rejects your booking.</p>
    </div>
    
    <p>You can check the status of your booking at any time:</p>
    <p style="text-align: center;">
      <a href="${bookingUrl}" class="button">View Booking Details</a>
    </p>
    
    <p>If you have any questions or need to make changes, please contact us or the garage directly.</p>
  `

  const text = `
Booking Pending Approval - BookaMOT

Hello ${booking.customer.name || 'Customer'},

We have successfully received your booking request. Your booking is pending approval from the garage.

Booking Details:
- Reference: ${booking.bookingRef}
- Date: ${formatDate(booking.date)}
- Time: ${formatTime(booking.timeSlot)}
- Vehicle: ${booking.vehicle.registration} - ${booking.vehicle.make} ${booking.vehicle.model} (${booking.vehicle.year})
- Garage: ${booking.garage.name}
- Address: ${booking.garage.address}, ${booking.garage.city} ${booking.garage.postcode}
- Price: ${formatCurrency(booking.totalPrice)}
${booking.notes ? `- Notes: ${booking.notes}` : ''}

Status: Pending Approval
You will be notified by email once the garage approves or rejects your booking.

View details: ${bookingUrl}

If you have any questions, please contact us: support@bookamot.co.uk
  `

  return {
    html: getEmailTemplate(content, 'Booking Pending Approval', unsubscribeLink),
    text,
    subject: `Booking Pending Approval - ${booking.bookingRef}`
  }
}

// 2. Notification for garage
export function getBookingNotificationGarageTemplate(
  booking: BookingWithRelations
): EmailTemplate {
  const approvalUrl = `${process.env.NEXTAUTH_URL}/garage-admin/bookings/${booking.id}`
  const garageAdminUrl = `${process.env.NEXTAUTH_URL}/garage-admin/bookings`

  const content = `
    <h1>New Booking Received</h1>
    <p>Hello,</p>
    <p>You have received a new booking request for <strong>${booking.garage.name}</strong>.</p>
    
    ${createBookingDetailsSection(booking)}
    
    <div class="info-box">
      <strong>👤 Customer Information:</strong>
      <p style="margin: 10px 0 0 0;">
        <strong>Name:</strong> ${booking.customer.name || 'Not provided'}<br>
        <strong>Email:</strong> ${booking.customer.email}<br>
        ${booking.customer.phone ? `<strong>Phone:</strong> ${booking.customer.phone}<br>` : ''}
      </p>
    </div>
    
    <p style="text-align: center; margin-top: 30px;">
      <a href="${approvalUrl}" class="button">Approve or Reject Booking</a>
    </p>
    
    <p style="text-align: center;">
      <a href="${garageAdminUrl}" style="color: #2563eb; text-decoration: underline;">View All Bookings</a>
    </p>
    
    <div class="info-box">
      <strong>⏰ Response Deadline:</strong>
      <p style="margin: 10px 0 0 0;">Please respond to the booking as soon as possible. We recommend responding within 24 hours.</p>
    </div>
  `

  const text = `
New Booking Received - BookaMOT

Hello,

You have received a new booking request for ${booking.garage.name}.

Booking Details:
- Reference: ${booking.bookingRef}
- Date: ${formatDate(booking.date)}
- Time: ${formatTime(booking.timeSlot)}
- Vehicle: ${booking.vehicle.registration} - ${booking.vehicle.make} ${booking.vehicle.model} (${booking.vehicle.year})
- Price: ${formatCurrency(booking.totalPrice)}
${booking.notes ? `- Notes: ${booking.notes}` : ''}

Customer Information:
- Name: ${booking.customer.name || 'Not provided'}
- Email: ${booking.customer.email}
${booking.customer.phone ? `- Phone: ${booking.customer.phone}` : ''}

Approve or Reject: ${approvalUrl}
View All Bookings: ${garageAdminUrl}

Response Deadline: Please respond to the booking as soon as possible. We recommend responding within 24 hours.
  `

  return {
    html: getEmailTemplate(content, 'New Booking Received'),
    text,
    subject: `New Booking Received - ${booking.bookingRef}`
  }
}

// 3. Booking aprovado
export function getBookingApprovedTemplate(
  booking: BookingWithRelations
): EmailTemplate {
  const bookingUrl = `${process.env.NEXTAUTH_URL}/booking/${booking.id}`
  const unsubscribeLink = `${process.env.NEXTAUTH_URL}/unsubscribe?email=${encodeURIComponent(booking.customer.email)}`

  const content = `
    <h1>🎉 Your Booking Has Been Approved!</h1>
    <p>Hello ${booking.customer.name || 'Customer'},</p>
    <p>Great news! Your booking has been <strong>approved</strong> by the garage.</p>
    
    ${createBookingDetailsSection(booking)}
    
    <div class="success-box">
      <strong>✅ Status: Approved</strong>
      <p style="margin: 10px 0 0 0;">Your reservation is confirmed. Please attend on the scheduled date and time.</p>
    </div>
    
    <h2>Next Steps:</h2>
    <ul>
      <li>Attend the garage on the scheduled day and time</li>
      <li>Bring the vehicle ${booking.vehicle.registration}</li>
      <li>Contact the garage if you need to make changes: ${booking.garage.phone}</li>
    </ul>
    
    <p style="text-align: center;">
      <a href="${bookingUrl}" class="button">View Booking Details</a>
    </p>
    
    <p><strong>Garage Contact:</strong></p>
    <p>
      ${booking.garage.name}<br>
      ${booking.garage.address}, ${booking.garage.city} ${booking.garage.postcode}<br>
      Phone: ${booking.garage.phone}<br>
      ${booking.garage.email ? `Email: ${booking.garage.email}` : ''}
    </p>
  `

  const text = `
Your Booking Has Been Approved! - BookaMOT

Hello ${booking.customer.name || 'Customer'},

Great news! Your booking has been approved by the garage.

Booking Details:
- Reference: ${booking.bookingRef}
- Date: ${formatDate(booking.date)}
- Time: ${formatTime(booking.timeSlot)}
- Vehicle: ${booking.vehicle.registration} - ${booking.vehicle.make} ${booking.vehicle.model} (${booking.vehicle.year})
- Garage: ${booking.garage.name}
- Address: ${booking.garage.address}, ${booking.garage.city} ${booking.garage.postcode}
- Price: ${formatCurrency(booking.totalPrice)}

Status: Approved
Your reservation is confirmed. Please attend on the scheduled date and time.

Next Steps:
- Attend the garage on the scheduled day and time
- Bring the vehicle ${booking.vehicle.registration}
- Contact the garage if you need to make changes: ${booking.garage.phone}

View details: ${bookingUrl}

Garage Contact:
${booking.garage.name}
${booking.garage.address}, ${booking.garage.city} ${booking.garage.postcode}
Phone: ${booking.garage.phone}
${booking.garage.email ? `Email: ${booking.garage.email}` : ''}
  `

  return {
    html: getEmailTemplate(content, 'Booking Approved', unsubscribeLink),
    text,
    subject: `Booking Approved - ${booking.bookingRef}`
  }
}

// 4. Booking rejeitado
export function getBookingRejectedTemplate(
  booking: BookingWithRelations,
  reason?: string
): EmailTemplate {
  const bookingUrl = `${process.env.NEXTAUTH_URL}/booking/${booking.id}`
  const searchUrl = `${process.env.NEXTAUTH_URL}/search`
  const unsubscribeLink = `${process.env.NEXTAUTH_URL}/unsubscribe?email=${encodeURIComponent(booking.customer.email)}`

  const content = `
    <h1>Booking Not Approved</h1>
    <p>Hello ${booking.customer.name || 'Customer'},</p>
    <p>Unfortunately, your booking was not approved by the garage.</p>
    
    ${createBookingDetailsSection(booking)}
    
    ${reason ? `
    <div class="error-box">
      <strong>Reason for Rejection:</strong>
      <p style="margin: 10px 0 0 0;">${reason}</p>
    </div>
    ` : ''}
    
    <p>Don't worry! You can make a new booking with another garage or try again on a different date.</p>
    
    <p style="text-align: center;">
      <a href="${searchUrl}" class="button">Search Other Garages</a>
    </p>
    
    <p style="text-align: center;">
      <a href="${bookingUrl}" style="color: #2563eb; text-decoration: underline;">View Booking Details</a>
    </p>
    
    <p>If you believe there was an error or would like more information, please contact us: <a href="mailto:support@bookamot.co.uk">support@bookamot.co.uk</a></p>
  `

  const text = `
Booking Not Approved - BookaMOT

Hello ${booking.customer.name || 'Customer'},

Unfortunately, your booking was not approved by the garage.

Booking Details:
- Reference: ${booking.bookingRef}
- Date: ${formatDate(booking.date)}
- Time: ${formatTime(booking.timeSlot)}
- Vehicle: ${booking.vehicle.registration} - ${booking.vehicle.make} ${booking.vehicle.model} (${booking.vehicle.year})
- Garage: ${booking.garage.name}
- Price: ${formatCurrency(booking.totalPrice)}

${reason ? `Reason for Rejection: ${reason}` : ''}

Don't worry! You can make a new booking with another garage or try again on a different date.

Search other garages: ${searchUrl}
View details: ${bookingUrl}

If you believe there was an error, please contact us: support@bookamot.co.uk
  `

  return {
    html: getEmailTemplate(content, 'Booking Not Approved', unsubscribeLink),
    text,
    subject: `Booking Not Approved - ${booking.bookingRef}`
  }
}

// 5. Pre-service reminder (1 month, 1 week, 1 day)
export function getBookingReminderTemplate(
  booking: BookingWithRelations,
  reminderType: '1_MONTH' | '1_WEEK' | '1_DAY'
): EmailTemplate {
  const bookingUrl = `${process.env.NEXTAUTH_URL}/booking/${booking.id}`
  const unsubscribeLink = `${process.env.NEXTAUTH_URL}/unsubscribe?email=${encodeURIComponent(booking.customer.email)}`

  const reminderTexts = {
    '1_MONTH': {
      title: 'Reminder: Your Booking is in 1 Month',
      message: 'Your booking is scheduled for approximately 1 month from now.',
      urgency: 'low'
    },
    '1_WEEK': {
      title: 'Reminder: Your Booking is in 1 Week',
      message: 'Your booking is scheduled for 1 week from now.',
      urgency: 'medium'
    },
    '1_DAY': {
      title: 'Reminder: Your Booking is Tomorrow!',
      message: 'Your booking is scheduled for tomorrow!',
      urgency: 'high'
    }
  }

  const reminder = reminderTexts[reminderType]

  const content = `
    <h1>${reminder.title}</h1>
    <p>Hello ${booking.customer.name || 'Customer'},</p>
    <p>${reminder.message}</p>
    
    ${createBookingDetailsSection(booking)}
    
    <div class="info-box">
      <strong>📋 Important Instructions for the Day:</strong>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>Arrive promptly at the scheduled time (${formatTime(booking.timeSlot)})</li>
        <li>Bring the vehicle ${booking.vehicle.registration}</li>
        <li>Ensure the vehicle is in a condition suitable for testing</li>
        <li>Bring vehicle documentation if required</li>
      </ul>
    </div>
    
    <div class="info-box">
      <strong>📞 Emergency Contact:</strong>
      <p style="margin: 10px 0 0 0;">
        <strong>Garage:</strong> ${booking.garage.name}<br>
        <strong>Phone:</strong> ${booking.garage.phone}<br>
        ${booking.garage.email ? `<strong>Email:</strong> ${booking.garage.email}` : ''}
      </p>
    </div>
    
    <p style="text-align: center;">
      <a href="${bookingUrl}" class="button">View Booking Details</a>
    </p>
    
    <p>If you need to cancel or reschedule, please contact the garage as soon as possible.</p>
  `

  const text = `
${reminder.title} - BookaMOT

Hello ${booking.customer.name || 'Customer'},

${reminder.message}

Booking Details:
- Reference: ${booking.bookingRef}
- Date: ${formatDate(booking.date)}
- Time: ${formatTime(booking.timeSlot)}
- Vehicle: ${booking.vehicle.registration} - ${booking.vehicle.make} ${booking.vehicle.model} (${booking.vehicle.year})
- Garage: ${booking.garage.name}
- Address: ${booking.garage.address}, ${booking.garage.city} ${booking.garage.postcode}
- Price: ${formatCurrency(booking.totalPrice)}

Important Instructions for the Day:
- Arrive promptly at the scheduled time (${formatTime(booking.timeSlot)})
- Bring the vehicle ${booking.vehicle.registration}
- Ensure the vehicle is in a condition suitable for testing
- Bring vehicle documentation if required

Emergency Contact:
Garage: ${booking.garage.name}
Phone: ${booking.garage.phone}
${booking.garage.email ? `Email: ${booking.garage.email}` : ''}

View details: ${bookingUrl}

If you need to cancel or reschedule, please contact the garage as soon as possible.
  `

  return {
    html: getEmailTemplate(content, reminder.title, unsubscribeLink),
    text,
    subject: `${reminder.title} - ${booking.bookingRef}`
  }
}

// 6. Post-service follow-up
export function getBookingCompletedFollowupTemplate(
  booking: BookingWithRelations,
  motResult?: {
    result: string
    certificateNumber?: string
    expiryDate?: Date
  }
): EmailTemplate {
  const reviewUrl = `${process.env.NEXTAUTH_URL}/reviews?bookingId=${booking.id}`
  const bookingUrl = `${process.env.NEXTAUTH_URL}/booking/${booking.id}`
  const unsubscribeLink = `${process.env.NEXTAUTH_URL}/unsubscribe?email=${encodeURIComponent(booking.customer.email)}`

  const content = `
    <h1>Service Completed</h1>
    <p>Hello ${booking.customer.name || 'Customer'},</p>
    <p>Your MOT service has been completed successfully!</p>
    
    ${createBookingDetailsSection(booking)}
    
    ${motResult ? `
    <div class="success-box">
      <strong>MOT Result:</strong>
      <p style="margin: 10px 0 0 0;">
        <strong>Status:</strong> ${motResult.result === 'PASS' ? '✅ Passed' : motResult.result === 'FAIL' ? '❌ Failed' : '⚠️ Refused'}<br>
        ${motResult.certificateNumber ? `<strong>Certificate Number:</strong> ${motResult.certificateNumber}<br>` : ''}
        ${motResult.expiryDate ? `<strong>Expiry Date:</strong> ${formatDate(motResult.expiryDate)}` : ''}
      </p>
    </div>
    ` : ''}
    
    <h2>Service Summary:</h2>
    <ul>
      <li>MOT service completed successfully</li>
      <li>Garage: ${booking.garage.name}</li>
      <li>Date: ${formatDate(booking.date)}</li>
      <li>Vehicle: ${booking.vehicle.registration}</li>
    </ul>
    
    <div class="info-box">
      <strong>⭐ Your Opinion Matters!</strong>
      <p style="margin: 10px 0 0 0;">Help other customers by sharing your experience. You have up to 30 days to submit your review.</p>
    </div>
    
    <p style="text-align: center;">
      <a href="${reviewUrl}" class="button">Review Garage</a>
    </p>
    
    <p style="text-align: center;">
      <a href="${bookingUrl}" style="color: #2563eb; text-decoration: underline;">View Booking Details</a>
    </p>
    
    <p>Thank you for choosing BookaMOT!</p>
  `

  const text = `
Service Completed - BookaMOT

Hello ${booking.customer.name || 'Customer'},

Your MOT service has been completed successfully!

Booking Details:
- Reference: ${booking.bookingRef}
- Date: ${formatDate(booking.date)}
- Time: ${formatTime(booking.timeSlot)}
- Vehicle: ${booking.vehicle.registration} - ${booking.vehicle.make} ${booking.vehicle.model} (${booking.vehicle.year})
- Garage: ${booking.garage.name}
- Price: ${formatCurrency(booking.totalPrice)}

${motResult ? `
MOT Result:
- Status: ${motResult.result === 'PASS' ? 'Passed' : motResult.result === 'FAIL' ? 'Failed' : 'Refused'}
${motResult.certificateNumber ? `- Certificate Number: ${motResult.certificateNumber}` : ''}
${motResult.expiryDate ? `- Expiry Date: ${formatDate(motResult.expiryDate)}` : ''}
` : ''}

Service Summary:
- MOT service completed successfully
- Garage: ${booking.garage.name}
- Date: ${formatDate(booking.date)}
- Vehicle: ${booking.vehicle.registration}

Your Opinion Matters!
Help other customers by sharing your experience. You have up to 30 days to submit your review.

Review garage: ${reviewUrl}
View details: ${bookingUrl}

Thank you for choosing BookaMOT!
  `

  return {
    html: getEmailTemplate(content, 'Service Completed', unsubscribeLink),
    text,
    subject: `Service Completed - ${booking.bookingRef}`
  }
}

