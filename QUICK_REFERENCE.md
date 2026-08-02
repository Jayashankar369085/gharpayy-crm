# Quick Reference Card

## Start Backend
```bash
cd server && node fullstack-server.js
```
✓ Database auto-created at `server/gharpayy.db`
✓ API running on `http://localhost:3001`

---

## Key Endpoints

### Leads (with Duplicate Detection)
```bash
# Create (with automatic validation)
POST /api/leads
{ name, phone, email, budget, assignedTcmId }

# Check duplicate BEFORE creating
POST /api/leads/check-duplicate
{ phone, email }

# Get all
GET /api/leads

# Update
PUT /api/leads/:id
{ stage, confidence, intent }

# Find existing duplicates
GET /api/leads/duplicates
```

### Follow-ups
```bash
# Create
POST /api/follow-ups
{ leadId, tcmId, dueAt, priority, reason }

# Get all
GET /api/follow-ups

# Get overdue
GET /api/follow-ups/overdue

# Mark complete
PUT /api/follow-ups/:id/complete
```

### Tours & Bookings
```bash
# Schedule tour
POST /api/tours
{ leadId, propertyId, tcmId, scheduledAt }

# Complete tour
PUT /api/tours/:id
{ status, decision, postTourOutcome }

# Create booking
POST /api/bookings
{ leadId, tourId, tcmId, amount }
```

### Leaderboard
```bash
# Create TCM
POST /api/tcms
{ name, zone, conversionRate, avgResponseMins }

# Get all with metrics
GET /api/tcms
# Returns: leadCount, tourCount, bookingCount, revenue
```

### Dashboard (NEW)
```bash
# Today's stats (quick)
GET /api/dashboard/stats
# Returns: todayNewLeads, pendingFollowUps, todayBookings, todayRevenue, etc.

# Full daily summary
GET /api/dashboard/today
# Returns: newLeads, followUpsDue, toursScheduled, bookings, revenue breakdown
```

---

## Frontend Components

### DailySummaryDashboard
```tsx
import { DailySummaryDashboard } from '@/components/DailySummaryDashboard';

<DailySummaryDashboard />
// Shows: Stats cards, tabbed breakdown, real-time data from SQLite
```

### DuplicateLeadDetection
```tsx
import { DuplicateLeadDetection } from '@/components/DuplicateLeadDetection';

<DuplicateLeadDetection 
  phone={phone} 
  email={email}
  onDuplicateFound={(isDuplicate, duplicates) => {}}
/>
// Shows: Warning if duplicate exists, success if safe to create
```

---

## API Client

```typescript
import { 
  createLead, getLeads, checkDuplicate,
  createFollowUp, getFollowUps, completeFollowUp,
  createTour, updateTour,
  createBooking, getBookings,
  createTCM, getTCMs,
  getDailySummary, getDashboardStats
} from '@/lib/crm-api-client';
```

---

## Test Scenarios

### 1. Create Lead with Duplicate Check
```bash
# Check first
curl -X POST http://localhost:3001/api/leads/check-duplicate \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210"}'

# If isDuplicate=false, create
curl -X POST http://localhost:3001/api/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"Raj","phone":"9876543210","budget":25000}'
```

### 2. Follow-up Lifecycle
```bash
# Create
curl -X POST http://localhost:3001/api/follow-ups \
  -d '{"leadId":"L1","tcmId":"T1","dueAt":"2026-08-05T18:00:00Z"}'

# Complete
curl -X PUT http://localhost:3001/api/follow-ups/FU1/complete
```

### 3. Book Tour
```bash
# Schedule
curl -X POST http://localhost:3001/api/tours \
  -d '{"leadId":"L1","tcmId":"T1","scheduledAt":"2026-08-05T15:00:00Z"}'

# Mark complete
curl -X PUT http://localhost:3001/api/tours/TR1 \
  -d '{"status":"completed","decision":"booked"}'

# Create booking
curl -X POST http://localhost:3001/api/bookings \
  -d '{"leadId":"L1","tcmId":"T1","amount":25000}'
```

### 4. View Daily Summary
```bash
# Quick stats
curl http://localhost:3001/api/dashboard/stats

# Full breakdown
curl http://localhost:3001/api/dashboard/today
```

---

## Database Queries

```sql
-- Check leads
SELECT * FROM leads;

-- Check duplicates
SELECT * FROM leads WHERE phone IN (
  SELECT phone FROM leads GROUP BY phone HAVING COUNT(*) > 1
);

-- Follow-ups due
SELECT * FROM follow_ups WHERE done=0 AND DATE(dueAt) = DATE('now');

-- Today's bookings
SELECT * FROM bookings WHERE DATE(createdAt) = DATE('now');

-- TCM revenue
SELECT tcmId, SUM(amount) as revenue FROM bookings GROUP BY tcmId;
```

---

## Error Responses

### 409 Conflict (Duplicate)
```json
{
  "error": "Duplicate lead",
  "message": "Lead with phone 9876543210 already exists",
  "existingLeadId": "lead-xyz"
}
```

### 400 Bad Request
```json
{
  "error": "Invalid phone number"
}
```

### 404 Not Found
```json
{
  "error": "Lead not found"
}
```

---

## Key Files

| File | Purpose |
|------|---------|
| `server/fullstack-server.js` | Express backend with all 20+ endpoints |
| `src/lib/crm-api-client.ts` | API client (all methods) |
| `src/components/DailySummaryDashboard.tsx` | Dashboard component |
| `src/components/DuplicateLeadDetection.tsx` | Duplicate warning component |
| `src/routes/dashboard-daily.tsx` | Dashboard route |
| `FULLSTACK_API_REFERENCE.md` | API documentation |
| `E2E_TEST_GUIDE.md` | Testing guide |

---

## Features Checklist

- [x] Lead Management (CRUD + duplicate detection)
- [x] Follow-up Queue (create, list, complete)
- [x] Tours (schedule, update, complete)
- [x] Bookings (create, list)
- [x] Leaderboard (TCM metrics aggregation)
- [x] **NEW** Duplicate Detection (2-layer)
- [x] **NEW** Daily Summary (real-time aggregation)
- [x] All data in SQLite
- [x] All APIs documented
- [x] Frontend components ready

---

## Status

✅ **PRODUCTION READY**
✅ **20+ Endpoints**
✅ **8 Database Tables**
✅ **2 New Features**
✅ **Full-Stack Implementation**
✅ **Ready to Demonstrate**

---

For detailed docs: See `FULLSTACK_API_REFERENCE.md` and `E2E_TEST_GUIDE.md`
