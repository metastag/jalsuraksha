Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot "diagrams"
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

function New-DiagramCanvas($width, $height, $title, $subtitle) {
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(248, 250, 252))
    $g.FillRectangle($bgBrush, 0, 0, $width, $height)

    $titleFont = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Bold)
    $subFont = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Regular)
    $darkBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))
    $mutedBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(71, 85, 105))

    $g.DrawString($title, $titleFont, $darkBrush, 30, 18)
    $g.DrawString($subtitle, $subFont, $mutedBrush, 30, 48)
    return @{ Bmp = $bmp; G = $g }
}

function Draw-Card($g, $x, $y, $w, $h, $headerTitle, $lines, $headerR, $headerG, $headerB, $fillR, $fillG, $fillB) {
    $fillBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($fillR, $fillG, $fillB))
    $headerBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($headerR, $headerG, $headerB))
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(148, 163, 184), 2)
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(30, 41, 59))

    $g.FillRectangle($fillBrush, $x, $y, $w, $h)
    $g.FillRectangle($headerBrush, $x, $y, $w, 34)
    $g.DrawRectangle($borderPen, $x, $y, $w, $h)

    $hFont = New-Object System.Drawing.Font("Segoe UI", 10.5, [System.Drawing.FontStyle]::Bold)
    $bFont = New-Object System.Drawing.Font("Segoe UI", 9.2, [System.Drawing.FontStyle]::Regular)

    $g.DrawString($headerTitle, $hFont, $whiteBrush, ($x + 10), ($y + 7))

    $cy = $y + 42
    foreach ($line in $lines) {
        $g.DrawString($line, $bFont, $textBrush, ($x + 10), $cy)
        $cy += 20
    }
}

function Draw-Arrow($g, $x1, $y1, $x2, $y2, $label) {
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(2, 132, 199), 2.5)
    $cap = New-Object System.Drawing.Drawing2D.AdjustableArrowCap(5, 6)
    $pen.CustomEndCap = $cap
    $g.DrawLine($pen, $x1, $y1, $x2, $y2)

    if ($label -ne "") {
        $mx = [int](($x1 + $x2) / 2) - 45
        $my = [int](($y1 + $y2) / 2) - 18
        $lblFont = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Bold)
        $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255))
        $txtBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))
        $g.FillRectangle($bgBrush, $mx - 2, $my - 1, 105, 16)
        $g.DrawString($label, $lblFont, $txtBrush, $mx, $my)
    }
}

# 1. System Architecture Diagram
$c1 = New-DiagramCanvas 1260 620 "System Architecture Diagram - JalSuraksha Portal (Group G315)" "3-Tier Full-Stack Architecture: React 18 + MapLibre GL JS | Node.js + Express | Local PostgreSQL 18"
Draw-Card $c1.G 30 90 360 495 "Tier 1: Client Presentation (React + Vite)" @(
    "* Live Contamination Risk Map (FR7)",
    "  - MapLibre GL JS + OpenFreeMap Tiles",
    "  - Color-coded Risk Badges (Low/Med/High)",
    "  - GPS / Click-to-Pin Coordinate Picker",
    "",
    "* Reporting Wizard Modal (FR2, FR3, FR4)",
    "  - Citizen Symptom & Visual Cluster Form",
    "  - Tester BIS IS 10500 Field Kit Inputs",
    "  - Photo Evidence Upload",
    "",
    "* PHED Authority Dashboard (FR6)",
    "  - KPI Summary Cards & Alert Center",
    "  - Report Verification Queue",
    "  - Source Treatment Status Workflow",
    "",
    "* Role-Based Access Switcher (FR1)",
    "  - Citizen | Tester | Authority | Admin"
) 3 105 161 240 249 255

Draw-Card $c1.G 460 90 365 495 "Tier 2: Application & Risk Engine (Express)" @(
    "* REST API Gateway & RBAC Middleware",
    "  - JWT Verification & Role Guards",
    "  - Optional Auth for Anonymous Citizens",
    "  - Multer Photo Storage (/uploads)",
    "",
    "* BIS IS 10500:2012 Risk Scoring Engine (FR8)",
    "  - Evaluates pH, TDS, Turbidity, Coliform,",
    "    Fluoride, Arsenic, Nitrate, Iron",
    "  - Weights Symptom Clusters & Severity",
    "  - Computes Score (0-100) & Confidence",
    "",
    "* Spatial Duplicate Check (/sources/nearby)",
    "  - Haversine 250m Proximity Query",
    "",
    "* Automated Alert Service (FR5)",
    "  - Triggers Warning/Critical PHED Alerts",
    "  - Nodemailer Email + In-App Dispatch"
) 180 83 9 254 252 232

Draw-Card $c1.G 895 90 335 305 "Tier 3: Data Layer (PostgreSQL 18)" @(
    "* Normalized Relational + JSONB Tables:",
    "  - users (RBAC & jurisdictions)",
    "  - water_sources (coords, risk_score,",
    "    risk_level, confidence, status)",
    "  - reports (test_parameters JSONB,",
    "    symptom_data JSONB, verification)",
    "  - alerts (severity, status, timestamps)",
    "",
    "* Spatial & Status Indexes:",
    "  - idx_water_sources_coords (lat, lng)",
    "  - idx_water_sources_risk (risk, status)"
) 21 128 61 240 253 244

Draw-Card $c1.G 895 415 335 170 "External Tile & Alert Services" @(
    "* OpenFreeMap Vector Tile Server",
    "  - Keyless OpenStreetMap Vector Tiles",
    "* Nodemailer PHED Alert Dispatch",
    "  - Automated Email / Alert Log",
    "* Local Static Media Store (/uploads)"
) 109 40 217 250 245 255

Draw-Arrow $c1.G 390 230 460 230 "REST JSON/Multipart"
Draw-Arrow $c1.G 460 280 390 280 "Live Risk & Sources"
Draw-Arrow $c1.G 825 220 895 220 "SQL + JSONB"
Draw-Arrow $c1.G 825 490 895 490 "Alert Dispatch"
$c1.Bmp.Save((Join-Path $outDir "architecture.png"), [System.Drawing.Imaging.ImageFormat]::Png)

# 2. Use-Case Diagram
$c2 = New-DiagramCanvas 1260 620 "UML Use-Case Diagram - Community Water Contamination Portal (G315)" "Role-Based Actor Capabilities Across Citizen, Field Tester, PHED Authority Officer, and Admin"
Draw-Card $c2.G 35 120 230 190 "Actor: Citizen / Water User" @(
    "* View Live Risk Map (FR7)",
    "* Pin Water Source via GPS (FR2)",
    "* Submit Symptom & Visual",
    "  Contamination Report (FR4)",
    "* View BIS Parameter History",
    "  & Safety Disclaimers (FR9)"
) 2 132 199 240 249 255

Draw-Card $c2.G 35 350 230 190 "Actor: Community Tester" @(
    "* Submit BIS IS 10500 Field",
    "  Test Kit Readings (FR3)",
    "  (pH, TDS, Turbidity, E.coli,",
    "   Fluoride, Arsenic, Nitrate)",
    "* Upload Field Test Photos",
    "* Trigger High-Confidence",
    "  Risk Recalculation (FR8)"
) 13 148 136 240 253 250

Draw-Card $c2.G 365 95 520 475 "JalSuraksha Core System Use Cases" @(
    "UC-01: Register / Authenticate with Role or Report Anonymously (FR1)",
    "",
    "UC-02: Register Water Source with 250m Spatial Duplicate Check (FR2)",
    "",
    "UC-03: Submit Structured BIS IS 10500 Test & Photo Evidence (FR3)",
    "",
    "UC-04: Report Community Health Symptoms & Visual Issues (FR4)",
    "",
    "UC-05: Compute Composite BIS Risk Score & Confidence Level (FR8)",
    "",
    "UC-06: Auto-Generate & Dispatch PHED Contamination Alerts (FR5)",
    "",
    "UC-07: Verify Reports & Update Source Treatment Status (FR6)",
    "",
    "UC-08: Explore Live Color-Coded Contamination Risk Map (FR7, FR9)",
    "",
    "UC-09: Moderate Spam Reports & Manage Jurisdictions (FR10)"
) 15 23 42 255 255 255

Draw-Card $c2.G 985 120 240 190 "Actor: PHED Authority" @(
    "* Receive Automated Critical",
    "  & Warning Alerts (FR5)",
    "* Verify / Reject Pending",
    "  Reports (FR6)",
    "* Update Source Treatment",
    "  Status to Resolved (FR6)"
) 217 119 6 254 252 232

Draw-Card $c2.G 985 350 240 190 "Actor: Platform Admin" @(
    "* Moderate False or Spam",
    "  Reports (FR10)",
    "* Oversee Multi-Jurisdiction",
    "  KPIs & Alert Queues",
    "* Manage Authority Accounts"
) 124 58 237 250 245 255

Draw-Arrow $c2.G 265 210 365 210 "Reports / Views"
Draw-Arrow $c2.G 265 430 365 340 "BIS Test Data"
Draw-Arrow $c2.G 985 210 885 380 "Verifies / Treats"
Draw-Arrow $c2.G 985 430 885 480 "Moderates"
$c2.Bmp.Save((Join-Path $outDir "use_case.png"), [System.Drawing.Imaging.ImageFormat]::Png)

# 3. Data Flow Diagram (DFD Level-0 & Level-1)
$c3 = New-DiagramCanvas 1260 620 "Data Flow Diagram (DFD Level-1) - JalSuraksha Portal (Group G315)" "End-to-End Processing Pipeline from Ground Report Submission to BIS Risk Scoring and PHED Resolution"
Draw-Card $c3.G 35 100 340 210 "Process 1.0: Report & Spatial Ingestion" @(
    "* Validate GPS lat/lng coordinates",
    "* Run 250m Haversine duplicate query",
    "* Parse BIS test_parameters JSONB",
    "* Parse symptom_data & visual_issues",
    "* Save uploaded photo to /uploads"
) 3 105 161 240 249 255

Draw-Card $c3.G 460 100 340 210 "Process 2.0: BIS IS 10500 Risk Engine" @(
    "* Check Coliform, As, F, NO3, TDS, pH",
    "* Compute chemical & biological score",
    "* Add symptom cluster & severity score",
    "* Apply 1.35x verified report weight",
    "* Output risk_score (0-100) & confidence"
) 180 83 9 254 252 232

Draw-Card $c3.G 885 100 340 210 "Process 3.0: Automated Alert Engine" @(
    "* Evaluate if risk_level is Med/High",
    "* Generate Alert record in PostgreSQL",
    "* Tag Gautam Buddha Nagar PHED",
    "* Dispatch Nodemailer Email Alert",
    "* Update unread badge on Dashboard"
) 185 28 28 254 242 242

Draw-Card $c3.G 35 370 340 210 "Data Store D1: Local PostgreSQL 18" @(
    "* Table: users (role, jurisdiction)",
    "* Table: water_sources (risk, status)",
    "* Table: reports (JSONB parameters)",
    "* Table: alerts (severity, status)"
) 21 128 61 240 253 244

Draw-Card $c3.G 460 370 340 210 "Process 4.0: PHED Triage & Treatment" @(
    "* Authority verifies or rejects report",
    "* Updates status: reported -> verified",
    "  -> under_treatment -> resolved",
    "* Resolution resets active risk to Low",
    "  while preserving historical audit log"
) 109 40 217 250 245 255

Draw-Card $c3.G 885 370 340 210 "Process 5.0: Live Risk Map Renderer" @(
    "* Serve filtered sources via REST API",
    "* Render OpenFreeMap vector tiles",
    "* Color-code markers (Green/Amber/Red)",
    "* Display BIS parameter breakdown"
) 15 118 110 240 253 250

Draw-Arrow $c3.G 375 195 460 195 "Validated Input"
Draw-Arrow $c3.G 800 195 885 195 "Threshold Crossed"
Draw-Arrow $c3.G 205 310 205 370 "Store Report"
Draw-Arrow $c3.G 630 310 375 440 "Update Source Risk"
Draw-Arrow $c3.G 630 370 630 310 "Re-score on Verify"
Draw-Arrow $c3.G 800 475 885 475 "Live Map Update"
$c3.Bmp.Save((Join-Path $outDir "dfd_diagram.png"), [System.Drawing.Imaging.ImageFormat]::Png)

# 4. Entity-Relationship (ER) Diagram
$c4 = New-DiagramCanvas 1260 620 "Entity-Relationship (ER) Diagram - PostgreSQL 18 Database Schema (G315)" "Relational Integrity Across Users, Water Sources, Contamination Reports (JSONB), and Automated Alerts"
Draw-Card $c4.G 35 95 350 225 "Table: users" @(
    "PK  id : SERIAL PRIMARY KEY",
    "    name : VARCHAR(120) NOT NULL",
    "UK  email : VARCHAR(160) UNIQUE",
    "    password_hash : VARCHAR(255)",
    "    phone : VARCHAR(25)",
    "    role : VARCHAR(30) [citizen|tester|authority|admin]",
    "    jurisdiction : VARCHAR(120)",
    "    created_at : TIMESTAMPTZ"
) 30 58 138 255 255 255

Draw-Card $c4.G 35 355 350 235 "Table: alerts" @(
    "PK  id : SERIAL PRIMARY KEY",
    "FK  source_id : INT -> water_sources(id)",
    "FK  report_id : INT -> reports(id)",
    "    severity : VARCHAR(20) [warning|critical]",
    "    title : VARCHAR(200) NOT NULL",
    "    message : TEXT NOT NULL",
    "    assigned_jurisdiction : VARCHAR(120)",
    "    status : VARCHAR(30) [unread|acknowledged|resolved]",
    "    created_at, resolved_at : TIMESTAMPTZ"
) 153 27 27 255 255 255

Draw-Card $c4.G 455 95 360 495 "Table: water_sources" @(
    "PK  id : SERIAL PRIMARY KEY",
    "UK  code : VARCHAR(32) UNIQUE (GN-WS-101)",
    "    name : VARCHAR(160) NOT NULL",
    "    source_type : VARCHAR(40) [handpump|well|tank]",
    "    description : TEXT",
    "    locality : VARCHAR(140) NOT NULL",
    "    jurisdiction : VARCHAR(120) NOT NULL",
    "IDX latitude : NUMERIC(9,6) NOT NULL",
    "IDX longitude : NUMERIC(9,6) NOT NULL",
    "    risk_score : NUMERIC(5,2) DEFAULT 10.0",
    "IDX risk_level : VARCHAR(20) [low|medium|high]",
    "    confidence_level : VARCHAR(20) [low|med|high]",
    "IDX status : VARCHAR(30) [reported|verified|...]",
    "    latest_parameters : JSONB (BIS IS 10500)",
    "    authority_notes : TEXT",
    "    last_tested_at : TIMESTAMPTZ",
    "    updated_at, created_at : TIMESTAMPTZ"
) 6 95 70 255 255 255

Draw-Card $c4.G 880 95 350 495 "Table: reports" @(
    "PK  id : SERIAL PRIMARY KEY",
    "FK  source_id : INT -> water_sources(id)",
    "FK  user_id : INT -> users(id) NULLABLE",
    "    reporter_name : VARCHAR(120)",
    "    reporter_phone : VARCHAR(30)",
    "    reporter_role : VARCHAR(30)",
    "    report_type : VARCHAR(40)",
    "    test_parameters : JSONB (pH, TDS, As, F...)",
    "    symptom_data : JSONB (symptoms[], count)",
    "    visual_issues : JSONB",
    "    notes : TEXT",
    "    photo_url : VARCHAR(255)",
    "    calculated_report_risk : NUMERIC(5,2)",
    "    verification_status : VARCHAR(30)",
    "FK  verified_by : INT -> users(id)",
    "    authority_remark : TEXT",
    "    created_at : TIMESTAMPTZ"
) 3 105 161 255 255 255

Draw-Arrow $c4.G 385 180 880 180 "1 : N submits"
Draw-Arrow $c4.G 815 300 880 300 "1 : N has reports"
Draw-Arrow $c4.G 455 460 385 460 "1 : N triggers"
$c4.Bmp.Save((Join-Path $outDir "er_diagram.png"), [System.Drawing.Imaging.ImageFormat]::Png)

Write-Output "Successfully generated all 4 PNG diagrams in $outDir"
