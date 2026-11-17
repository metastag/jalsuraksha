const http = require('http');
const app = require('../index');
const { seedDatabase } = require('../db/seed');
const { evaluateSingleReport, calculateSourceAggregateRisk } = require('../services/riskEngine');

function requestJson(serverUrl, method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const url = new URL(path, serverUrl);
    const payload = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);

    const req = http.request(
      url,
      { method, headers },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          const durationMs = Number((performance.now() - start).toFixed(2));
          let data = {};
          try {
            data = JSON.parse(raw);
          } catch (e) {
            data = { raw };
          }
          resolve({ status: res.statusCode, data, durationMs });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runValidationSuite() {
  console.log('===================================================================');
  console.log(' JalSuraksha (Group G315) Milestone-2 Validation & Benchmark Suite ');
  console.log('===================================================================');

  await seedDatabase();

  const server = app.listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const results = [];
  const record = (id, name, expected, actual, passed, latencyMs = 0) => {
    results.push({ id, name, expected, actual, passed, latencyMs });
    console.log(
      `[${passed ? 'PASS' : 'FAIL'}] ${id}: ${name} (${latencyMs}ms) -> ${actual}`
    );
  };

  try {
    // TC-01: BIS IS 10500 Safe Water Classification
    const t1Start = performance.now();
    const safeEval = evaluateSingleReport({
      report_type: 'test_reading',
      test_parameters: { ph: 7.2, tds: 310, turbidity: 0.5, coliform: false, fluoride: 0.4, arsenic: 0.001, nitrate: 12, iron: 0.1 },
    });
    record(
      'TC-01',
      'BIS IS 10500 Compliant Sample Risk Score',
      'Score = 0, Violations = 0',
      `Score = ${safeEval.score}, Violations = ${safeEval.violations.length}`,
      safeEval.score === 0 && safeEval.violations.length === 0,
      Number((performance.now() - t1Start).toFixed(2))
    );

    // TC-02: BIS IS 10500 Coliform + High Fluoride Contamination Detection
    const t2Start = performance.now();
    const unsafeEval = evaluateSingleReport({
      report_type: 'test_reading',
      test_parameters: { ph: 8.1, tds: 1850, turbidity: 6.2, coliform: true, fluoride: 1.9, arsenic: 0.005, nitrate: 52, iron: 0.4 },
    });
    record(
      'TC-02',
      'BIS IS 10500 Coliform & Fluoride Violation Scoring',
      'Score >= 75 (High Risk)',
      `Score = ${unsafeEval.score}, Violations = ${unsafeEval.violations.length}`,
      unsafeEval.score >= 75 && unsafeEval.violations.length >= 4,
      Number((performance.now() - t2Start).toFixed(2))
    );

    // TC-03: GET /api/sources Live Map Feed
    const tc3 = await requestJson(baseUrl, 'GET', '/api/sources');
    record(
      'TC-03',
      'Fetch Greater Noida Water Sources Feed (FR7)',
      'HTTP 200 & 12 seeded sources',
      `HTTP ${tc3.status}, count=${tc3.data.sources?.length}`,
      tc3.status === 200 && tc3.data.sources?.length === 12,
      tc3.durationMs
    );

    // TC-04: Spatial Haversine Duplicate Check (GET /api/sources/nearby)
    const tc4 = await requestJson(
      baseUrl,
      'GET',
      '/api/sources/nearby?lat=28.4439&lng=77.5463&radius=250'
    );
    record(
      'TC-04',
      'PostgreSQL Haversine Spatial Duplicate Detection within 250m',
      'HTTP 200 & finds Kasna Village Handpump (GN-WS-101)',
      `HTTP ${tc4.status}, match=${tc4.data.nearby?.[0]?.code} (${tc4.data.nearby?.[0]?.distance_meters}m)`,
      tc4.status === 200 && tc4.data.nearby?.[0]?.code === 'GN-WS-101',
      tc4.durationMs
    );

    // TC-05: Role-Based Login (Citizen & PHED Authority) (FR1)
    const citizenLogin = await requestJson(baseUrl, 'POST', '/api/auth/login', {
      email: 'citizen@jalsuraksha.in',
      password: 'password123',
    });
    const authLogin = await requestJson(baseUrl, 'POST', '/api/auth/login', {
      email: 'authority@jalsuraksha.in',
      password: 'password123',
    });
    record(
      'TC-05',
      'Role-Based Authentication & JWT Issuance (FR1)',
      'HTTP 200 with valid role tokens',
      `Citizen=${citizenLogin.data.user?.role}, Authority=${authLogin.data.user?.role}`,
      citizenLogin.status === 200 && authLogin.status === 200 && authLogin.data.user?.role === 'authority',
      citizenLogin.durationMs
    );

    // TC-06: Anonymous Citizen Symptom Cluster Report & Automated Alert Trigger (FR4, FR5, FR8)
    const tc6 = await requestJson(baseUrl, 'POST', '/api/reports', {
      source_id: 6, // Pari Chowk Transit Camp Community Tank
      reporter_name: 'Kiran Verma',
      report_type: 'symptom_report',
      symptom_data: {
        symptoms: ['diarrhea', 'typhoid', 'vomiting'],
        affected_count: 12,
        severity: 'severe',
      },
      visual_issues: ['sewage_smell'],
      photo_url: '/uploads/sample-evidence.jpg',
      notes: 'Cluster of acute diarrhea and fever near Pari Chowk transit camp tank.',
    });
    record(
      'TC-06',
      'Symptom Cluster Submission -> Risk Escalation & Automated Alert (FR4, FR5, FR8)',
      'HTTP 201, Source Risk Level = high, Alert Triggered',
      `HTTP ${tc6.status}, New Score=${tc6.data.source?.risk_score} (${tc6.data.source?.risk_level}), Alert=${Boolean(tc6.data.alert_triggered)}`,
      tc6.status === 201 && tc6.data.source?.risk_level === 'high' && Boolean(tc6.data.alert_triggered),
      tc6.durationMs
    );

    // TC-07: RBAC Security Enforcement (Citizen prevented from updating source treatment status)
    const tc7 = await requestJson(
      baseUrl,
      'PATCH',
      '/api/authority/sources/6/status',
      { status: 'resolved' },
      citizenLogin.data.token
    );
    record(
      'TC-07',
      'RBAC Security Check: Citizen Blocked from Authority Endpoint',
      'HTTP 403 Forbidden',
      `HTTP ${tc7.status} (${tc7.data.error})`,
      tc7.status === 403,
      tc7.durationMs
    );

    // TC-08: PHED Authority Report Verification & Source Resolution Workflow (FR6)
    const tc8 = await requestJson(
      baseUrl,
      'PATCH',
      '/api/authority/sources/6/status',
      {
        status: 'resolved',
        authority_notes: 'Emergency chlorination and tank disinfection completed by PHED squad.',
      },
      authLogin.data.token
    );
    record(
      'TC-08',
      'PHED Authority Treatment Resolution & Risk Reset (FR6)',
      'HTTP 200, Status = resolved, Risk Level = low',
      `HTTP ${tc8.status}, Status=${tc8.data.source?.status}, Risk=${tc8.data.source?.risk_score} (${tc8.data.source?.risk_level})`,
      tc8.status === 200 && tc8.data.source?.status === 'resolved' && tc8.data.source?.risk_level === 'low',
      tc8.durationMs
    );

    // Re-seed database at the end so initial demo state is clean
    await seedDatabase();
  } finally {
    server.close();
  }

  const passedCount = results.filter((r) => r.passed).length;
  console.log('-------------------------------------------------------------------');
  console.log(`Validation Summary: ${passedCount}/${results.length} Test Cases Passed`);
  console.log('===================================================================');

  if (passedCount !== results.length) {
    process.exit(1);
  }
  process.exit(0);
}

runValidationSuite().catch((err) => {
  console.error('Validation suite error:', err);
  process.exit(1);
});
