# MOT Features Guide

## Overview

This guide covers all the advanced MOT features implemented in BookaMOT, including:

1. **Manual Data Refresh**
2. **Cache with TTL**
3. **MOT Notifications**
4. **MOT Reports**
5. **Alert System**

---

## 1. Manual Data Refresh

### Endpoint
```
POST /api/vehicles/[id]/mot-history/refresh
```

### Description
Manually refresh MOT data from the DVSA API for a specific vehicle.

### Usage
```bash
curl -X POST http://localhost:3002/api/vehicles/cmgwto283000742vxvp0obbwi/mot-history/refresh \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Response
```json
{
  "success": true,
  "message": "Successfully refreshed MOT data. Found 19 records.",
  "data": [...],
  "refreshedAt": "2025-10-19T10:30:00.000Z"
}
```

### Features
- ✅ Fetches latest data from DVSA API
- ✅ Saves all data to database
- ✅ Triggers notification checks
- ✅ Returns formatted MOT history

---

## 2. Cache with TTL (Time To Live)

### Configuration
- **Default TTL**: 60 minutes
- **Max Cache Size**: 1000 entries
- **Auto Cleanup**: Every 5 minutes

### How It Works
1. First request fetches from DVSA API
2. Data is cached in memory
3. Subsequent requests use cached data (within TTL)
4. After TTL expires, fresh data is fetched

### Cache Keys
- MOT History: `mot_history_{vehicleId}`
- DVSA API: `dvsa_api_{registration}`

### Benefits
- ⚡ Faster response times
- 💰 Reduced API calls
- 🔄 Automatic expiration
- 🧹 Automatic cleanup

### Cache Statistics
```typescript
import { motCache } from '@/lib/cache/mot-cache'

const stats = motCache.getStats()
console.log(stats)
// {
//   size: 5,
//   ttl: 3600000,
//   maxSize: 1000,
//   entries: [...]
// }
```

---

## 3. MOT Notifications

### Database Model
```prisma
model MotNotification {
  id            String
  vehicleId     String
  userId        String
  type          NotificationType  // EXPIRING_SOON, EXPIRED, FAILED
  title         String
  message       String
  daysUntilExpiry Int?
  isRead        Boolean
  sentAt        DateTime
  readAt        DateTime?
}
```

### Notification Types
- **EXPIRING_SOON**: MOT expires within 30 days
- **EXPIRED**: MOT has expired
- **FAILED**: MOT test failed

### Get Notifications
```bash
GET /api/notifications/mot?limit=10&includeRead=false
```

### Mark as Read
```bash
PATCH /api/notifications/mot?id=notification_id
```

### Automatic Triggers
Notifications are automatically created when:
1. MOT data is fetched from DVSA
2. MOT data is manually refreshed
3. MOT data is saved to database

---

## 4. MOT Reports

### Generate JSON Report
```bash
GET /api/vehicles/[id]/mot-report?format=json
```

### Generate CSV Report
```bash
GET /api/vehicles/[id]/mot-report?format=csv
```

### Download Report
```bash
GET /api/vehicles/[id]/mot-report?format=json&download=true
```

### Report Contents
- Vehicle information
- Complete MOT history
- Summary statistics:
  - Total tests
  - Pass/Fail count
  - Pass rate percentage
  - Average mileage
  - Latest test date
  - Next MOT date
  - Days until expiry

### Example Report
```json
{
  "vehicle": {
    "registration": "WJ11USE",
    "make": "PEUGEOT",
    "model": "207",
    "year": 2011
  },
  "summary": {
    "totalTests": 19,
    "passedTests": 16,
    "failedTests": 3,
    "passRate": 84,
    "averageMileage": 95000,
    "nextMotDate": "2025-11-06",
    "daysUntilExpiry": 18
  },
  "motHistory": [...]
}
```

---

## 5. Alert System

### Comprehensive Alerts
Alerts are sent via multiple channels:
- 📧 Email
- 📱 SMS
- 🔔 Push Notifications

### Manual Alert Check
```bash
POST /api/alerts/check-mot
```

### Response
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

### Automatic Alerts
Alerts are automatically sent when:
1. MOT is expiring within 30 days
2. MOT has expired
3. MOT test failed

### Integration Points
To enable email/SMS alerts, integrate with:
- **Email**: SendGrid, Mailgun, AWS SES
- **SMS**: Twilio, AWS SNS
- **Push**: Firebase, OneSignal

### Example Integration (Email)
```typescript
// In src/lib/services/alert-service.ts
async function sendEmailAlert(email: string, data: AlertData) {
  await sendgrid.send({
    to: email,
    from: 'noreply@bookamot.com',
    subject: data.title,
    html: `<p>${data.message}</p>`
  })
}
```

---

## Scheduled Tasks

### Recommended Cron Jobs

#### Daily MOT Check (8 AM)
```bash
0 8 * * * curl -X POST http://localhost:3002/api/alerts/check-mot
```

#### Weekly Cache Cleanup (Sunday 2 AM)
```bash
0 2 * * 0 curl -X POST http://localhost:3002/api/cache/cleanup
```

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vehicles/[id]/mot-history` | Get MOT history |
| POST | `/api/vehicles/[id]/mot-history` | Refresh MOT data |
| GET | `/api/vehicles/[id]/mot-report` | Generate report |
| GET | `/api/notifications/mot` | Get notifications |
| PATCH | `/api/notifications/mot` | Mark as read |
| POST | `/api/alerts/check-mot` | Trigger alert check |

---

## Best Practices

1. **Cache Management**
   - Monitor cache size regularly
   - Adjust TTL based on usage patterns
   - Clear cache when needed

2. **Notifications**
   - Check unread count frequently
   - Mark notifications as read
   - Archive old notifications

3. **Reports**
   - Generate reports for record keeping
   - Export to CSV for analysis
   - Schedule regular report generation

4. **Alerts**
   - Set up daily alert checks
   - Configure email/SMS integration
   - Test alerts regularly

---

## Troubleshooting

### Cache Not Working
- Check cache size: `motCache.getStats()`
- Clear cache: `motCache.clear()`
- Verify TTL configuration

### Notifications Not Appearing
- Check database: `SELECT * FROM MotNotification`
- Verify user email/phone
- Check notification service logs

### Reports Not Generating
- Verify vehicle has MOT history
- Check database permissions
- Review error logs

### Alerts Not Sending
- Verify email/SMS service integration
- Check user contact information
- Review alert service logs

---

## Support

For issues or questions, contact the development team or check the logs:
```bash
tail -f logs/mot-service.log
```

