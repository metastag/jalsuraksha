const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const app = require('../backend/src/index');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT_DIR = path.join(__dirname, 'screenshots');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function captureAllScreenshots() {
  const server = app.listen(5055, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  const baseUrl = 'http://127.0.0.1:5055';
  console.log(`[Screenshots] Live MVP server started on ${baseUrl}`);

  const targets = [
    {
      file: '1_live_risk_map.png',
      url: `${baseUrl}/?view=map`,
      budget: 7000,
    },
    {
      file: '2_source_detail_drawer.png',
      url: `${baseUrl}/?view=map&source=1`,
      budget: 7000,
    },
    {
      file: '3_citizen_symptom_modal.png',
      url: `${baseUrl}/?view=map&modal=report_citizen`,
      budget: 5000,
    },
    {
      file: '4_tester_bis_modal.png',
      url: `${baseUrl}/?view=map&modal=report_tester`,
      budget: 5000,
    },
    {
      file: '5_authority_dashboard_alerts.png',
      url: `${baseUrl}/?view=dashboard&subtab=alerts`,
      budget: 4500,
    },
    {
      file: '6_authority_status_workflow.png',
      url: `${baseUrl}/?view=dashboard&subtab=sources`,
      budget: 4500,
    },
  ];

  const tempProfile = path.join(__dirname, 'edge_temp_profile');
  if (!fs.existsSync(tempProfile)) {
    fs.mkdirSync(tempProfile, { recursive: true });
  }

  try {
    for (const t of targets) {
      const outPath = path.join(OUT_DIR, t.file);
      console.log(`[Screenshots] Capturing ${t.file} from ${t.url}...`);
      execFileSync(
        EDGE_PATH,
        [
          '--headless=new',
          '--disable-gpu',
          '--no-first-run',
          '--no-default-browser-check',
          `--user-data-dir=${tempProfile}`,
          '--hide-scrollbars',
          '--window-size=1440,900',
          `--virtual-time-budget=${t.budget}`,
          `--screenshot=${outPath}`,
          t.url,
        ],
        { stdio: 'ignore' }
      );
      console.log(`[Screenshots] Saved ${outPath}`);
    }
  } finally {
    server.close();
    try {
      fs.rmSync(tempProfile, { recursive: true, force: true });
    } catch (e) {}
  }
}

captureAllScreenshots()
  .then(() => {
    console.log('[Screenshots] All 6 live MVP screenshots captured successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[Screenshots] Error:', err);
    process.exit(1);
  });
