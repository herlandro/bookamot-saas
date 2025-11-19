# MOT Features - Quick Reference

## 🚀 Quick Start

### 1. Get MOT History
```bash
curl http://localhost:3002/api/vehicles/[id]/mot-history \
  -H "Authorization: Bearer TOKEN"
```

### 2. Refresh MOT Data
```bash
curl -X POST http://localhost:3002/api/vehicles/[id]/mot-history \
  -H "Authorization: Bearer TOKEN"
```

### 3. Get Notifications
```bash
curl http://localhost:3002/api/notifications/mot \
  -H "Authorization: Bearer TOKEN"
```

### 4. Generate Report
```bash
# JSON
curl http://localhost:3002/api/vehicles/[id]/mot-report?format=json \
  -H "Authorization: Bearer TOKEN"

# CSV
curl http://localhost:3002/api/vehicles/[id]/mot-report?format=csv \
  -H "Authorization: Bearer TOKEN"
```

### 5. Trigger Alert Check
```bash
curl -X POST http://localhost:3002/api/alerts/check-mot \
  -H "Authorization: Bearer TOKEN"
```

---

## 📋 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/vehicles/[id]/mot-history` | Get MOT history |
| POST | `/api/vehicles/[id]/mot-history` | Refresh MOT data |
| GET | `/api/vehicles/[id]/mot-report` | Generate report |
| GET | `/api/notifications/mot` | Get notifications |
| PATCH | `/api/notifications/mot` | Mark as read |
| POST | `/api/alerts/check-mot` | Trigger alert check |
| GET | `/api/alerts/check-mot` | Get alert status |

---

## 🔧 Configuration

### Environment Variables
```env
DVSA_API_KEY=your_key
DVSA_API_TOKEN=your_token
MOT_CACHE_TTL_MINUTES=60
MOT_CACHE_MAX_SIZE=1000
```

### Cache Settings
```typescript
// In src/lib/cache/mot-cache.ts
export const motCache = new MotCache(60, 1000)
// (TTL in minutes, max entries)
```

---

## 📊 Database Schema

### MotNotification Table
```sql
CREATE TABLE MotNotification (
  id              String PRIMARY KEY
  vehicleId       String
  userId          String
  type            NotificationType
  title           String
  message         String
  daysUntilExpiry Int
  isRead          Boolean
  sentAt          DateTime
  readAt          DateTime
  createdAt       DateTime
)
```

### NotificationType Enum
```
EXPIRING_SOON
EXPIRED
FAILED
```

---

## 🎯 Notification Types

| Type | Trigger | Days |
|------|---------|------|
| EXPIRING_SOON | MOT expiring | ≤ 30 days |
| EXPIRED | MOT expired | < 0 days |
| FAILED | Test failed | Immediate |

---

## 📁 File Structure

```
src/
├── lib/
│   ├── cache/
│   │   └── mot-cache.ts
│   └── services/
│       ├── mot-notification-service.ts
│       ├── mot-report-service.ts
│       └── alert-service.ts
└── app/api/
    ├── vehicles/[id]/
    │   ├── mot-history/route.ts
    │   └── mot-report/route.ts
    ├── notifications/mot/route.ts
    └── alerts/check-mot/route.ts
```

---

## 🧪 Testing

### Run All Tests
```bash
./scripts/test-mot-features.sh
```

### Test Individual Endpoints
```bash
# Test cache
curl http://localhost:3002/api/vehicles/[id]/mot-history

# Test notifications
curl http://localhost:3002/api/notifications/mot

# Test reports
curl http://localhost:3002/api/vehicles/[id]/mot-report

# Test alerts
curl -X POST http://localhost:3002/api/alerts/check-mot
```

---

## 🔍 Troubleshooting

### Cache Not Working
```bash
# Check cache stats
# Edit src/lib/cache/mot-cache.ts
motCache.getStats()

# Clear cache
motCache.clear()
```

### Notifications Missing
```bash
# Check database
SELECT * FROM MotNotification LIMIT 10;

# Check logs
tail -f logs/app.log | grep notification
```

### Reports Not Generating
```bash
# Verify MOT history exists
SELECT * FROM MotHistory WHERE vehicleId = 'ID';

# Check logs
tail -f logs/app.log | grep report
```

### Alerts Not Sending
```bash
# Verify configuration
env | grep DVSA
env | grep SENDGRID

# Check logs
tail -f logs/app.log | grep alert
```

---

## 📈 Performance Tips

### 1. Optimize Cache
```typescript
// Increase TTL for less frequent updates
export const motCache = new MotCache(120, 1000)
```

### 2. Batch Operations
```typescript
// Process multiple vehicles at once
const vehicles = await prisma.vehicle.findMany()
for (const vehicle of vehicles) {
  await checkAndNotifyMotStatus(vehicle.id)
}
```

### 3. Add Database Indexes
```sql
CREATE INDEX idx_mot_notification_user_read 
  ON MotNotification(userId, isRead);
```

---

## 🔐 Security Checklist

- [ ] Authentication enabled on all endpoints
- [ ] User ownership verified
- [ ] Input validation in place
- [ ] Error messages don't leak data
- [ ] Logs don't contain sensitive data
- [ ] HTTPS enforced
- [ ] CORS configured properly

---

## 📞 Support Resources

| Resource | Location |
|----------|----------|
| Feature Guide | `md/docs/features/MOT_FEATURES_GUIDE.md` |
| Setup Guide | `md/docs/MOT_SETUP_GUIDE.md` |
| Implementation | `md/docs/IMPLEMENTATION_SUMMARY.md` |
| Checklist | `md/docs/IMPLEMENTATION_CHECKLIST.md` |
| Executive Summary | `md/docs/EXECUTIVE_SUMMARY.md` |
| Test Script | `scripts/test-mot-features.sh` |

---

## 🚀 Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Code deployed
- [ ] Endpoints tested
- [ ] Logs monitored
- [ ] Alerts configured
- [ ] Email/SMS integrated (optional)

---

## 💡 Common Tasks

### Refresh All Vehicles
```bash
curl -X POST http://localhost:3002/api/alerts/check-mot \
  -H "Authorization: Bearer TOKEN"
```

### Get Unread Notifications
```bash
curl "http://localhost:3002/api/notifications/mot?includeRead=false" \
  -H "Authorization: Bearer TOKEN"
```

### Download Report
```bash
curl "http://localhost:3002/api/vehicles/[id]/mot-report?format=json&download=true" \
  -H "Authorization: Bearer TOKEN" \
  -o report.json
```

### Mark Notification as Read
```bash
curl -X PATCH "http://localhost:3002/api/notifications/mot?id=NOTIF_ID" \
  -H "Authorization: Bearer TOKEN"
```

---

## 📊 Monitoring

### Key Metrics to Monitor
- Cache hit rate (target: > 80%)
- API response time (target: < 500ms)
- Notification creation rate
- Alert delivery rate
- Error rate (target: < 1%)

### Logs to Check
```bash
# All MOT-related logs
tail -f logs/app.log | grep -i mot

# Cache operations
tail -f logs/app.log | grep -i cache

# Notifications
tail -f logs/app.log | grep -i notification

# Alerts
tail -f logs/app.log | grep -i alert
```

---

## 🎯 Success Criteria

✅ All endpoints responding
✅ Cache working (80%+ hit rate)
✅ Notifications creating automatically
✅ Reports generating correctly
✅ Alerts triggering on schedule
✅ No errors in logs
✅ Performance within targets

---

## 📅 Maintenance Schedule

| Task | Frequency | Command |
|------|-----------|---------|
| Check cache stats | Daily | `motCache.getStats()` |
| Review logs | Daily | `tail -f logs/app.log` |
| Database backup | Daily | `pg_dump bookamot` |
| Clear old notifications | Weekly | `DELETE FROM MotNotification WHERE createdAt < NOW() - INTERVAL '30 days'` |
| Verify alerts | Weekly | `curl -X POST /api/alerts/check-mot` |

---

**Last Updated**: 2025-10-19
**Version**: 1.0.0

