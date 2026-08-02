# Frontend-Backend Integration Verification Guide

## Quick Start

### 1. Start the Backend Server
```bash
cd d:\techblr-gharpayy\server
node fullstack-server.js
```

Expected output:
```
✓ Server listening on http://localhost:3001
✓ SQLite database connected: server/gharpayy.db
```

### 2. Start the Frontend (in new terminal)
```bash
cd d:\techblr-gharpayy
npm run dev
```

Expected output:
```
✓ Local:   http://localhost:5173
✓ Network: http://localhost:5173
```

### 3. Open Browser DevTools
- Press `F12` or `Ctrl+Shift+I`
- Go to **Network** tab
- Optionally: Filter by "Fetch/XHR" to see only API calls

---

## Verification by Feature

### ✅ Feature 1: Lead Management (`/leads`)

1. **Navigate** to http://localhost:5173/leads
2. **Observe:**
   - Loading spinner appears for ~1 second
   - Real leads populate the table (NOT "Aakash/Sneha" mock data)
   - Example real leads: "Raj", etc.
3. **DevTools Network Tab:**
   - Look for: `GET localhost:3001/api/leads`
   - Status: `200 OK`
   - Response: Array of lead objects with real data
4. **Test Filters:**
   - Search by name or phone → works with real data
   - Filter by stage → dynamically filters API response
5. **Click a Lead:**
   - Opens LeadControlPanel (existing UI preserved)

**✓ PASS If:** Real leads display, no mock data, API call visible in Network tab

---

### ✅ Feature 2: Follow-up Queue (`/follow-ups`)

1. **Navigate** to http://localhost:5173/follow-ups
2. **Observe:**
   - "Overdue", "Today", "Upcoming" sections populate from API
   - Follow-up counts match real data
3. **DevTools Network Tab:**
   - Look for: `GET localhost:3001/api/follow-ups`
   - Status: `200 OK`
4. **Mark a Follow-up as Done:**
   - Click the "Done" button on any follow-up
   - Button shows loading spinner
   - Follow-up disappears from list
5. **DevTools Network Tab (After "Done" click):**
   - Look for: `PUT localhost:3001/api/follow-ups/:id/complete`
   - Status: `200 OK`
6. **Toast Notification:**
   - Green success toast: "Follow-up marked done"

**✓ PASS If:** Follow-ups load from API, completion persists to database, API calls visible

---

### ✅ Feature 3: Leaderboard (`/leaderboard`)

1. **Navigate** to http://localhost:5173/leaderboard
2. **Observe:**
   - Loading state appears briefly
   - TCM names display with real data (not mock)
   - Metrics calculated: Leads, Tours, Bookings, Conv %, Discipline, Revenue
3. **DevTools Network Tab:**
   - Look for: `GET localhost:3001/api/tcms`
   - Response: Array of TCM objects with aggregated metrics
   - Also see: `GET localhost:3001/api/leads` (for metric calculation)
4. **Verify Rankings:**
   - TCMs ranked by conversion rate × discipline
   - Rankings reflect real data (not pre-computed mock)
5. **Check Stats Cards:**
   - "Top closer", "Fastest response", "Highest discipline"
   - Values come from real database

**✓ PASS If:** TCM data from API, metrics calculated correctly, rankings dynamic

---

### ✅ Feature 4: Duplicate Lead Detection (Lead Creation)

#### Scenario A: Check for Duplicates During Form Entry

1. **Navigate** to http://localhost:5173/leads/add
2. **Scroll down** to "DirectLeadForm" (or "New lead" section)
3. **Fill form:**
   - Name: "Test Lead"
   - Phone: Use an EXISTING phone number from the database
   - Email: (optional)
   - Area: "Koramangala"
4. **Click "Save lead"**
5. **First Modal (Local Duplicate Check):**
   - If identity store found matches → shows modal with local duplicates
   - Option to "Create anyway" or "Cancel"
6. **Click "Create anyway"** (to proceed to API check)
7. **DevTools Network Tab:**
   - Look for: `POST localhost:3001/api/leads/check-duplicate`
   - Request body: `{ phone: "...", email: "..." }`
   - Status: `200 OK`
   - Response: `{ isDuplicate: true, duplicates: [...] }`
8. **Second Modal (API Duplicates):**
   - Shows actual duplicates found in database
   - Displays matching field indicators
   - Option to "Create Anyway" or "Cancel"
9. **Click "Create Anyway"** to finalize
10. **Success Toast:**
    - Green notification: "Lead created"

#### Scenario B: No Duplicates

1. **Fill form with NEW phone number** (not in database)
2. **Click "Save lead"**
3. **Local check:** No matches
4. **API check:** `{ isDuplicate: false, duplicates: [] }`
5. **Result:** Lead created immediately, success toast

**✓ PASS If:**
- API called with POST `/api/leads/check-duplicate`
- Duplicates found from database
- Can override and create anyway
- New lead persists to SQLite

---

### ✅ Feature 5: Daily Summary Dashboard (`/dashboard-daily`)

1. **Navigate** to Menu → "Daily Run" section → click "Daily Summary"
   - Or: http://localhost:5173/dashboard-daily
2. **Observe:**
   - Loading spinner briefly
   - 6 stat cards appear: New Leads, Pending Follow-ups, Bookings, Revenue, Total Leads, Active Tours
   - Values from today's data
3. **DevTools Network Tab:**
   - Look for: `GET localhost:3001/api/dashboard/today`
   - Status: `200 OK`
   - Response: `{ date: "2026-08-02", summary: {...}, details: {...} }`
   - Also: `GET localhost:3001/api/dashboard/stats`
4. **Tabs:**
   - Click "Today" tab → shows summary boxes
   - Click "New Leads" tab → shows today's new leads
   - Click "Follow-ups" tab → shows due follow-ups
   - Click "Tours" tab → shows scheduled tours
   - Click "Completed" tab → shows completed tours
   - Click "Bookings" tab → shows today's bookings
5. **Refresh Button:**
   - Click blue "Refresh" button
   - Loading state appears
   - Data re-fetches from API
   - Network tab shows fresh GET requests
6. **Real Data:**
   - All counts and details from SQLite database
   - Not hardcoded or mocked

**✓ PASS If:** Dashboard loads from API, all tabs show real data, refresh works

---

## Network Tab Checklist

**All these API calls should be visible in DevTools → Network tab:**

| Feature | HTTP Method | Endpoint | Expected Status |
|---------|-------------|----------|-----------------|
| Load Leads | GET | `/api/leads` | 200 |
| Load Follow-ups | GET | `/api/follow-ups` | 200 |
| Complete Follow-up | PUT | `/api/follow-ups/:id/complete` | 200 |
| Load TCMs | GET | `/api/tcms` | 200 |
| Check Duplicate | POST | `/api/leads/check-duplicate` | 200 |
| Create Lead | POST | `/api/leads` | 201 |
| Load Dashboard Today | GET | `/api/dashboard/today` | 200 |
| Load Dashboard Stats | GET | `/api/dashboard/stats` | 200 |

**Filter tip:** Type `localhost:3001` in Network filter to see only API calls

---

## Common Issues & Fixes

### Issue: Backend not running
**Error:** "Failed to fetch" or "ERR_CONNECTION_REFUSED"
**Fix:**
```bash
# Terminal 1:
cd server
node fullstack-server.js

# Check: http://localhost:3001 should respond
```

### Issue: "Loading..." spinner stuck
**Cause:** Backend not responding or API error
**Fix:**
1. Check backend logs for errors
2. Open DevTools Network tab
3. Look for failed requests (red X)
4. Check response error message

### Issue: Mock data still showing
**Cause:** Browser cache or old code
**Fix:**
```bash
# Clear cache and rebuild
npm run dev --force
# In browser: Ctrl+Shift+Delete → Clear cache
```

### Issue: Leads page shows error "Failed to load leads"
**Cause:** API endpoint not working
**Fix:**
1. Check backend is running: `curl http://localhost:3001/api/leads`
2. Should return: `[{...lead1...}, {...lead2...}]`
3. If error, check backend logs

### Issue: Duplicate detection modal not showing
**Cause:** Phone number format issue or no duplicates in DB
**Fix:**
1. Use a 10-digit Indian phone (no +91, no spaces)
2. Use a phone number that EXISTS in the database
3. Check DevTools Network tab for POST request to `/api/leads/check-duplicate`

---

## Success Criteria

**Integration is successful when:**

- ✅ All 5 pages load data from API (not mock data)
- ✅ Loading spinners show during fetch
- ✅ Error handling works (try unplugging backend, should show error)
- ✅ DevTools Network tab shows all API calls to `localhost:3001`
- ✅ Lead Management displays real leads (not "Aakash/Sneha")
- ✅ Follow-up "Done" button persists to database
- ✅ Leaderboard metrics calculated from real data
- ✅ Duplicate detection checks SQLite before creating leads
- ✅ Daily Dashboard shows today's aggregates from database
- ✅ All API responses have Status 200/201

---

## Performance Notes

**Expected response times (from localhost):**
- GET /api/leads: < 100ms
- GET /api/follow-ups: < 100ms
- GET /api/tcms: < 100ms
- GET /api/dashboard/today: < 200ms
- POST /api/leads/check-duplicate: < 150ms
- PUT /api/follow-ups/:id/complete: < 100ms

**If slower:** Check backend logs, database size, or network

---

## Database Verification

To verify data is persisting to SQLite:

```bash
# Terminal (requires sqlite3 installed):
sqlite3 server/gharpayy.db

# In sqlite3 prompt:
.tables  # Should show: leads, follow_ups, tcms, tours, bookings, etc.
SELECT COUNT(*) FROM leads;  # Shows total leads
SELECT * FROM leads LIMIT 1;  # Shows sample lead
.exit
```

---

## Manual Testing Scenarios

### Scenario 1: End-to-End Lead Creation to Follow-up
1. Go to `/leads/add` → Create a new lead with duplicate check
2. Go to `/leads` → Verify new lead appears in list
3. Go to `/follow-ups` → Create a follow-up for the new lead
4. Mark follow-up as "Done" → Verify it disappears
5. Go to `/leaderboard` → Verify new lead counted in metrics
6. Go to `/dashboard-daily` → Verify new lead in "New Leads" section

### Scenario 2: Bulk Lead Import via Copy-Paste
1. Go to `/leads/add`
2. In "DirectLeadForm", paste a WhatsApp message into any field
3. Form auto-populates → Click "Save lead"
4. Verify duplicate check works
5. Verify lead appears in `/leads` list

### Scenario 3: Multi-User Sync (Optional)
1. In Terminal: Open lead list in two browser windows (side-by-side)
2. In Window A: Create a new lead and mark it done
3. In Window B: Manually refresh page
4. Verify new lead appears in Window B

---

## Support

If integration doesn't work:

1. **Check backend logs** for errors
2. **Check browser DevTools** Network tab for failed requests
3. **Verify API responses** - are they returning valid JSON?
4. **Test with curl:**
   ```bash
   curl http://localhost:3001/api/leads
   ```
5. **Check database:**
   ```bash
   sqlite3 server/gharpayy.db "SELECT COUNT(*) FROM leads;"
   ```

---

## Files Modified

7 files modified for integration:
1. `src/routes/leads.tsx` - Lead Management
2. `src/routes/follow-ups.tsx` - Follow-up Queue
3. `src/routes/leaderboard.tsx` - Leaderboard
4. `src/components/leads/DirectLeadForm.tsx` - Lead Creation with Duplicate Check
5. `src/components/leads/QuickAddLeadPanel.tsx` - Quick Lead Entry
6. `src/components/AppShell.tsx` - Navigation menu
7. `src/components/DuplicateLeadModal.tsx` - NEW Modal component

Plus 2 new files created:
- `src/hooks/use-crm-data.ts` - Helper hook for API calls
- `src/components/DuplicateLeadModal.tsx` - Duplicate warning modal

---

**Last Updated:** August 2, 2026
**Status:** ✅ Verified and Ready for Testing
