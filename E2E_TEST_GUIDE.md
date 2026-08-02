# End-to-End Testing Guide

## Setup

### 1. Start Backend
```bash
cd server
npm install
node fullstack-server.js
```
Wait for: `✓ Gharpayy Backend API running on http://localhost:3001`

### 2. Verify Database
Check that `server/gharpayy.db` exists (created on first run)

### 3. Verify API is Ready
```bash
curl http://localhost:3001/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

---

## Test Scenarios

### Scenario 1: Create TCM (Team Member)

**Step 1**: Create a TCM
```bash
curl -X POST http://localhost:3001/api/tcms \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Priya Singh",
    "email": "priya@gharpayy.com",
    "phone": "9876543210",
    "zone": "Indiranagar",
    "conversionRate": 0.35,
    "avgResponseMins": 5
  }'
```

**Expected Response**:
- Status: 201 Created
- Returns TCM object with auto-generated `id` (e.g., `tcm-abc123`)
- Save the `id` for next steps

**Verification**:
```bash
curl http://localhost:3001/api/tcms
# Should show the created TCM in the list
```

---

### Scenario 2: Lead Management with Duplicate Detection

**Step 1**: Create first lead (should succeed)
```bash
curl -X POST http://localhost:3001/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Raj Kumar",
    "phone": "9123456789",
    "email": "raj@example.com",
    "source": "referral",
    "budget": 25000,
    "moveInDate": "2026-08-15",
    "preferredArea": "Indiranagar",
    "assignedTcmId": "tcm-abc123"
  }'
```

**Expected Response**:
- Status: 201 Created
- Lead object with `id`, `stage: "new"`, `confidence: 50`
- Save the `id` as `LEAD_ID`

**Step 2**: Try to create duplicate with same phone (should fail)
```bash
curl -X POST http://localhost:3001/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Raj Kumar (Duplicate)",
    "phone": "9123456789",
    "email": "raj2@example.com",
    "budget": 30000,
    "preferredArea": "Koramangala",
    "assignedTcmId": "tcm-abc123"
  }'
```

**Expected Response**:
- Status: 409 Conflict
- Error: "Duplicate lead"
- Message: "Lead with phone 9123456789 already exists"
- Returns `existingLeadId`

✅ **TEST PASSED**: Duplicate detection works!

**Step 3**: Check for duplicate before creating
```bash
curl -X POST http://localhost:3001/api/leads/check-duplicate \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9123456789",
    "email": "new@example.com"
  }'
```

**Expected Response**:
```json
{
  "isDuplicate": true,
  "duplicates": [
    {
      "field": "phone",
      "value": "9123456789",
      "existingLeadId": "lead-xyz",
      "existingLeadName": "Raj Kumar"
    }
  ]
}
```

✅ **TEST PASSED**: Pre-creation duplicate check works!

**Step 4**: Get all leads
```bash
curl http://localhost:3001/api/leads
```

**Expected Response**:
- Array of all leads
- First entry should be the one we created

---

### Scenario 3: Follow-up Queue

**Step 1**: Create follow-up for the lead
```bash
curl -X POST http://localhost:3001/api/follow-ups \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "LEAD_ID",
    "tcmId": "tcm-abc123",
    "dueAt": "2026-08-05T18:00:00Z",
    "priority": "high",
    "reason": "Price negotiation"
  }'
```

**Expected Response**:
- Status: 201 Created
- Follow-up object with `done: 0`
- Save `id` as `FOLLOWUP_ID`

**Step 2**: Get all follow-ups
```bash
curl http://localhost:3001/api/follow-ups
```

**Expected Response**:
- Array with follow-up we just created
- Includes `leadName` and `tcmName` (joined data)

**Step 3**: Complete follow-up
```bash
curl -X PUT http://localhost:3001/api/follow-ups/FOLLOWUP_ID/complete \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response**:
- Follow-up with `done: 1`
- `completedAt` timestamp set

✅ **TEST PASSED**: Follow-up lifecycle works!

---

### Scenario 4: Tours and Bookings

**Step 1**: Schedule tour
```bash
curl -X POST http://localhost:3001/api/tours \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "LEAD_ID",
    "propertyId": "prop-123",
    "tcmId": "tcm-abc123",
    "scheduledAt": "2026-08-05T15:00:00Z"
  }'
```

**Expected Response**:
- Status: 201 Created
- Tour with `status: "scheduled"`
- Save `id` as `TOUR_ID`

**Step 2**: Update tour to completed
```bash
curl -X PUT http://localhost:3001/api/tours/TOUR_ID \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "decision": "booked",
    "postTourOutcome": "booked",
    "postTourConfidence": 95
  }'
```

**Expected Response**:
- Tour with updated `status`, `decision`, `postTourOutcome`
- `postTourFilledAt` timestamp set

**Step 3**: Create booking
```bash
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "LEAD_ID",
    "tourId": "TOUR_ID",
    "propertyId": "prop-123",
    "tcmId": "tcm-abc123",
    "amount": 25000
  }'
```

**Expected Response**:
- Status: 201 Created
- Booking with `amount: 25000`

**Step 4**: Get bookings
```bash
curl http://localhost:3001/api/bookings
```

**Expected Response**:
- Array with booking we created
- Shows `leadName`, `tcmName`, `amount`

✅ **TEST PASSED**: Tours and bookings work!

---

### Scenario 5: Leaderboard

**Step 1**: Get TCM performance metrics
```bash
curl http://localhost:3001/api/tcms
```

**Expected Response**:
```json
[
  {
    "id": "tcm-abc123",
    "name": "Priya Singh",
    "zone": "Indiranagar",
    "conversionRate": 0.35,
    "leadCount": 1,
    "tourCount": 1,
    "bookingCount": 1,
    "revenue": 25000,
    ...
  }
]
```

✅ **TEST PASSED**: Leaderboard aggregation works!

---

### Scenario 6: Daily Summary Dashboard (NEW FEATURE)

**Step 1**: Get today's stats
```bash
curl http://localhost:3001/api/dashboard/stats
```

**Expected Response**:
```json
{
  "todayNewLeads": 1,
  "pendingFollowUps": 0,
  "todayBookings": 1,
  "todayRevenue": 25000,
  "totalLeads": 1,
  "activeTours": 0
}
```

✅ **TEST PASSED**: Quick stats work!

**Step 2**: Get full daily summary
```bash
curl http://localhost:3001/api/dashboard/today
```

**Expected Response**:
```json
{
  "date": "2026-08-02",
  "summary": {
    "newLeadsCount": 1,
    "followUpsDueCount": 1,
    "followUpsDoneCount": 1,
    "toursScheduledCount": 1,
    "toursCompletedCount": 1,
    "bookingsCount": 1,
    "totalRevenue": 25000
  },
  "details": {
    "newLeads": [...],
    "followUpsDue": [...],
    "followUpsDone": [...],
    "tourScheduled": [...],
    "toursCompleted": [...],
    "bookings": [...]
  }
}
```

✅ **TEST PASSED**: Daily summary with all details works!

---

### Scenario 7: Find Duplicates

**Step 1**: Create another TCM and lead with similar data
```bash
# Create TCM 2
curl -X POST http://localhost:3001/api/tcms \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Arjun Patel",
    "email": "arjun@gharpayy.com",
    "zone": "Koramangala",
    "conversionRate": 0.40,
    "avgResponseMins": 3
  }'

# Create lead with slightly different name, same phone (simulating duplicate)
curl -X POST http://localhost:3001/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Raj K.",
    "phone": "9123456789",
    "email": "raj.k@example.com",
    "budget": 25000,
    "preferredArea": "Indiranagar",
    "assignedTcmId": "tcm-xyz"
  }'
```

This will fail (duplicate phone). Now:

**Step 2**: Find all duplicates
```bash
curl http://localhost:3001/api/leads/duplicates
```

**Expected Response**:
```json
[
  {
    "leadId1": "lead-1",
    "name1": "Raj Kumar",
    "phone1": "9123456789",
    "leadId2": "lead-2",
    "name2": "Raj K.",
    "phone2": "9123456789",
    "duplicateField": "phone"
  }
]
```

✅ **TEST PASSED**: Duplicate finding works!

---

## Frontend Testing

### Test the DailySummaryDashboard Component

1. **Start frontend**:
```bash
npm run dev
```

2. **Navigate to**:
```
http://localhost:5173/dashboard/daily
```

3. **Verify**:
- ✅ Stats cards load with real data from SQLite
- ✅ Tabs show breakdown by category
- ✅ Click refresh button updates data
- ✅ Revenue shows formatted currency

### Test Duplicate Lead Detection

1. **Go to create lead form** (wherever that is)

2. **Trigger duplicate check** when entering phone:
```javascript
// This should call:
checkDuplicate(phone, email)
// And show the DuplicateLeadDetection component
```

3. **Verify**:
- ✅ Shows duplicate warning with existing lead name/ID
- ✅ Shows "safe to create" when no duplicates

---

## Database Verification

### View Database Tables

Using SQLite CLI:
```bash
cd server
sqlite3 gharpayy.db
```

Inside SQLite:
```sql
-- Show tables
.tables

-- Count leads
SELECT COUNT(*) FROM leads;

-- Show all leads
SELECT id, name, phone, email, stage FROM leads;

-- Show all follow-ups
SELECT * FROM follow_ups;

-- Show bookings today
SELECT * FROM bookings WHERE DATE(createdAt) = DATE('now');

-- Show TCM performance
SELECT 
  id, name, zone,
  (SELECT COUNT(*) FROM leads WHERE assignedTcmId = tcms.id) as lead_count,
  (SELECT COUNT(*) FROM bookings WHERE tcmId = tcms.id) as booking_count,
  (SELECT COALESCE(SUM(amount), 0) FROM bookings WHERE tcmId = tcms.id) as revenue
FROM tcms;

-- Exit
.quit
```

---

## Complete Test Sequence (5 Minutes)

Run this script to test everything:

```bash
#!/bin/bash

API="http://localhost:3001/api"

# 1. Health check
echo "1. Health check..."
curl $API/health

# 2. Create TCM
echo -e "\n2. Creating TCM..."
TCM=$(curl -s -X POST $API/tcms \
  -H "Content-Type: application/json" \
  -d '{"name":"Priya","zone":"Indiranagar","conversionRate":0.35}' | jq -r '.id')
echo "TCM ID: $TCM"

# 3. Create lead
echo -e "\n3. Creating lead..."
LEAD=$(curl -s -X POST $API/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"Raj","phone":"9123456789","budget":25000,"assignedTcmId":"'$TCM'"}' | jq -r '.id')
echo "Lead ID: $LEAD"

# 4. Check duplicate
echo -e "\n4. Checking duplicate..."
curl -s -X POST $API/leads/check-duplicate \
  -H "Content-Type: application/json" \
  -d '{"phone":"9123456789"}' | jq .

# 5. Create follow-up
echo -e "\n5. Creating follow-up..."
FU=$(curl -s -X POST $API/follow-ups \
  -H "Content-Type: application/json" \
  -d '{"leadId":"'$LEAD'","tcmId":"'$TCM'","dueAt":"2026-08-05T18:00:00Z","priority":"high"}' | jq -r '.id')
echo "Follow-up ID: $FU"

# 6. Get daily stats
echo -e "\n6. Daily stats..."
curl -s $API/dashboard/stats | jq .

# 7. Get full summary
echo -e "\n7. Full daily summary..."
curl -s $API/dashboard/today | jq '.summary'

echo -e "\n✅ All tests completed!"
```

---

## Checklist

- [ ] Backend starts without errors
- [ ] Database created (server/gharpayy.db)
- [ ] Health check returns OK
- [ ] Can create TCM
- [ ] Can create lead
- [ ] Duplicate detection prevents phone duplicates
- [ ] Duplicate detection prevents email duplicates
- [ ] Can create follow-up
- [ ] Can mark follow-up complete
- [ ] Can schedule tour
- [ ] Can create booking
- [ ] TCM shows aggregated metrics (leads, tours, bookings, revenue)
- [ ] Daily stats show today's counts
- [ ] Daily summary shows breakdown by category
- [ ] Frontend connects to API
- [ ] DailySummaryDashboard displays real data
- [ ] DuplicateLeadDetection shows warnings

---

## Success Criteria

✅ All 5 features working end-to-end:
1. Lead Management with CRUD
2. Follow-up Queue with lifecycle
3. Leaderboard with TCM metrics
4. Duplicate Lead Detection (2-layer)
5. Daily Summary Dashboard (real-time aggregation)

✅ All data persisted in SQLite
✅ All APIs responding correctly
✅ Frontend components displaying real data
✅ No console errors
