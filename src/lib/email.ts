import nodemailer from 'nodemailer'

// Validate SMTP configuration
function validateSMTPConfig(): boolean {
  const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM']
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    console.error('❌ Missing SMTP environment variables:', missing.join(', '))
    return false
  }
  
  return true
}

// Get or create email transporter (lazy initialization)
function getTransporter(): nodemailer.Transporter | null {
  if (!validateSMTPConfig()) {
    return null
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
    
    return transporter
  } catch (error) {
    console.error('❌ Error creating email transporter:', error)
    return null
  }
}

// Escape HTML to prevent XSS and formatting issues
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

// Generate 6-character alphanumeric verification code
export function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Excluding confusing characters like O, 0, I, 1
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Base email template
function getEmailTemplate(content: string, title: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title} - BookaMOT</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; padding: 20px; }
          .logo { color: #2563eb; font-size: 28px; font-weight: bold; }
          .content { background: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .button { display: inline-block; background: #2563eb; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .code-box { background: #f0f7ff; border: 2px dashed #2563eb; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb; font-family: monospace; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; padding: 20px; }
          .info-box { background: #fef3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px; }
          h2 { color: #1a1a1a; margin-bottom: 20px; }
          p { margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🛡️ BookaMOT</div>
          </div>
          ${content}
          <div class="footer">
            <p>This is an automated email, please do not reply.</p>
            <p>© ${new Date().getFullYear()} BookaMOT. All rights reserved.</p>
            <p>Need help? Contact us: <a href="mailto:support@bookamot.co.uk">support@bookamot.co.uk</a></p>
          </div>
        </div>
      </body>
    </html>
  `
}

// Send verification email to garage
export async function sendGarageVerificationEmail(
  email: string,
  garageName: string,
  verificationCode: string
): Promise<void> {
  const transporter = getTransporter()
  
  if (!transporter) {
    const errorMsg = 'SMTP transporter not configured. Please check your environment variables.'
    console.error('❌', errorMsg)
    throw new Error(errorMsg)
  }

  const content = `
    <div class="content">
      <h2>Email Verification</h2>
      <p>Hello,</p>
      <p>Thank you for registering <strong>${garageName}</strong> on BookaMOT!</p>
      <p>To complete your registration, use the verification code below:</p>
      
      <div class="code-box">
        <div class="code">${verificationCode}</div>
      </div>
      
      <div class="info-box">
        <strong>⚠️ Important:</strong>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
          <li>This code expires in <strong>30 minutes</strong></li>
          <li>Do not share this code with anyone</li>
          <li>If you did not request this registration, please ignore this email</li>
        </ul>
      </div>
      
      <p>After verifying your email, your registration request will be reviewed by our team. You will receive a confirmation when it is approved.</p>
      
      <p>Estimated review time: <strong>1-2 business days</strong></p>
    </div>
  `

  await transporter.sendMail({
    from: `"BookaMOT" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: 'Verify your email - BookaMOT',
    html: getEmailTemplate(content, 'Email Verification'),
  })
}

// Send garage approval email
export async function sendGarageApprovalEmail(
  email: string,
  garageName: string,
  ownerName: string,
  approvedAt?: Date,
  approvedBy?: string
): Promise<void> {
  const transporter = getTransporter()
  
  if (!transporter) {
    const errorMsg = 'SMTP transporter not configured. Please check your environment variables.'
    console.error('❌', errorMsg)
    throw new Error(errorMsg)
  }

  const loginUrl = `${process.env.NEXTAUTH_URL}/garage-admin/signin`
  const approvalDate = approvedAt ? new Date(approvedAt).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  
  const content = `
    <div class="content">
      <h2>🎉 Your Garage Has Been Approved!</h2>
      <p>Hello ${ownerName},</p>
      <p>Great news! <strong>${garageName}</strong> has been approved and is now active on BookaMOT.</p>
      
      <div class="success-box">
        <strong>✅ Status: Approved and Active</strong>
        <p style="margin: 10px 0 0 0;">Your garage can now receive customer bookings!</p>
        <p style="margin: 10px 0 0 0; font-size: 0.9em;">
          Approved on: ${approvalDate}
          ${approvedBy ? `<br>Approved by: ${approvedBy}` : ''}
        </p>
      </div>
      
      <p>Your garage is now fully activated with access to all features:</p>
      <ul>
        <li>✅ Receive and manage customer bookings</li>
        <li>✅ Set and update opening hours</li>
        <li>✅ View booking history and analytics</li>
        <li>✅ Update garage information and pricing</li>
        <li>✅ Track customer reviews and ratings</li>
        <li>✅ Manage MOT test results</li>
      </ul>
      
      <p style="text-align: center;">
        <a href="${loginUrl}" class="button">Access Admin Panel</a>
      </p>
      
      <div class="info-box">
        <strong>📋 Next Steps:</strong>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
          <li>Log in to your admin panel using your registered email</li>
          <li>Set up your opening hours and availability</li>
          <li>Review and confirm incoming bookings</li>
          <li>Keep your garage information up to date</li>
        </ul>
      </div>
      
      <p>Welcome to BookaMOT! We're excited to have you on board.</p>
      
      <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
    </div>
  `

  await transporter.sendMail({
    from: `"BookaMOT" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: '🎉 Your garage has been approved - BookaMOT',
    html: getEmailTemplate(content, 'Garage Approved'),
  })
}

// Send garage rejection email
export async function sendGarageRejectionEmail(
  email: string,
  garageName: string,
  ownerName: string,
  reason: string
): Promise<void> {
  const transporter = getTransporter()
  
  if (!transporter) {
    const errorMsg = 'SMTP transporter not configured. Please check your environment variables.'
    console.error('❌', errorMsg)
    throw new Error(errorMsg)
  }

  // Convert newlines to <br> tags for proper HTML display
  const formattedReason = escapeHtml(reason).replace(/\n/g, '<br>')

  const content = `
    <div class="content">
      <h2>Garage Registration Update</h2>
      <p>Hello ${escapeHtml(ownerName)},</p>
      <p>Unfortunately, we were unable to approve the registration of <strong>${escapeHtml(garageName)}</strong> at this time.</p>
      
      <div class="info-box">
        <strong>Reason:</strong>
        <p style="margin: 10px 0 0 0;">${formattedReason}</p>
      </div>
      
      <p>If you believe there was an error or would like to provide additional information, please contact us:</p>
      <ul>
        <li>Email: <a href="mailto:support@bookamot.co.uk">support@bookamot.co.uk</a></li>
      </ul>
      
      <p>You can try registering again at any time.</p>
    </div>
  `

  await transporter.sendMail({
    from: `"BookaMOT" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: 'Registration update - BookaMOT',
    html: getEmailTemplate(content, 'Registration Update'),
  })
}

// Send email requesting additional information
export async function sendGarageInfoRequestEmail(
  email: string,
  garageName: string,
  ownerName: string,
  requestDetails: string
): Promise<void> {
  const transporter = getTransporter()
  
  if (!transporter) {
    const errorMsg = 'SMTP transporter not configured. Please check your environment variables.'
    console.error('❌', errorMsg)
    console.error('   Current env vars:', {
      SMTP_HOST: process.env.SMTP_HOST ? 'SET' : 'NOT SET',
      SMTP_USER: process.env.SMTP_USER ? 'SET' : 'NOT SET',
      SMTP_PASS: process.env.SMTP_PASS ? 'SET' : 'NOT SET',
      SMTP_FROM: process.env.SMTP_FROM ? 'SET' : 'NOT SET',
    })
    throw new Error(errorMsg)
  }

  // Convert newlines to <br> tags for proper HTML display
  const formattedDetails = escapeHtml(requestDetails).replace(/\n/g, '<br>')

  const content = `
    <div class="content">
      <h2>Additional Information Required</h2>
      <p>Hello ${escapeHtml(ownerName)},</p>
      <p>We are reviewing the registration of <strong>${escapeHtml(garageName)}</strong> and need some additional information to proceed.</p>
      
      <div class="info-box">
        <strong>Information requested:</strong>
        <p style="margin: 10px 0 0 0;">${formattedDetails}</p>
      </div>
      
      <p>Please reply to this email or contact us with the requested information:</p>
      <ul>
        <li>Email: <a href="mailto:support@bookamot.co.uk">support@bookamot.co.uk</a></li>
      </ul>
      
      <p>Once we receive the information, we will continue reviewing your registration.</p>
    </div>
  `

  try {
    const result = await transporter.sendMail({
      from: `"BookaMOT" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: 'Additional information required - BookaMOT',
      html: getEmailTemplate(content, 'Additional Information'),
    })
    
    console.log(`✅ Info request email sent successfully to ${email}`)
    console.log(`   Message ID: ${result.messageId}`)
  } catch (error) {
    console.error(`❌ Failed to send info request email to ${email}:`, error)
    throw error
  }
}
