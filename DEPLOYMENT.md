# Gharpayy Lead Management CRM - Deployment Guide

## Overview

This is a complete 2-hour sprint deployment of the Gharpayy Lead Management CRM MVP with:
- **3 Activated Features** (already built, now live)
- **2 New Ideas** (Lead Score Predictor + Sequence Analytics)
- **Backend API** (Express.js + SQLite)

---

## 🚀 Quick Start

### Frontend Setup

```bash
# Install dependencies
npm install

# Start dev server (on port 5173)
npm run dev

# Build for production
npm run build
```

### Backend Setup

```bash
cd server

# Install backend dependencies
npm install

# Start backend (on port 3001)
npm start

# Or run in watch mode
npm run dev
```

### Environment Variables

Create `.env` in root (frontend):
```
REACT_APP_API_URL=http://localhost:3001/api
```

---

## ✅ Activated Features (LIVE)

### 1. Smart Lead Routing Engine
**Status**: ✓ Production Ready

**What it does**:
- Auto-assigns leads based on TCM zones, availability, conversion rate, and response speed
- Zone match = +40 points
- Conversion rate scoring
- Response time boost (5min = +20 pts)
- Load penalty (2pts per open lead)
- Discipline penalty (5pts per pending post-tour)
- Hot lead bonus (+15 for high converters)

**Access**: 
- Navigate to `/zone-brain` → "Zone Brain" dashboard
- View auto-rebalancing recommendations
- See real-time routing scores for all TCMs

**APIs**:
- Frontend: `src/lib/routing.ts` → `autoAssign(lead, tcms, leads, tours)`

---

### 2. Real-time Visit War Room Dashboard
**Status**: ✓ Production Ready

**What it does**:
- Live tracking of all scheduled tours with real-time status
- Priority scoring: CLOSE NOW, AT RISK, FOLLOW-UP, ON TRACK
- Booking probability calculation (2-98%)
- SLA breach detection (T-120 to T+60 checkpoints)
- Control tower alerts (critical, warn, info)
- Stage-based interventions (objection handling, pricing negotiation)

**Access**:
- Navigate to `/live-visit` → "Live Visit War Room"
- See all scheduled tours organized by priority
- Click any tour card to open full detail panel
- Action buttons: Call, WhatsApp, Location, Movement Status

**Key Components**:
- `src/components/visits/live/LiveVisitCard.tsx` - Tour cards
- `src/components/visits/live/AlertRail.tsx` - Alert notifications
- `src/lib/visits/live-engine.ts` - Priority scoring engine
- `src/lib/visits/live-store.ts` - Real-time state management

---

### 3. Gamification Leaderboard
**Status**: ✓ Production Ready

**What it does**:
- Real-time TCM performance ranking
- Conversion rate (×1.5 weight) + discipline + response time
- XP system: 25xp for post-tour, 20xp for follow-up, 25xp for first response
- Daily streaks with rollover (localStorage persisted)
- Revenue tracking per TCM
- Live badges and achievements

**Access**:
- Navigate to `/leaderboard` → "TCM Leaderboard"
- See live rankings by tier (conversion, response, discipline)
- View top closer, fastest response, highest discipline
- Click CoachWidget in AppShell to see personal XP/streak

**Key Components**:
- `src/lib/gamification.ts` - XP & streak system
- `src/routes/leaderboard.tsx` - Ranking display
- `src/components/CoachWidget.tsx` - XP widget
- `src/components/CoachPanel.tsx` - Full coach report

---

## 🆕 New Ideas (LIVE)

### 4. Lead Score Predictor
**Status**: ✓ Production Ready

**What it does**:
- AI-powered lead quality scoring (0-100)
- Confidence decay model (95% daily retention)
- Conversion probability prediction
- Objection analysis and counting
- Intelligent recommendations

**Scoring Factors**:
- Intent boost: Hot (×1.3), Warm (×1.0), Cold (×0.7)
- Response time penalty: -1 per minute over 5min
- Silence penalty: -1.5 per hour after 6 hours
- Follow-up bonus: +10 if scheduled, -5 if not
- Move-in urgency: +12 if <3 days, -8 if passed, -3 if >14 days
- Objection penalty: -2 per objection

**Backend API**:
```
POST /api/lead-scores/predict
  Input: { leadId, confidence, intent, responseTime, silenceHours, hasFollowUp, moveInDays, objections }
  Output: { id, score, confidence, predictedConversion, decayRate, nextRecalcAt, objectionAnalysis }

GET /api/lead-scores/:leadId
  Returns latest prediction for lead
```

**UI Component**: `src/components/LeadScorePredictor.tsx`
- Displays AI score with color coding
- Shows conversion probability
- Decay visualization
- Primary objection identification
- Actionable recommendations

**Usage**:
```tsx
import { LeadScorePredictor } from '@/components/LeadScorePredictor';

<LeadScorePredictor lead={lead} tours={tours} now={now} />
```

---

### 5. Intelligent Sequence Engine
**Status**: ✓ Production Ready

**What it does**:
- Automatic WhatsApp sequence orchestration
- Condition-based intelligent routing
- Real-time engagement metrics
- Performance benchmarking per sequence type

**Sequence Types**:
- `post-tour`: After tour completed (35% conv benchmark)
- `pre-decision`: Pre-booking negotiation (28% conv)
- `cold-revival`: For stale leads (5% conv)
- `first-contact`: Initial outreach (42% conv)

**Routing Rules**:
- No reply after 3 messages → Suggest `cold-revival`
- >70% engagement detected → Suggest `pre-decision`
- 2+ active replies → Suggest `post-tour`
- No reply after 5 touches → Escalate to manual

**Backend API**:
```
POST /api/sequences/start
  Input: { leadId, sequenceKind, tcmId }
  Output: { id, leadId, sequenceKind, status, startedAt }

POST /api/sequences/:id/record-message
  Input: { sent?, received?, clicked? }
  Records message engagement

GET /api/sequences/:id/analytics
  Returns: { messagesSent, repliesReceived, clickRate, conversionRate, engagement }
```

**UI Component**: `src/components/SequenceAnalyticsPanel.tsx`
- Live message counts
- Reply and click rates
- Benchmark comparison
- Intelligent routing suggestions
- Next sequence recommendations

**Usage**:
```tsx
import { SequenceAnalyticsPanel } from '@/components/SequenceAnalyticsPanel';

<SequenceAnalyticsPanel lead={lead} sequenceId={id} onRoutingChange={handleRouting} />
```

---

## 🔧 Backend API Reference

### Base URL
- Local: `http://localhost:3001/api`
- Production: `https://api.gharpayy.com/api` (configure in .env)

### Health Check
```
GET /api/health
Response: { status: "ok", timestamp, version }
```

### Lead Score Endpoints

#### Predict Lead Score
```
POST /api/lead-scores/predict
Content-Type: application/json

{
  "leadId": "lead-123",
  "confidence": 60,
  "intent": "warm",
  "responseTime": 8,
  "silenceHours": 2,
  "hasFollowUp": true,
  "moveInDays": 5,
  "objections": { "price": 1, "distance": 1 }
}

Response:
{
  "id": "pred-xyz",
  "leadId": "lead-123",
  "score": 72,
  "confidence": 60,
  "predictedConversion": "72.0",
  "decayRate": "5.0",
  "nextRecalcAt": "2026-08-03T12:34:56Z",
  "objectionAnalysis": {
    "count": 2,
    "primary": "price"
  }
}
```

#### Get Lead Score
```
GET /api/lead-scores/:leadId

Response: { full prediction object from database }
```

### Sequence Endpoints

#### Start Sequence
```
POST /api/sequences/start
{
  "leadId": "lead-123",
  "sequenceKind": "post-tour",
  "tcmId": "tcm-1"
}

Response: { id, leadId, sequenceKind, status, startedAt, messagesSent, repliesReceived }
```

#### Record Message
```
POST /api/sequences/:id/record-message
{
  "sent": true,
  "received": true,
  "clicked": false
}

Response: { id, messagesSent, repliesReceived, clickRate }
```

#### Get Analytics
```
GET /api/sequences/:id/analytics

Response: {
  "id": "seq-123",
  "leadId": "lead-456",
  "sequenceKind": "post-tour",
  "status": "active",
  "startedAt": "2026-08-02T10:00:00Z",
  "messagesSent": 3,
  "repliesReceived": 2,
  "clickRate": 66.7,
  "conversionRate": 50.0,
  "engagement": {
    "replyRate": "66.7%",
    "avgTimeToReply": "~2h"
  }
}
```

### Metrics Endpoints

#### Log Daily Performance
```
POST /api/metrics/daily
{
  "tcmId": "tcm-1",
  "date": "2026-08-02",
  "leadsProcessed": 12,
  "toursScheduled": 4,
  "bookingsCreated": 2,
  "avgResponseTime": 6,
  "avgFollowUpTime": 18,
  "slaCompliance": 95
}

Response: { id, tcmId, date, conversionRate, all metrics }
```

#### Get TCM Metrics
```
GET /api/metrics/tcm/:tcmId?days=7

Response: {
  "tcmId": "tcm-1",
  "period": "Last 7 days",
  "data": [ array of daily metrics ],
  "summary": {
    "totalLeadsProcessed": 84,
    "totalToursScheduled": 28,
    "totalBookingsCreated": 8,
    "avgConversionRate": 28.6,
    "avgSLACompliance": 94.3
  }
}
```

---

## 📊 Database Schema

### lead_scores Table
```sql
CREATE TABLE lead_scores (
  id TEXT PRIMARY KEY,
  leadId TEXT NOT NULL,
  score REAL DEFAULT 50,
  confidence REAL DEFAULT 0,
  decayFactor REAL DEFAULT 0.95,
  objectionCounts TEXT,  -- JSON
  lastUpdated TEXT,
  predictedConversion REAL DEFAULT 0.5,
  decayHistory TEXT,  -- JSON array
  createdAt TEXT
);
```

### sequence_analytics Table
```sql
CREATE TABLE sequence_analytics (
  id TEXT PRIMARY KEY,
  leadId TEXT NOT NULL,
  sequenceKind TEXT NOT NULL,
  startedAt TEXT NOT NULL,
  completedAt TEXT,
  messagesSent INTEGER DEFAULT 0,
  repliesReceived INTEGER DEFAULT 0,
  clickRate REAL DEFAULT 0,
  conversionRate REAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  stepMetrics TEXT,  -- JSON
  performance TEXT,  -- JSON
  createdAt TEXT
);
```

### performance_metrics Table
```sql
CREATE TABLE performance_metrics (
  id TEXT PRIMARY KEY,
  tcmId TEXT NOT NULL,
  date TEXT NOT NULL,
  leadsProcessed INTEGER DEFAULT 0,
  toursScheduled INTEGER DEFAULT 0,
  bookingsCreated INTEGER DEFAULT 0,
  conversionRate REAL DEFAULT 0,
  avgResponseTime REAL DEFAULT 0,
  avgFollowUpTime REAL DEFAULT 0,
  slaCompliance REAL DEFAULT 0,
  createdAt TEXT,
  UNIQUE(tcmId, date)
);
```

---

## 🧪 Testing & Verification

### Frontend Routes to Test

1. **Smart Routing** → `/zone-brain`
   - View zone-wise TCM rebalancing
   - See auto-assignment recommendations

2. **Live Visit War Room** → `/live-visit`
   - All scheduled tours with real-time priority
   - Click any tour for detail panel
   - Test alert dismissal

3. **Gamification Leaderboard** → `/leaderboard`
   - Live TCM ranking
   - See revenue and discipline scores
   - Top performers highlighted

### Backend Testing

```bash
# Health check
curl http://localhost:3001/api/health

# Test Lead Score Predictor
curl -X POST http://localhost:3001/api/lead-scores/predict \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "test-123",
    "confidence": 70,
    "intent": "hot",
    "responseTime": 3,
    "silenceHours": 0,
    "hasFollowUp": true,
    "moveInDays": 2
  }'

# Test Sequence Start
curl -X POST http://localhost:3001/api/sequences/start \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "lead-789",
    "sequenceKind": "post-tour",
    "tcmId": "tcm-1"
  }'

# Test Metrics Logging
curl -X POST http://localhost:3001/api/metrics/daily \
  -H "Content-Type: application/json" \
  -d '{
    "tcmId": "tcm-1",
    "date": "2026-08-02",
    "leadsProcessed": 10,
    "toursScheduled": 3,
    "bookingsCreated": 1,
    "avgResponseTime": 5,
    "slaCompliance": 100
  }'
```

---

## 🌐 Production Deployment

### Frontend (Vercel/Netlify)

```bash
# Build
npm run build

# Deploy built assets from dist/
```

### Backend (Railway/Heroku/AWS)

```bash
cd server
npm install
npm start

# Environment: NODE_ENV=production
# Port: $PORT (default 3001)
```

### Environment Variables

**Frontend (.env)**:
```
REACT_APP_API_URL=https://api.gharpayy.com/api
VITE_GA_ID=UA-XXX-X  # Google Analytics
```

**Backend (.env)**:
```
NODE_ENV=production
PORT=3001
DATABASE_URL=file:./gharpayy.db
CORS_ORIGIN=https://gharpayy.lovable.app
```

---

## 📈 Performance Targets

- **Lead Score Prediction**: <100ms response time
- **Sequence Analytics**: <50ms reads, <100ms writes
- **Live Visit Dashboard**: <200ms full refresh
- **API Health Check**: <50ms

---

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check port 3001 is free
netstat -an | grep 3001

# Reinstall dependencies
cd server && rm -rf node_modules && npm install

# Check SQLite permissions
ls -la gharpayy.db
```

### API Calls Failing
- Check CORS configuration in server.js
- Verify `REACT_APP_API_URL` in frontend .env
- Test health endpoint: `curl http://localhost:3001/api/health`

### Lead Score Returns Fallback
- Backend API might be down
- Check network tab in DevTools
- Ensure server is running: `npm start` in `/server`

---

## 📚 Documentation

- **Types**: `src/lib/types.ts`
- **Engine**: `src/lib/engine.ts` (SLA, confidence decay, routing)
- **Gamification**: `src/lib/gamification.ts` (XP, streaks)
- **Live Visits**: `src/lib/visits/live-engine.ts` (priority scoring)
- **APIs**: `src/lib/lead-score-api.ts`, `src/lib/sequence-analytics-api.ts`

---

## ✨ Summary

**What's Live**:
- ✓ 3 Core Features (routing, live visits, gamification)
- ✓ 2 New Ideas (lead score predictor, sequence analytics)
- ✓ Backend API with SQLite persistence
- ✓ Full frontend integration with fallback mode
- ✓ Real-time dashboards and widgets

**Ready for Production**: Yes, all features are production-ready with graceful fallbacks.

**Next Steps**: 
1. Deploy backend to production (Railway/Heroku)
2. Update `REACT_APP_API_URL` in frontend
3. Deploy frontend to production (Vercel/Netlify)
4. Monitor API performance and database size
5. Collect feedback from team

---

Generated: August 2, 2026 | Gharpayy MVP v1.0
