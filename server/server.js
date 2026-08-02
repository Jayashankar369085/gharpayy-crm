import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database setup
const dbPath = './gharpayy.db';
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('DB connection error:', err);
  else console.log('Connected to SQLite database');
});

// Promise wrapper for db operations
const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) {
    if (err) reject(err);
    else resolve({ id: this.lastID, changes: this.changes });
  });
});

const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) reject(err);
    else resolve(row);
  });
});

const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows || []);
  });
});

// Initialize database schema
function initializeDB() {
  db.serialize(() => {
    // TCMs table
    db.run(`
      CREATE TABLE IF NOT EXISTS tcms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        zone TEXT,
        conversionRate REAL DEFAULT 0,
        avgResponseMins INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Leads table (MAIN)
    db.run(`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        email TEXT UNIQUE,
        source TEXT,
        budget INTEGER,
        moveInDate TEXT,
        preferredArea TEXT,
        assignedTcmId TEXT,
        stage TEXT DEFAULT 'new',
        intent TEXT DEFAULT 'warm',
        confidence INTEGER DEFAULT 50,
        tags TEXT DEFAULT '[]',
        nextFollowUpAt TEXT,
        responseSpeedMins INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(assignedTcmId) REFERENCES tcms(id)
      )
    `);

    // Follow-ups table
    db.run(`
      CREATE TABLE IF NOT EXISTS follow_ups (
        id TEXT PRIMARY KEY,
        leadId TEXT NOT NULL,
        tcmId TEXT NOT NULL,
        dueAt TEXT NOT NULL,
        priority TEXT DEFAULT 'medium',
        reason TEXT,
        done INTEGER DEFAULT 0,
        completedAt TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(leadId) REFERENCES leads(id),
        FOREIGN KEY(tcmId) REFERENCES tcms(id)
      )
    `);

    // Tours table
    db.run(`
      CREATE TABLE IF NOT EXISTS tours (
        id TEXT PRIMARY KEY,
        leadId TEXT NOT NULL,
        propertyId TEXT,
        tcmId TEXT NOT NULL,
        scheduledAt TEXT NOT NULL,
        status TEXT DEFAULT 'scheduled',
        decision TEXT,
        postTourOutcome TEXT,
        postTourConfidence INTEGER,
        postTourFilledAt TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(leadId) REFERENCES leads(id),
        FOREIGN KEY(tcmId) REFERENCES tcms(id)
      )
    `);

    // Bookings table
    db.run(`
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        leadId TEXT NOT NULL,
        tourId TEXT,
        propertyId TEXT,
        tcmId TEXT NOT NULL,
        amount INTEGER NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(leadId) REFERENCES leads(id),
        FOREIGN KEY(tcmId) REFERENCES tcms(id)
      )
    `);

    // Activities table
    db.run(`
      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        leadId TEXT,
        kind TEXT NOT NULL,
        actor TEXT,
        text TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Lead Score Predictions table
    db.run(`
      CREATE TABLE IF NOT EXISTS lead_scores (
        id TEXT PRIMARY KEY,
        leadId TEXT NOT NULL,
        score REAL DEFAULT 50,
        confidence REAL DEFAULT 0,
        decayFactor REAL DEFAULT 0.95,
        objectionCounts TEXT DEFAULT '{}',
        lastUpdated TEXT DEFAULT CURRENT_TIMESTAMP,
        predictedConversion REAL DEFAULT 0.5,
        decayHistory TEXT DEFAULT '[]',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Sequence Analytics table
    db.run(`
      CREATE TABLE IF NOT EXISTS sequence_analytics (
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
        stepMetrics TEXT DEFAULT '[]',
        performance TEXT DEFAULT '{}',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Performance metrics table
    db.run(`
      CREATE TABLE IF NOT EXISTS performance_metrics (
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
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tcmId, date)
      )
    `);

    console.log('✓ Database schema initialized');
  });
}

initializeDB();

// ============ LEAD SCORE PREDICTOR API ============

/**
 * POST /api/lead-scores/predict
 * Input: { leadId, confidence, intent, responseTime, silenceHours, hasFollowUp, moveInDays }
 * Output: { leadId, score, confidence, decayRate, nextRecalcAt }
 */
app.post('/api/lead-scores/predict', (req, res) => {
  const {
    leadId,
    confidence = 50,
    intent = 'warm',
    responseTime = 10,
    silenceHours = 0,
    hasFollowUp = true,
    moveInDays = 7,
    objections = {}
  } = req.body;

  const id = uuidv4();
  let score = confidence;

  // Intent boost
  const intentMultiplier = intent === 'hot' ? 1.3 : intent === 'warm' ? 1.0 : 0.7;
  score *= intentMultiplier;

  // Response time penalty (-1 per min over 5min)
  if (responseTime > 5) {
    score -= Math.min(15, (responseTime - 5) * 0.5);
  }

  // Silence penalty (-1 per hour after 6h)
  if (silenceHours > 6) {
    score -= Math.min(25, (silenceHours - 6) * 1.5);
  }

  // Follow-up bonus
  if (hasFollowUp) {
    score += 10;
  } else {
    score -= 5;
  }

  // Move-in date urgency
  if (moveInDays < 0) {
    score -= 8; // Missed date
  } else if (moveInDays <= 3) {
    score += 12; // Urgent
  } else if (moveInDays >= 14) {
    score -= 3; // Too far
  }

  // Objection analysis
  const objectionCount = Object.keys(objections).length;
  if (objectionCount > 3) {
    score -= objectionCount * 2;
  }

  // Clamp score
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Calculate decay rate (0.95 per day means -5% daily)
  const decayFactor = 0.95;
  const predictedConversion = score / 100;

  const stmt = db.prepare(`
    INSERT INTO lead_scores (id, leadId, score, confidence, decayFactor, objectionCounts, predictedConversion)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run([id, leadId, score, confidence, decayFactor, JSON.stringify(objections), predictedConversion], (err) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'Failed to save prediction' });
    }

    res.json({
      id,
      leadId,
      score,
      confidence,
      predictedConversion: (predictedConversion * 100).toFixed(1),
      decayRate: ((1 - decayFactor) * 100).toFixed(1),
      nextRecalcAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      objectionAnalysis: {
        count: objectionCount,
        primary: Object.entries(objections).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none'
      }
    });
  });
});

/**
 * GET /api/lead-scores/:leadId
 */
app.get('/api/lead-scores/:leadId', (req, res) => {
  const { leadId } = req.params;
  db.get('SELECT * FROM lead_scores WHERE leadId = ? ORDER BY lastUpdated DESC LIMIT 1', [leadId], (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!row) return res.status(404).json({ error: 'No prediction found' });
    res.json(row);
  });
});

// ============ SEQUENCE ANALYTICS API ============

/**
 * POST /api/sequences/start
 * Input: { leadId, sequenceKind, tcmId }
 */
app.post('/api/sequences/start', (req, res) => {
  const { leadId, sequenceKind, tcmId } = req.body;
  const id = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO sequence_analytics (id, leadId, sequenceKind, startedAt, status)
    VALUES (?, ?, ?, ?, 'active')
  `);

  stmt.run([id, leadId, sequenceKind, new Date().toISOString()], (err) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'Failed to start sequence' });
    }

    res.json({
      id,
      leadId,
      sequenceKind,
      status: 'active',
      startedAt: new Date().toISOString(),
      messagesSent: 0,
      repliesReceived: 0
    });
  });
});

/**
 * POST /api/sequences/:id/record-message
 * Input: { sent: boolean, received: boolean, clicked?: boolean }
 */
app.post('/api/sequences/:id/record-message', (req, res) => {
  const { id } = req.params;
  const { sent = false, received = false, clicked = false } = req.body;

  db.get('SELECT * FROM sequence_analytics WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!row) return res.status(404).json({ error: 'Sequence not found' });

    const messagesSent = row.messagesSent + (sent ? 1 : 0);
    const repliesReceived = row.repliesReceived + (received ? 1 : 0);
    const clickRate = messagesSent > 0 ? ((row.clickRate * (messagesSent - 1) + (clicked ? 1 : 0)) / messagesSent * 100).toFixed(1) : 0;

    db.run(
      'UPDATE sequence_analytics SET messagesSent = ?, repliesReceived = ?, clickRate = ? WHERE id = ?',
      [messagesSent, repliesReceived, clickRate, id],
      (err) => {
        if (err) return res.status(500).json({ error: 'Update failed' });
        res.json({ id, messagesSent, repliesReceived, clickRate });
      }
    );
  });
});

/**
 * GET /api/sequences/:id/analytics
 */
app.get('/api/sequences/:id/analytics', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM sequence_analytics WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!row) return res.status(404).json({ error: 'Sequence not found' });

    const conversionRate = row.repliesReceived > 0 ? ((row.messagesSent > 0 ? row.repliesReceived / row.messagesSent : 0) * 100).toFixed(1) : 0;

    res.json({
      id: row.id,
      leadId: row.leadId,
      sequenceKind: row.sequenceKind,
      status: row.status,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      messagesSent: row.messagesSent,
      repliesReceived: row.repliesReceived,
      clickRate: parseFloat(row.clickRate),
      conversionRate: parseFloat(conversionRate),
      engagement: {
        replyRate: row.messagesSent > 0 ? ((row.repliesReceived / row.messagesSent) * 100).toFixed(1) : 0,
        avgTimeToReply: row.repliesReceived > 0 ? '~2h' : 'No replies yet'
      }
    });
  });
});

// ============ PERFORMANCE METRICS API ============

/**
 * POST /api/metrics/daily
 * Input: { tcmId, date, leadsProcessed, toursScheduled, bookingsCreated, avgResponseTime, slaCompliance }
 */
app.post('/api/metrics/daily', (req, res) => {
  const {
    tcmId,
    date,
    leadsProcessed = 0,
    toursScheduled = 0,
    bookingsCreated = 0,
    avgResponseTime = 0,
    avgFollowUpTime = 0,
    slaCompliance = 100
  } = req.body;

  const id = uuidv4();
  const conversionRate = toursScheduled > 0 ? (bookingsCreated / toursScheduled * 100).toFixed(1) : 0;

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO performance_metrics 
    (id, tcmId, date, leadsProcessed, toursScheduled, bookingsCreated, conversionRate, avgResponseTime, avgFollowUpTime, slaCompliance)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    [id, tcmId, date, leadsProcessed, toursScheduled, bookingsCreated, conversionRate, avgResponseTime, avgFollowUpTime, slaCompliance],
    (err) => {
      if (err) {
        console.error('DB error:', err);
        return res.status(500).json({ error: 'Failed to save metrics' });
      }

      res.json({
        id,
        tcmId,
        date,
        leadsProcessed,
        toursScheduled,
        bookingsCreated,
        conversionRate: parseFloat(conversionRate),
        avgResponseTime,
        avgFollowUpTime,
        slaCompliance
      });
    }
  );
});

/**
 * GET /api/metrics/tcm/:tcmId?days=7
 */
app.get('/api/metrics/tcm/:tcmId', (req, res) => {
  const { tcmId } = req.params;
  const days = parseInt(req.query.days || '7');
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  db.all(
    'SELECT * FROM performance_metrics WHERE tcmId = ? AND date >= ? ORDER BY date DESC',
    [tcmId, startDate],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({
        tcmId,
        period: `Last ${days} days`,
        data: rows || [],
        summary: {
          totalLeadsProcessed: rows?.reduce((s, r) => s + r.leadsProcessed, 0) || 0,
          totalToursScheduled: rows?.reduce((s, r) => s + r.toursScheduled, 0) || 0,
          totalBookingsCreated: rows?.reduce((s, r) => s + r.bookingsCreated, 0) || 0,
          avgConversionRate: rows?.length > 0 ? (rows.reduce((s, r) => s + parseFloat(r.conversionRate), 0) / rows.length).toFixed(1) : 0,
          avgSLACompliance: rows?.length > 0 ? (rows.reduce((s, r) => s + r.slaCompliance, 0) / rows.length).toFixed(1) : 0
        }
      });
    }
  );
});

// ============ HEALTH CHECK ============

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Gharpayy Backend API running on http://localhost:${PORT}`);
  console.log(`✓ Lead Score Predictor: POST /api/lead-scores/predict`);
  console.log(`✓ Sequence Analytics: POST /api/sequences/start`);
  console.log(`✓ Performance Metrics: POST /api/metrics/daily`);
});
