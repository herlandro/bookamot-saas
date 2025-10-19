# MOT Features Setup Guide

## Prerequisites

- Node.js 18+
- PostgreSQL database
- DVSA API credentials (Bearer token and API key)
- (Optional) Email service credentials (SendGrid, Mailgun, etc.)
- (Optional) SMS service credentials (Twilio, AWS SNS, etc.)

---

## Installation & Setup

### 1. Database Migration

Run the database migrations to create the new tables:

```bash
cd /path/to/bookamot-saas
npx prisma migrate dev
```

This will create:
- `MotNotification` table
- `NotificationType` enum

### 2. Environment Variables

Add the following to your `.env` file:

```env
# DVSA API Configuration
DVSA_API_BASE_URL=https://history.mot.api.gov.uk/v1/trade/vehicles
DVSA_API_KEY=your_api_key_here
DVSA_API_TOKEN=your_bearer_token_here

# Cache Configuration (optional)
MOT_CACHE_TTL_MINUTES=60
MOT_CACHE_MAX_SIZE=1000

# Email Service (optional)
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@bookamot.com

# SMS Service (optional)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Verify Installation

Check that all files are in place:

```bash
# Check services
ls -la src/lib/services/
# Should show:
# - mot-notification-service.ts
# - mot-report-service.ts
# - alert-service.ts

# Check API endpoints
ls -la src/app/api/
# Should show:
# - notifications/mot/route.ts
# - vehicles/[id]/mot-report/route.ts
# - alerts/check-mot/route.ts

# Check cache
ls -la src/lib/cache/
# Should show:
# - mot-cache.ts
```

---

## Configuration

### Cache Configuration

Edit `src/lib/cache/mot-cache.ts` to adjust cache settings:

```typescript
// Default: 60 minutes TTL, 1000 max entries
export const motCache = new MotCache(60, 1000)

// Custom: 30 minutes TTL, 500 max entries
export const motCache = new MotCache(30, 500)
```

### Notification Configuration

Edit `src/lib/services/mot-notification-service.ts` to adjust notification triggers:

```typescript
// Current: Notify 30 days before expiry
else if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
  // Change 30 to your preferred number of days
}
```

### Alert Configuration

Edit `src/lib/services/alert-service.ts` to integrate email/SMS services:

```typescript
// Email integration example (SendGrid)
async function sendEmailAlert(email: string, data: AlertData) {
  const sgMail = require('@sendgrid/mail')
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
  
  await sgMail.send({
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: data.title,
    html: `<p>${data.message}</p>`
  })
}

// SMS integration example (Twilio)
async function sendSmsAlert(phone: string, data: AlertData) {
  const twilio = require('twilio')
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  )
  
  await client.messages.create({
    body: data.message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone
  })
}
```

---

## Usage Examples

### Example 1: Refresh MOT Data

```bash
curl -X POST http://localhost:3002/api/vehicles/cmgwto283000742vxvp0obbwi/mot-history \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

Response:
```json
{
  "success": true,
  "message": "Successfully refreshed MOT data. Found 19 records.",
  "data": [...],
  "refreshedAt": "2025-10-19T10:30:00.000Z"
}
```

### Example 2: Get Notifications

```bash
curl http://localhost:3002/api/notifications/mot?limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "notifications": [
    {
      "id": "notification_id",
      "vehicleId": "vehicle_id",
      "type": "EXPIRING_SOON",
      "title": "⏰ MOT Expiring Soon",
      "message": "Your MOT for WJ11USE expires in 15 days...",
      "daysUntilExpiry": 15,
      "isRead": false,
      "sentAt": "2025-10-19T10:00:00.000Z"
    }
  ],
  "unreadCount": 3,
  "total": 1
}
```

### Example 3: Generate Report

```bash
# JSON format
curl http://localhost:3002/api/vehicles/cmgwto283000742vxvp0obbwi/mot-report?format=json \
  -H "Authorization: Bearer YOUR_TOKEN"

# CSV format
curl http://localhost:3002/api/vehicles/cmgwto283000742vxvp0obbwi/mot-report?format=csv \
  -H "Authorization: Bearer YOUR_TOKEN"

# Download as file
curl http://localhost:3002/api/vehicles/cmgwto283000742vxvp0obbwi/mot-report?format=json&download=true \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o mot_report.json
```

### Example 4: Trigger Alert Check

```bash
curl -X POST http://localhost:3002/api/alerts/check-mot \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "success": true,
  "result": {
    "checked": 150,
    "alerted": 12,
    "errors": 0
  }
}
```

---

## Scheduled Tasks

### Setup Daily MOT Check (Linux/Mac)

Add to crontab:

```bash
# Edit crontab
crontab -e

# Add this line to run daily at 8 AM
0 8 * * * curl -X POST http://localhost:3002/api/alerts/check-mot \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Setup with Node.js (node-cron)

Create `src/lib/jobs/mot-check-job.ts`:

```typescript
import cron from 'node-cron'
import { checkAllVehiclesAndAlert } from '@/lib/services/alert-service'

// Run daily at 8 AM
export function startMotCheckJob() {
  cron.schedule('0 8 * * *', async () => {
    console.log('🔍 Running scheduled MOT check...')
    await checkAllVehiclesAndAlert()
  })
}
```

Then in your app initialization:

```typescript
import { startMotCheckJob } from '@/lib/jobs/mot-check-job'

// Start the job
startMotCheckJob()
```

---

## Testing

### Run Test Script

```bash
chmod +x scripts/test-mot-features.sh
./scripts/test-mot-features.sh
```

### Manual Testing

1. **Test Cache**:
   ```bash
   # First call - fetches from API
   curl http://localhost:3002/api/vehicles/[id]/mot-history
   
   # Second call - should use cache (faster)
   curl http://localhost:3002/api/vehicles/[id]/mot-history
   ```

2. **Test Notifications**:
   ```bash
   # Refresh data to trigger notifications
   curl -X POST http://localhost:3002/api/vehicles/[id]/mot-history
   
   # Check notifications
   curl http://localhost:3002/api/notifications/mot
   ```

3. **Test Reports**:
   ```bash
   # Generate JSON report
   curl http://localhost:3002/api/vehicles/[id]/mot-report?format=json
   
   # Generate CSV report
   curl http://localhost:3002/api/vehicles/[id]/mot-report?format=csv
   ```

---

## Troubleshooting

### Cache Not Working
```bash
# Check cache stats
curl http://localhost:3002/api/vehicles/[id]/mot-history/cache-stats

# Clear cache manually
# Edit src/lib/cache/mot-cache.ts and call motCache.clear()
```

### Notifications Not Appearing
```bash
# Check database
psql -U postgres -d bookamot -c "SELECT * FROM MotNotification LIMIT 10;"

# Check logs
tail -f logs/app.log | grep -i notification
```

### Reports Not Generating
```bash
# Verify vehicle has MOT history
psql -U postgres -d bookamot -c "SELECT * FROM MotHistory WHERE vehicleId = 'YOUR_ID';"

# Check API logs
tail -f logs/app.log | grep -i report
```

### Alerts Not Sending
```bash
# Verify email/SMS service integration
# Check environment variables
env | grep -i sendgrid
env | grep -i twilio

# Check logs
tail -f logs/app.log | grep -i alert
```

---

## Performance Optimization

### 1. Increase Cache TTL
```typescript
// From 60 to 120 minutes
export const motCache = new MotCache(120, 1000)
```

### 2. Batch Notification Checks
```typescript
// Instead of checking each vehicle individually
// Group checks by user
const userVehicles = groupBy(vehicles, 'ownerId')
for (const [userId, vehicles] of userVehicles) {
  // Process all vehicles for user at once
}
```

### 3. Database Indexing
```sql
-- Add indexes for faster queries
CREATE INDEX idx_mot_notification_user_read 
  ON MotNotification(userId, isRead);

CREATE INDEX idx_mot_notification_vehicle 
  ON MotNotification(vehicleId);
```

---

## Support & Documentation

- Full feature guide: `md/docs/features/MOT_FEATURES_GUIDE.md`
- Implementation summary: `md/docs/IMPLEMENTATION_SUMMARY.md`
- API documentation: See inline comments in route files

---

## Next Steps

1. ✅ Install and configure
2. ✅ Run database migrations
3. ✅ Test endpoints
4. ✅ Integrate email/SMS services
5. ✅ Setup scheduled tasks
6. ✅ Monitor and optimize

Happy MOT tracking! 🚗

