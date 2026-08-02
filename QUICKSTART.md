# 🚀 Gharpayy CRM - Quick Start Guide (5 Minutes)

## ⚡ Start in 60 Seconds

### Terminal 1: Backend API
```bash
cd server
npm install
npm start
```
✓ Backend running on `http://localhost:3001`

### Terminal 2: Frontend
```bash
npm install
npm run dev
```
✓ App running on `http://localhost:5173`

### Open Browser
```
http://localhost:5173
```

---

## 🎯 What to See

### 1. Smart Lead Routing
**Menu → Lead Mgmt → Zones (HR Tower)**
- See auto-routing recommendations
- Zone-wise team rebalancing
- Live TCM capacity view

### 2. Real-Time Visit War Room
**Menu → Daily Run → Live Visit War Room**
- All scheduled tours with priority flags
- RED = CLOSE NOW, ORANGE = AT RISK
- Click any tour for full detail panel
- Action buttons: Call, WhatsApp, Share Location

### 3. Gamification Leaderboard
**Menu → Admin → Leaderboard**
- Live TCM rankings
- Conversion %, Discipline, Response time
- See your XP in top-right corner

### 4. Lead Score Predictor
Integrated in Lead details panel:
- Shows AI-powered lead quality score (0-100)
- Conversion probability
- Decay rate visualization
- Primary objections

### 5. Sequence Analytics
In Lead detail panel → Sequence tab:
- Messages sent/received
- Engagement metrics
- Intelligent routing suggestions
- Performance vs. benchmarks

---

## 🧪 Test Endpoints (Backend)

### Health Check
```bash
curl http://localhost:3001/api/health
```
Expected: `{ "status": "ok", ... }`

### Predict Lead Score
```bash
curl -X POST http://localhost:3001/api/lead-scores/predict \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "test-123",
    "confidence": 75,
    "intent": "hot",
    "responseTime": 3,
    "silenceHours": 0,
    "hasFollowUp": true,
    "moveInDays": 2
  }'
```
Expected: `{ "id": "...", "score": 92, "predictedConversion": "92.0", ... }`

### Start Sequence
```bash
curl -X POST http://localhost:3001/api/sequences/start \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "lead-456",
    "sequenceKind": "post-tour",
    "tcmId": "tcm-1"
  }'
```
Expected: `{ "id": "...", "status": "active", ... }`

---

## 📊 Feature Map

| Feature | Menu Path | API |
|---------|-----------|-----|
| **Smart Routing** | Lead Mgmt → Zones | `src/lib/routing.ts` |
| **Live Visits** | Daily Run → Live Visit War Room | `/api/sequences/*` |
| **Leaderboard** | Admin → Leaderboard | `src/lib/gamification.ts` |
| **Lead Score** | (In Lead Panel) | `/api/lead-scores/*` |
| **Sequences** | (In Lead Panel) | `/api/sequences/*` |

---

## ⚙️ Configuration

### Change Backend Port
```bash
cd server
PORT=3002 npm start
```
Then update frontend:
```
REACT_APP_API_URL=http://localhost:3002/api
```

### Use Production API
```
REACT_APP_API_URL=https://api.gharpayy.com/api
```

### Reset Database
```bash
rm server/gharpayy.db
npm start  # Recreates schema
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3001 in use | `PORT=3002 npm start` |
| API calls fail | Check backend is running: `curl http://localhost:3001/api/health` |
| No data showing | Fallback mode active. Check console for errors. |
| Database error | `rm server/gharpayy.db` and restart backend |
| Slow dashboard | Clear browser cache: `Ctrl+Shift+Delete` |

---

## 📚 Documentation

- **Full Setup**: `DEPLOYMENT.md`
- **Feature Checklist**: `FEATURES_CHECKLIST.md`
- **MVP Overview**: `MVP_SUMMARY.md`
- **API Reference**: `DEPLOYMENT.md` (section: Backend API Reference)

---

## 🎓 Code Examples

### Using Lead Score in React
```tsx
import { LeadScorePredictor } from '@/components/LeadScorePredictor';

export function MyComponent({ lead }) {
  return (
    <LeadScorePredictor 
      lead={lead}
      tours={tours}
      now={Date.now()}
      compact={false}
    />
  );
}
```

### Using Sequences
```tsx
import { SequenceAnalyticsPanel } from '@/components/SequenceAnalyticsPanel';

export function MyComponent({ lead }) {
  return (
    <SequenceAnalyticsPanel 
      lead={lead}
      sequenceId={id}
      onRoutingChange={(next, reason) => console.log(next)}
    />
  );
}
```

### Calling APIs Directly
```tsx
import { predictLeadScore } from '@/lib/lead-score-api';

const pred = await predictLeadScore({
  leadId: lead.id,
  confidence: lead.confidence,
  intent: lead.intent,
});

console.log(`Score: ${pred.score}%`);
```

---

## ✅ What's Working

- ✅ Smart lead routing with explanation
- ✅ Live visit tracking with priorities
- ✅ Real-time leaderboard
- ✅ AI lead scoring
- ✅ Sequence analytics
- ✅ Backend API with SQLite
- ✅ All fallbacks active
- ✅ Production-ready code

---

## 🚀 Deploy to Production

### Option 1: Vercel (Frontend) + Railway (Backend)
```bash
# Frontend
vercel deploy --prod

# Backend
railway up
```

### Option 2: Netlify + Heroku
```bash
# Frontend
netlify deploy --prod

# Backend
git push heroku main
```

---

## 🎯 Next Actions

1. **Today**: Verify all features working locally
2. **Tomorrow**: Deploy backend to production
3. **Day 3**: Deploy frontend with production API URL
4. **Day 4**: Gather team feedback
5. **Day 5**: Plan Phase 2 features

---

## 📞 Need Help?

| Issue | File |
|-------|------|
| API errors | Check `DEPLOYMENT.md` → Troubleshooting |
| Feature not working | See `FEATURES_CHECKLIST.md` |
| Deployment | Read `DEPLOYMENT.md` → Production Deployment |
| Code integration | Review `MVP_SUMMARY.md` → Usage Examples |

---

**Ready to go live? Let's do this! 🚀**

Duration: ~2 hours | Status: COMPLETE | Version: 1.0.0
