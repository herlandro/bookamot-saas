#!/usr/bin/env tsx
/**
 * Test SMTP Configuration
 * Checks if SMTP environment variables are configured correctly
 */

const requiredVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM']
const optionalVars = ['SMTP_PORT', 'SMTP_SECURE']

console.log('📧 Checking SMTP Configuration...\n')

let allConfigured = true

// Check required variables
console.log('Required Variables:')
requiredVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    // Mask sensitive values
    const displayValue = varName.includes('PASS') 
      ? '*'.repeat(Math.min(value.length, 8))
      : value
    console.log(`  ✅ ${varName}: ${displayValue}`)
  } else {
    console.log(`  ❌ ${varName}: NOT SET`)
    allConfigured = false
  }
})

// Check optional variables
console.log('\nOptional Variables:')
optionalVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`  ✅ ${varName}: ${value}`)
  } else {
    console.log(`  ⚠️  ${varName}: Using default (${varName === 'SMTP_PORT' ? '587' : 'false'})`)
  }
})

console.log('\n' + '='.repeat(50))

if (allConfigured) {
  console.log('✅ All required SMTP variables are configured!')
  console.log('\nTesting email transporter...')
  
  try {
    const nodemailer = await import('nodemailer')
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
    
    // Verify connection
    await transporter.verify()
    console.log('✅ SMTP connection verified successfully!')
  } catch (error) {
    console.error('❌ SMTP connection failed:', error instanceof Error ? error.message : error)
    console.error('\nPlease check:')
    console.error('  1. SMTP credentials are correct')
    console.error('  2. SMTP server is accessible')
    console.error('  3. Firewall allows SMTP connections')
  }
} else {
  console.log('❌ Some required SMTP variables are missing!')
  console.log('\nPlease add the following to your .env file:')
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      console.log(`  ${varName}=your_value_here`)
    }
  })
  console.log('\nExample configuration:')
  console.log('  SMTP_HOST=smtp.gmail.com')
  console.log('  SMTP_PORT=587')
  console.log('  SMTP_SECURE=false')
  console.log('  SMTP_USER=your-email@gmail.com')
  console.log('  SMTP_PASS=your-app-password')
  console.log('  SMTP_FROM=noreply@bookamot.co.uk')
}

console.log('')

