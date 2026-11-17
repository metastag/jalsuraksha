const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { evaluateSingleReport, calculateSourceAggregateRisk } = require('../services/riskEngine');

async function seedDatabase() {
  console.log('[Seed] Verifying local PostgreSQL 18 database...');
  await db.ensureDatabaseExists();

  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await db.query(schemaSql);

  // Clear existing rows for clean reproducible seeding
  await db.query('TRUNCATE TABLE alerts, reports, water_sources, users RESTART IDENTITY CASCADE');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Seed Users across all 4 roles (FR1)
  const usersData = [
    {
      name: 'Ramesh Kumar (Citizen)',
      email: 'citizen@jalsuraksha.in',
      phone: '+91-9810452101',
      role: 'citizen',
      jurisdiction: 'Gautam Buddha Nagar (Greater Noida)',
    },
    {
      name: 'Abhibhav Sharma (Field Tester)',
      email: 'tester@jalsuraksha.in',
      phone: '+91-9818230416',
      role: 'tester',
      jurisdiction: 'Gautam Buddha Nagar (Greater Noida)',
    },
    {
      name: 'Er. Shivam Upmanyu (PHED Nodal Officer)',
      email: 'authority@jalsuraksha.in',
      phone: '+91-9910403000',
      role: 'authority',
      jurisdiction: 'Gautam Buddha Nagar (Greater Noida)',
    },
    {
      name: 'G315 Platform Admin',
      email: 'admin@jalsuraksha.in',
      phone: '+91-9811000315',
      role: 'admin',
      jurisdiction: 'All Jurisdictions (Uttar Pradesh / NCR)',
    },
  ];

  const insertedUsers = {};
  for (const u of usersData) {
    const res = await db.query(
      `INSERT INTO users (name, email, password_hash, phone, role, jurisdiction)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [u.name, u.email, passwordHash, u.phone, u.role, u.jurisdiction]
    );
    insertedUsers[u.role] = res.rows[0];
  }
  console.log('[Seed] Seeded 4 role-based accounts (password: password123)');

  // 2. Seed 12 Water Sources around Greater Noida / Gautam Buddha Nagar
  const sourcesSeed = [
    {
      code: 'GN-WS-101',
      name: 'Kasna Village Main Mark-II Handpump',
      source_type: 'handpump',
      description: 'Public India Mark-II handpump near Kasna primary school and market lane, heavily used by 85+ households.',
      locality: 'Kasna Village, Greater Noida',
      latitude: 28.4438,
      longitude: 77.5462,
      status: 'verified',
      authority_notes: 'Field sample confirmed coliform contamination due to nearby open drain seepage. Warning board installed; chlorination team scheduled.',
      reports: [
        {
          user_role: 'tester',
          reporter_name: 'Abhibhav Sharma (Field Tester)',
          report_type: 'test_reading',
          test_parameters: { ph: 7.9, tds: 1480, turbidity: 6.8, coliform: true, fluoride: 1.2, arsenic: 0.004, nitrate: 58, iron: 0.45 },
          symptom_data: {},
          visual_issues: ['turbid_muddy', 'sewage_smell'],
          notes: 'H2S strip test turned black within 18 hours indicating faecal coliform presence. Nitrate also exceeds BIS 45 mg/L limit.',
          verification_status: 'verified',
        },
        {
          user_role: 'citizen',
          reporter_name: 'Sunita Devi',
          report_type: 'symptom_report',
          test_parameters: {},
          symptom_data: { symptoms: ['diarrhea', 'vomiting', 'stomach_cramps'], affected_count: 11, severity: 'severe' },
          visual_issues: ['sewage_smell', 'yellow_brown_color'],
          notes: 'Over 10 children and elderly residents in Kasna lane 3 suffered acute gastroenteritis over the last 4 days after drinking from this pump.',
          verification_status: 'verified',
        },
      ],
    },
    {
      code: 'GN-WS-102',
      name: 'Techzone-II Labour Settlement Handpump (Near Bennett Univ)',
      source_type: 'handpump',
      description: 'Shallow bore handpump outside construction workers settlement near Dabra-Techzone-II road.',
      locality: 'Techzone-II / Dabra, Greater Noida',
      latitude: 28.4508,
      longitude: 77.5844,
      status: 'reported',
      authority_notes: null,
      reports: [
        {
          user_role: 'tester',
          reporter_name: 'Abhibhav Sharma (Field Tester)',
          report_type: 'test_reading',
          test_parameters: { ph: 8.6, tds: 2340, turbidity: 4.2, coliform: false, fluoride: 1.85, arsenic: 0.008, nitrate: 49, iron: 0.62 },
          symptom_data: {},
          visual_issues: ['metallic_chemical_taste'],
          notes: 'Community outreach field kit test: High TDS (2340 mg/L > 2000 BIS permissible) and elevated Fluoride (1.85 mg/L > 1.5 BIS limit).',
          verification_status: 'pending',
        },
        {
          user_role: 'citizen',
          reporter_name: 'Mukesh Paswan',
          report_type: 'symptom_report',
          test_parameters: {},
          symptom_data: { symptoms: ['fluorosis', 'stomach_cramps'], affected_count: 6, severity: 'moderate' },
          visual_issues: ['metallic_chemical_taste'],
          notes: 'Water tastes salty and metallic; white crust forms on utensils and several families complain of joint stiffness and stomach pain.',
          verification_status: 'pending',
        },
      ],
    },
    {
      code: 'GN-WS-103',
      name: 'Dankaur Ward-4 Open Masonry Well',
      source_type: 'well',
      description: 'Historical open community well near Dankaur bus stand used for domestic water when supply is erratic.',
      locality: 'Dankaur Town, Gautam Buddha Nagar',
      latitude: 28.3512,
      longitude: 77.5541,
      status: 'under_treatment',
      authority_notes: 'PHED team dispatched on 15 Nov. Super-chlorination and parapet wall repair currently in progress.',
      reports: [
        {
          user_role: 'tester',
          reporter_name: 'Abhibhav Sharma (Field Tester)',
          report_type: 'test_reading',
          test_parameters: { ph: 7.4, tds: 920, turbidity: 8.5, coliform: true, fluoride: 0.8, arsenic: 0.002, nitrate: 64, iron: 0.35 },
          symptom_data: {},
          visual_issues: ['turbid_muddy', 'foul_odor'],
          notes: 'High turbidity (8.5 NTU) and positive coliform test after recent unseasonal runoff.',
          verification_status: 'verified',
        },
        {
          user_role: 'citizen',
          reporter_name: 'Harish Bhati',
          report_type: 'symptom_report',
          test_parameters: {},
          symptom_data: { symptoms: ['typhoid', 'jaundice', 'diarrhea'], affected_count: 8, severity: 'severe' },
          visual_issues: ['foul_odor'],
          notes: 'Multiple fever and jaundice cases diagnosed at local clinic among households drawing water from Ward-4 well.',
          verification_status: 'verified',
        },
      ],
    },
    {
      code: 'GN-WS-104',
      name: 'Ecotech-III Industrial Belt Borewell Pump',
      source_type: 'handpump',
      description: 'Roadside deep borewell handpump serving factory workers and roadside stalls in Ecotech-III.',
      locality: 'Ecotech-III, Greater Noida',
      latitude: 28.5325,
      longitude: 77.4792,
      status: 'verified',
      authority_notes: 'Industrial effluent leaching suspected. Urgent sample sent to UP Jal Nigam Regional Lab.',
      reports: [
        {
          user_role: 'tester',
          reporter_name: 'Abhibhav Sharma (Field Tester)',
          report_type: 'test_reading',
          test_parameters: { ph: 6.1, tds: 2650, turbidity: 5.9, coliform: false, fluoride: 1.4, arsenic: 0.038, nitrate: 72, iron: 1.45 },
          symptom_data: {},
          visual_issues: ['yellow_brown_color', 'metallic_chemical_taste'],
          notes: 'Arsenic measured at 0.038 mg/L ( nearly 4x BIS acceptable limit of 0.01 mg/L) and Iron at 1.45 mg/L with acidic pH 6.1.',
          verification_status: 'verified',
        },
      ],
    },
    {
      code: 'GN-WS-105',
      name: 'Knowledge Park-III Public Standpost Tank',
      source_type: 'tank',
      description: 'Municipal overhead PVC drinking water kiosk near KP-III hostel enclave.',
      locality: 'Knowledge Park-III, Greater Noida',
      latitude: 28.4731,
      longitude: 77.4915,
      status: 'resolved',
      authority_notes: 'Tank cleaned, UV + chlorination dosing unit serviced, and post-treatment test confirmed BIS IS 10500 compliance.',
      reports: [
        {
          user_role: 'tester',
          reporter_name: 'Abhibhav Sharma (Field Tester)',
          report_type: 'test_reading',
          test_parameters: { ph: 7.3, tds: 340, turbidity: 0.6, coliform: false, fluoride: 0.5, arsenic: 0.001, nitrate: 14, iron: 0.08 },
          symptom_data: {},
          visual_issues: [],
          notes: 'Post-cleaning verification test: all parameters well within BIS IS 10500 acceptable limits.',
          verification_status: 'resolved',
        },
      ],
    },
    {
      code: 'GN-WS-106',
      name: 'Pari Chowk Transit Camp Community Tank',
      source_type: 'tank',
      description: ' Stationary 5000L community water storage tank near Pari Chowk metro bus feeder point.',
      locality: 'Pari Chowk, Greater Noida',
      latitude: 28.4651,
      longitude: 77.5134,
      status: 'reported',
      authority_notes: null,
      reports: [
        {
          user_role: 'tester',
          reporter_name: 'Abhibhav Sharma (Field Tester)',
          report_type: 'test_reading',
          test_parameters: { ph: 7.8, tds: 1120, turbidity: 2.9, coliform: false, fluoride: 1.15, arsenic: 0.003, nitrate: 36, iron: 0.42 },
          symptom_data: {},
          visual_issues: ['turbid_muddy'],
          notes: 'Moderate TDS (1120 mg/L) and Turbidity (2.9 NTU). Needs sediment flushing and filter replacement.',
          verification_status: 'pending',
        },
      ],
    },
    {
      code: 'GN-WS-107',
      name: 'Surajpur Basti Handpump #2',
      source_type: 'handpump',
      description: 'Community handpump located near Surajpur market road.',
      locality: 'Surajpur, Greater Noida',
      latitude: 28.5114,
      longitude: 77.5018,
      status: 'under_treatment',
      authority_notes: 'Pipe joint leakage near storm drain identified. Repair crew assigned.',
      reports: [
        {
          user_role: 'citizen',
          reporter_name: 'Ramesh Kumar (Citizen)',
          report_type: 'symptom_report',
          test_parameters: {},
          symptom_data: { symptoms: ['diarrhea', 'stomach_cramps'], affected_count: 5, severity: 'moderate' },
          visual_issues: ['pipe_leakage_drain', 'foul_odor'],
          notes: 'Drain water overflowing near the base platform of the handpump; 5 people in nearby houses reported stomach infection.',
          verification_status: 'verified',
        },
      ],
    },
    {
      code: 'GN-WS-108',
      name: 'Beta-I Community Park Treated Water Standpost',
      source_type: 'tank',
      description: 'GNIDA treated water supply standpost with RO/UV filtration unit.',
      locality: 'Sector Beta-I, Greater Noida',
      latitude: 28.4785,
      longitude: 77.5260,
      status: 'verified',
      authority_notes: 'Routine monthly inspection passed.',
      reports: [
        {
          user_role: 'tester',
          reporter_name: 'Abhibhav Sharma (Field Tester)',
          report_type: 'test_reading',
          test_parameters: { ph: 7.2, tds: 285, turbidity: 0.4, coliform: false, fluoride: 0.4, arsenic: 0.0, nitrate: 11, iron: 0.05 },
          symptom_data: {},
          visual_issues: [],
          notes: 'Safe drinking water meeting all BIS IS 10500 acceptable thresholds.',
          verification_status: 'verified',
        },
      ],
    },
    {
      code: 'GN-WS-109',
      name: 'Dadri Railway Road Ward-7 Handpump',
      source_type: 'handpump',
      description: 'High-traffic public handpump near Dadri railway station approach road.',
      locality: 'Dadri, Gautam Buddha Nagar',
      latitude: 28.5504,
      longitude: 77.5562,
      status: 'reported',
      authority_notes: null,
      reports: [
        {
          user_role: 'tester',
          reporter_name: 'Abhibhav Sharma (Field Tester)',
          report_type: 'test_reading',
          test_parameters: { ph: 8.2, tds: 1690, turbidity: 3.8, coliform: false, fluoride: 1.38, arsenic: 0.006, nitrate: 44, iron: 0.58 },
          symptom_data: {},
          visual_issues: ['yellow_brown_color', 'metallic_chemical_taste'],
          notes: 'Elevated iron (0.58 mg/L) causing reddish-yellow staining and high TDS (1690 mg/L).',
          verification_status: 'pending',
        },
      ],
    },
    {
      code: 'GN-WS-110',
      name: 'Bilaspur Mandi Community Open Well',
      source_type: 'well',
      description: 'Rural masonry well adjacent to Bilaspur agricultural mandi.',
      locality: 'Bilaspur, Gautam Buddha Nagar',
      latitude: 28.3895,
      longitude: 77.6112,
      status: 'reported',
      authority_notes: null,
      reports: [
        {
          user_role: 'tester',
          reporter_name: 'Abhibhav Sharma (Field Tester)',
          report_type: 'test_reading',
          test_parameters: { ph: 7.7, tds: 1310, turbidity: 3.1, coliform: false, fluoride: 1.1, arsenic: 0.005, nitrate: 68, iron: 0.28 },
          symptom_data: {},
          visual_issues: ['turbid_muddy'],
          notes: 'Fertilizer runoff suspected: Nitrate is 68 mg/L (exceeds BIS 45 mg/L limit).',
          verification_status: 'verified',
        },
      ],
    },
    {
      code: 'GN-WS-111',
      name: 'Alpha-II Market Public Drinking Water Kiosk',
      source_type: 'tank',
      description: 'Stainless steel community water ATM and tap station in Alpha-II commercial market.',
      locality: 'Sector Alpha-II, Greater Noida',
      latitude: 28.4862,
      longitude: 77.5195,
      status: 'verified',
      authority_notes: 'Verified safe by PHED testing squad.',
      reports: [
        {
          user_role: 'tester',
          reporter_name: 'Abhibhav Sharma (Field Tester)',
          report_type: 'test_reading',
          test_parameters: { ph: 7.1, tds: 240, turbidity: 0.3, coliform: false, fluoride: 0.35, arsenic: 0.0, nitrate: 9, iron: 0.04 },
          symptom_data: {},
          visual_issues: [],
          notes: 'All parameters within BIS IS 10500 acceptable limits.',
          verification_status: 'verified',
        },
      ],
    },
    {
      code: 'GN-WS-112',
      name: 'Rabupura Rural Cluster Handpump #9',
      source_type: 'handpump',
      description: 'Deep mark-II handpump serving Rabupura village eastern hamlet.',
      locality: 'Rabupura, Gautam Buddha Nagar',
      latitude: 28.2564,
      longitude: 77.5988,
      status: 'verified',
      authority_notes: 'Fluoride mitigation defluoridation attachment recommended.',
      reports: [
        {
          user_role: 'tester',
          reporter_name: 'Abhibhav Sharma (Field Tester)',
          report_type: 'test_reading',
          test_parameters: { ph: 8.4, tds: 1890, turbidity: 2.1, coliform: false, fluoride: 1.92, arsenic: 0.007, nitrate: 41, iron: 0.32 },
          symptom_data: { symptoms: ['fluorosis'], affected_count: 9, severity: 'moderate' },
          visual_issues: ['metallic_chemical_taste'],
          notes: 'High groundwater fluoride (1.92 mg/L > 1.5 mg/L BIS maximum permissible) with visible dental mottling in village children.',
          verification_status: 'verified',
        },
      ],
    },
  ];

  let totalReportsCount = 0;
  let totalAlertsCount = 0;

  for (const s of sourcesSeed) {
    const insertSourceRes = await db.query(
      `INSERT INTO water_sources (
         code, name, source_type, description, locality, jurisdiction,
         latitude, longitude, status, authority_notes, last_tested_at
       )
       VALUES ($1, $2, $3, $4, $5, 'Gautam Buddha Nagar (Greater Noida)', $6, $7, $8, $9, CURRENT_TIMESTAMP - INTERVAL '2 days')
       RETURNING *`,
      [s.code, s.name, s.source_type, s.description, s.locality, s.latitude, s.longitude, s.status, s.authority_notes]
    );

    const sourceRow = insertSourceRes.rows[0];
    const insertedReportsForSource = [];

    for (const r of s.reports) {
      const evalSingle = evaluateSingleReport(r);
      const userObj = insertedUsers[r.user_role] || insertedUsers.citizen;

      const repRes = await db.query(
        `INSERT INTO reports (
           source_id, user_id, reporter_name, reporter_phone, reporter_role,
           report_type, test_parameters, symptom_data, visual_issues,
           notes, calculated_report_risk, verification_status, verified_by
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
          sourceRow.id,
          userObj.id,
          r.reporter_name,
          userObj.phone,
          r.user_role,
          r.report_type,
          JSON.stringify(r.test_parameters || {}),
          JSON.stringify(r.symptom_data || {}),
          JSON.stringify(r.visual_issues || []),
          r.notes,
          evalSingle.score,
          r.verification_status,
          r.verification_status === 'verified' || r.verification_status === 'resolved'
            ? insertedUsers.authority.id
            : null,
        ]
      );
      insertedReportsForSource.push(repRes.rows[0]);
      totalReportsCount++;
    }

    // Calculate aggregate risk score for this source
    const agg = calculateSourceAggregateRisk(insertedReportsForSource, s.status);

    await db.query(
      `UPDATE water_sources
       SET risk_score = $1,
           risk_level = $2,
           confidence_level = $3,
           latest_parameters = $4
       WHERE id = $5`,
      [agg.risk_score, agg.risk_level, agg.confidence_level, JSON.stringify(agg.latest_parameters || {}), sourceRow.id]
    );

    // Create automated alerts for medium & high risk sources
    if (agg.risk_level === 'high' || agg.risk_level === 'medium') {
      const severity = agg.risk_level === 'high' ? 'critical' : 'warning';
      const alertStatus = s.status === 'under_treatment' ? 'acknowledged' : 'unread';
      const violationText = agg.violations.slice(0, 3).join('; ');
      const title =
        severity === 'critical'
          ? `CRITICAL CONTAMINATION ALERT: ${s.name}`
          : `Elevated Risk Warning: ${s.name}`;
      const message = `Source [${s.code}] in ${s.locality} scored ${agg.risk_score}/100 (${agg.risk_level.toUpperCase()} risk, ${agg.confidence_level} confidence). Findings: ${violationText || 'Multiple contamination indicators'}.`;

      await db.query(
        `INSERT INTO alerts (source_id, report_id, severity, title, message, assigned_jurisdiction, status)
         VALUES ($1, $2, $3, $4, $5, 'Gautam Buddha Nagar (Greater Noida)', $6)`,
        [sourceRow.id, insertedReportsForSource[0].id, severity, title, message, alertStatus]
      );
      totalAlertsCount++;
    }
  }

  console.log(
    `[Seed] Successfully populated ${sourcesSeed.length} Greater Noida water sources, ${totalReportsCount} reports, and ${totalAlertsCount} automated PHED alerts.`
  );
}

async function initAndSeedIfEmpty() {
  console.log('[DB] Checking PostgreSQL schema and initial dataset...');
  try {
    await db.ensureDatabaseExists();
  } catch (err) {
    // Database may already exist inside Docker container (created via POSTGRES_DB)
  }

  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await db.query(schemaSql);

  const countRes = await db.query('SELECT COUNT(*)::int AS cnt FROM water_sources');
  const existingCount = countRes.rows[0]?.cnt || 0;
  if (existingCount > 0) {
    console.log(`[DB] Database already initialized with ${existingCount} water sources. Preserving existing data.`);
    return;
  }

  console.log('[DB] Empty database detected — running initial Greater Noida seed...');
  await seedDatabase();
}

if (require.main === module) {
  const onlyIfEmpty = process.argv.includes('--if-empty');
  const runner = onlyIfEmpty ? initAndSeedIfEmpty : seedDatabase;
  runner()
    .then(() => {
      console.log('[Seed] Database initialization complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed] Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase, initAndSeedIfEmpty };
