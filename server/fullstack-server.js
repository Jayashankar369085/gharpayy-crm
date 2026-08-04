import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Database
const dbPath = './gharpayy.db';
const db = new sqlite3.Database(dbPath);

// Promise wrappers
const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) {
    if (err) reject(err);
    else resolve({ lastID: this.lastID, changes: this.changes });
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

// Initialize schema
function initializeDB() {
  db.serialize(() => {
    // TCMs
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

    // Leads (with unique phone/email for duplicate detection)
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

    // Follow-ups
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

    // Tours
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

    // Bookings
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

    console.log('✓ Database schema initialized');
  });
}

initializeDB();

// ============ HEALTH CHECK ============
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ LEADS MANAGEMENT ============

/**
 * POST /api/leads
 * Create a new lead with duplicate detection
 */
app.post('/api/leads', async (req, res) => {
  try {
    const {
  name,
  phone,
  email,
  source,
  budget,
  moveInDate,
  preferredArea,
  assignedTcmId: requestAssignedTcmId
} = req.body;

const assignedTcmId = requestAssignedTcmId || "tcm-537f2c69";

    // Validate phone/email format
    if (!phone || !/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }

    // Check for duplicates
    const existingPhone = await dbGet('SELECT id FROM leads WHERE phone = ?', [phone]);
    if (existingPhone) {
      return res.status(409).json({ 
        error: 'Duplicate lead', 
        message: `Lead with phone ${phone} already exists`,
        existingLeadId: existingPhone.id
      });
    }

    if (email) {
      const existingEmail = await dbGet('SELECT id FROM leads WHERE email = ?', [email]);
      if (existingEmail) {
        return res.status(409).json({ 
          error: 'Duplicate lead', 
          message: `Lead with email ${email} already exists`,
          existingLeadId: existingEmail.id
        });
      }
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    await dbRun(
      `INSERT INTO leads (id, name, phone, email, source, budget, moveInDate, preferredArea, assignedTcmId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, phone, email, source, budget, moveInDate, preferredArea, assignedTcmId, now, now]
    );

    const lead = await dbGet('SELECT * FROM leads WHERE id = ?', [id]);
    res.status(201).json(lead);
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/leads
 * Get all leads
 */
app.get('/api/leads', async (req, res) => {
  try {
    const leads = await dbAll(`
SELECT
    l.*,
    t.name AS assignedTcmName
FROM leads l
LEFT JOIN tcms t
ON l.assignedTcmId = t.id
ORDER BY l.createdAt DESC
`);
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/leads/:id
 * Get single lead
 */
app.get('/api/leads/:id', async (req, res) => {
  try {
    const lead = await dbGet('SELECT * FROM leads WHERE id = ?', [req.params.id]);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/leads/:id
 * Update lead
 */
app.put('/api/leads/:id', async (req, res) => {
  try {
    const { name, stage, intent, confidence, nextFollowUpAt, assignedTcmId } = req.body;
    const now = new Date().toISOString();

    await dbRun(
      `UPDATE leads SET name = COALESCE(?, name), stage = COALESCE(?, stage), 
       intent = COALESCE(?, intent), confidence = COALESCE(?, confidence),
       nextFollowUpAt = COALESCE(?, nextFollowUpAt), assignedTcmId = COALESCE(?, assignedTcmId),
       updatedAt = ? WHERE id = ?`,
      [name, stage, intent, confidence, nextFollowUpAt, assignedTcmId, now, req.params.id]
    );

    const lead = await dbGet('SELECT * FROM leads WHERE id = ?', [req.params.id]);
    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/leads/:id
 * Delete lead
 */
app.delete('/api/leads/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM leads WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ FOLLOW-UPS ============

/**
 * POST /api/follow-ups
 * Create follow-up
 */
app.post('/api/follow-ups', async (req, res) => {
  try {
    const { leadId, tcmId, dueAt, priority, reason } = req.body;
    const id = uuidv4();

    await dbRun(
      `INSERT INTO follow_ups (id, leadId, tcmId, dueAt, priority, reason, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, leadId, tcmId, dueAt, priority, reason, new Date().toISOString()]
    );

    const followUp = await dbGet('SELECT * FROM follow_ups WHERE id = ?', [id]);
    res.status(201).json(followUp);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/follow-ups
 * Get all follow-ups
 */
app.get('/api/follow-ups', async (req, res) => {
  try {
    const followUps = await dbAll(
      `SELECT fu.*, l.name as leadName, t.name as tcmName 
       FROM follow_ups fu
       JOIN leads l ON fu.leadId = l.id
       JOIN tcms t ON fu.tcmId = t.id
       ORDER BY fu.dueAt ASC`
    );
    res.json(followUps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/follow-ups/overdue
 * Get overdue follow-ups
 */
app.get('/api/follow-ups/overdue', async (req, res) => {
  try {
    const now = new Date().toISOString();
    const overdue = await dbAll(
      `SELECT fu.*, l.name as leadName, t.name as tcmName 
       FROM follow_ups fu
       JOIN leads l ON fu.leadId = l.id
       JOIN tcms t ON fu.tcmId = t.id
       WHERE fu.done = 0 AND fu.dueAt < ?
       ORDER BY fu.dueAt ASC`,
      [now]
    );
    res.json(overdue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/follow-ups/:id/complete
 * Mark follow-up as complete
 */
app.put('/api/follow-ups/:id/complete', async (req, res) => {
  try {
    const now = new Date().toISOString();
    await dbRun(
      'UPDATE follow_ups SET done = 1, completedAt = ? WHERE id = ?',
      [now, req.params.id]
    );
    const followUp = await dbGet('SELECT * FROM follow_ups WHERE id = ?', [req.params.id]);
    res.json(followUp);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ TOURS ============

/**
 * POST /api/tours
 * Schedule tour
 */
app.post('/api/tours', async (req, res) => {
  try {
    const { leadId, propertyId, tcmId, scheduledAt } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    await dbRun(
      `INSERT INTO tours (id, leadId, propertyId, tcmId, scheduledAt, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, leadId, propertyId, tcmId, scheduledAt, now, now]
    );

    const tour = await dbGet('SELECT * FROM tours WHERE id = ?', [id]);
    res.status(201).json(tour);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tours
 * Get all tours
 */
app.get('/api/tours', async (req, res) => {
  try {
    const tours = await dbAll(
      `SELECT t.*, l.name as leadName, m.name as tcmName
       FROM tours t
       JOIN leads l ON t.leadId = l.id
       JOIN tcms m ON t.tcmId = m.id
       ORDER BY t.scheduledAt DESC`
    );
    res.json(tours);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/tours/:id
 * Update tour status
 */
app.put('/api/tours/:id', async (req, res) => {
  try {
    const { status, decision, postTourOutcome, postTourConfidence } = req.body;
    const now = new Date().toISOString();
    const postTourFilledAt = postTourOutcome ? now : null;

    await dbRun(
      `UPDATE tours SET status = COALESCE(?, status), decision = COALESCE(?, decision),
       postTourOutcome = COALESCE(?, postTourOutcome), postTourConfidence = COALESCE(?, postTourConfidence),
       postTourFilledAt = COALESCE(?, postTourFilledAt), updatedAt = ? WHERE id = ?`,
      [status, decision, postTourOutcome, postTourConfidence, postTourFilledAt, now, req.params.id]
    );

    const tour = await dbGet('SELECT * FROM tours WHERE id = ?', [req.params.id]);
    res.json(tour);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ BOOKINGS ============

/**
 * POST /api/bookings
 * Create booking
 */
app.post('/api/bookings', async (req, res) => {
  try {
    const { leadId, tourId, propertyId, tcmId, amount } = req.body;
    const id = uuidv4();

    await dbRun(
      `INSERT INTO bookings (id, leadId, tourId, propertyId, tcmId, amount, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, leadId, tourId, propertyId, tcmId, amount, new Date().toISOString()]
    );

    const booking = await dbGet('SELECT * FROM bookings WHERE id = ?', [id]);
    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/bookings
 * Get all bookings
 */
app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await dbAll(
      `SELECT b.*, l.name as leadName, t.name as tcmName
       FROM bookings b
       JOIN leads l ON b.leadId = l.id
       JOIN tcms t ON b.tcmId = t.id
       ORDER BY b.createdAt DESC`
    );
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ TCMs (LEADERBOARD) ============

/**
 * POST /api/tcms
 * Create TCM
 */
app.post('/api/tcms', async (req, res) => {
  try {
    const { name, email, phone, zone, conversionRate, avgResponseMins } = req.body;
    const id = `tcm-${uuidv4().slice(0, 8)}`;

    await dbRun(
      `INSERT INTO tcms (id, name, email, phone, zone, conversionRate, avgResponseMins, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, email, phone, zone, conversionRate || 0, avgResponseMins || 0, new Date().toISOString()]
    );

    const tcm = await dbGet('SELECT * FROM tcms WHERE id = ?', [id]);
    res.status(201).json(tcm);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tcms
 * Get all TCMs with performance metrics
 */
app.get('/api/tcms', async (req, res) => {
  try {
    const tcms = await dbAll('SELECT * FROM tcms ORDER BY conversionRate DESC');

    // Enrich with performance data
    const enriched = await Promise.all(tcms.map(async (tcm) => {
      const leads = await dbAll('SELECT * FROM leads WHERE assignedTcmId = ?', [tcm.id]);
      const tours = await dbAll('SELECT * FROM tours WHERE tcmId = ?', [tcm.id]);
      const bookings = await dbAll('SELECT * FROM bookings WHERE tcmId = ?', [tcm.id]);
      const bookingAmount = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);

      return {
        ...tcm,
        leadCount: leads.length,
        tourCount: tours.length,
        bookingCount: bookings.length,
        revenue: bookingAmount
      };
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ DAILY SUMMARY DASHBOARD (NEW FEATURE) ============

/**
 * GET /api/dashboard/today
 * Get today's aggregated data
 */
app.get('/api/dashboard/today', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const startISO = startOfDay.toISOString();
    const endISO = endOfDay.toISOString();

    // Today's new leads
    const newLeads = await dbAll(
      `SELECT * FROM leads WHERE createdAt >= ? AND createdAt <= ? ORDER BY createdAt DESC`,
      [startISO, endISO]
    );

    // Today's follow-ups
    const followUpsDue = await dbAll(
      `SELECT fu.*, l.name as leadName, t.name as tcmName
       FROM follow_ups fu
       JOIN leads l ON fu.leadId = l.id
       JOIN tcms t ON fu.tcmId = t.id
       WHERE DATE(fu.dueAt) = DATE(?)`,
      [startISO]
    );

    const followUpsDone = await dbAll(
      `SELECT fu.*, l.name as leadName, t.name as tcmName
       FROM follow_ups fu
       JOIN leads l ON fu.leadId = l.id
       JOIN tcms t ON fu.tcmId = t.id
       WHERE fu.done = 1 AND DATE(fu.completedAt) = DATE(?)`,
      [startISO]
    );

    // Today's tours
    const tourScheduled = await dbAll(
      `SELECT t.*, l.name as leadName, m.name as tcmName
       FROM tours t
       JOIN leads l ON t.leadId = l.id
       JOIN tcms m ON t.tcmId = m.id
       WHERE DATE(t.scheduledAt) = DATE(?)`,
      [startISO]
    );

    const toursCompleted = await dbAll(
      `SELECT t.*, l.name as leadName, m.name as tcmName
       FROM tours t
       JOIN leads l ON t.leadId = l.id
       JOIN tcms m ON t.tcmId = m.id
       WHERE t.status = 'completed' AND DATE(t.updatedAt) = DATE(?)`,
      [startISO]
    );

    // Today's bookings
    const bookings = await dbAll(
      `SELECT b.*, l.name as leadName, t.name as tcmName
       FROM bookings b
       JOIN leads l ON b.leadId = l.id
       JOIN tcms t ON b.tcmId = t.id
       WHERE DATE(b.createdAt) = DATE(?)`,
      [startISO]
    );

    const totalRevenue = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);

    res.json({
      date: today.toISOString().split('T')[0],
      summary: {
        newLeadsCount: newLeads.length,
        followUpsDueCount: followUpsDue.length,
        followUpsDoneCount: followUpsDone.length,
        toursScheduledCount: tourScheduled.length,
        toursCompletedCount: toursCompleted.length,
        bookingsCount: bookings.length,
        totalRevenue: totalRevenue
      },
      details: {
        newLeads,
        followUpsDue,
        followUpsDone,
        tourScheduled,
        toursCompleted,
        bookings
      }
    });
  } catch (error) {
    console.error('Error fetching daily summary:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/dashboard/stats
 * Quick stats card data
 */
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const startISO = startOfDay.toISOString();

    const newLeads = await dbGet(
      `SELECT COUNT(*) as count FROM leads WHERE createdAt >= ?`,
      [startISO]
    );

    const pendingFollowUps = await dbGet(
      `SELECT COUNT(*) as count FROM follow_ups WHERE done = 0 AND dueAt < ?`,
      [new Date().toISOString()]
    );

    const todaysBookings = await dbGet(
      `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as revenue FROM bookings WHERE DATE(createdAt) = DATE(?)`,
      [startISO]
    );

    const allLeads = await dbGet('SELECT COUNT(*) as count FROM leads');
    const allTours = await dbGet('SELECT COUNT(*) as count FROM tours WHERE status != "cancelled"');

    res.json({
      todayNewLeads: newLeads.count,
      pendingFollowUps: pendingFollowUps.count,
      todayBookings: todaysBookings.count,
      todayRevenue: todaysBookings.revenue,
      totalLeads: allLeads.count,
      activeTours: allTours.count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ DUPLICATE DETECTION (NEW FEATURE) ============

/**
 * POST /api/leads/check-duplicate
 * Check if lead already exists
 */
app.post('/api/leads/check-duplicate', async (req, res) => {
  try {
    const { phone, email } = req.body;
    const duplicates = [];

    if (phone) {
      const existing = await dbGet('SELECT id, name FROM leads WHERE phone = ?', [phone]);
      if (existing) {
        duplicates.push({
          field: 'phone',
          value: phone,
          existingLeadId: existing.id,
          existingLeadName: existing.name
        });
      }
    }

    if (email) {
      const existing = await dbGet('SELECT id, name FROM leads WHERE email = ?', [email]);
      if (existing) {
        duplicates.push({
          field: 'email',
          value: email,
          existingLeadId: existing.id,
          existingLeadName: existing.name
        });
      }
    }

    res.json({
      isDuplicate: duplicates.length > 0,
      duplicates: duplicates
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/leads/duplicates
 * Get all potential duplicates
 */
app.get('/api/leads/duplicates', async (req, res) => {
  try {
    // Find leads with same phone or email
    const duplicates = await dbAll(`
      SELECT 
        l1.id as leadId1, l1.name as name1, l1.phone as phone1, l1.email as email1, l1.createdAt as created1,
        l2.id as leadId2, l2.name as name2, l2.phone as phone2, l2.email as email2, l2.createdAt as created2,
        CASE WHEN l1.phone = l2.phone THEN 'phone' WHEN l1.email = l2.email THEN 'email' END as duplicateField
      FROM leads l1
      JOIN leads l2 ON (l1.phone = l2.phone OR l1.email = l2.email) AND l1.id < l2.id
      ORDER BY l1.createdAt DESC
    `);

    res.json(duplicates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✓ Gharpayy Backend API running on http://localhost:${PORT}`);
  console.log(`✓ LEADS: POST /api/leads, GET /api/leads, PUT /api/leads/:id`);
  console.log(`✓ FOLLOW-UPS: POST /api/follow-ups, GET /api/follow-ups, GET /api/follow-ups/overdue`);
  console.log(`✓ TOURS: POST /api/tours, GET /api/tours, PUT /api/tours/:id`);
  console.log(`✓ BOOKINGS: POST /api/bookings, GET /api/bookings`);
  console.log(`✓ LEADERBOARD: GET /api/tcms`);
  console.log(`✓ DAILY SUMMARY: GET /api/dashboard/today, GET /api/dashboard/stats`);
  console.log(`✓ DUPLICATE DETECTION: POST /api/leads/check-duplicate, GET /api/leads/duplicates\n`);
});
