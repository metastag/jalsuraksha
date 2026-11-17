"""
Generates high-resolution architectural, UML Use-Case, DFD (Level-0 & Level-1),
Sequence, and Entity-Relationship (ER) diagrams for the Group G315 Milestone-2 Report.
"""
import os
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = os.path.join(os.path.dirname(__file__), 'diagrams')
os.makedirs(OUT_DIR, exist_ok=True)


def get_font(size=16, bold=False):
    candidates = [
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\calibrib.ttf" if bold else r"C:\Windows\Fonts\calibri.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def draw_box(draw, xy, title, lines, fill="#ffffff", outline="#1e293b", header_fill="#0f172a", header_text="#ffffff"):
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle(xy, radius=10, fill=fill, outline=outline, width=2)
    draw.rounded_rectangle((x1, y1, x2, y1 + 36), radius=10, fill=header_fill, outline=outline, width=2)
    draw.rectangle((x1, y1 + 26, x2, y1 + 36), fill=header_fill)
    f_title = get_font(15, bold=True)
    f_body = get_font(13, bold=False)
    draw.text((x1 + 14, y1 + 8), title, fill=header_text, font=f_title)
    curr_y = y1 + 46
    for line in lines:
        draw.text((x1 + 14, curr_y), line, fill="#1e293b", font=f_body)
        curr_y += 21


def draw_arrow(draw, start, end, label="", color="#0284c7"):
    import math
    x1, y1 = start
    x2, y2 = end
    draw.line((x1, y1, x2, y2), fill=color, width=3)
    angle = math.atan2(y2 - y1, x2 - x1)
    arrow_len = 12
    p1 = (x2 - arrow_len * math.cos(angle - math.pi / 6), y2 - arrow_len * math.sin(angle - math.pi / 6))
    p2 = (x2 - arrow_len * math.cos(angle + math.pi / 6), y2 - arrow_len * math.sin(angle + math.pi / 6))
    draw.polygon([(x2, y2), p1, p2], fill=color)
    if label:
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2 - 18
        f_lbl = get_font(12, bold=True)
        bbox = draw.textbbox((mx, my), label, font=f_lbl)
        pad = 4
        draw.rounded_rectangle((bbox[0] - pad, bbox[1] - 2, bbox[2] + pad, bbox[3] + 2), radius=4, fill="#f8fafc", outline="#cbd5e1")
        draw.text((mx, my), label, fill="#0f172a", font=f_lbl)


def make_architecture_diagram():
    img = Image.new("RGB", (1300, 680), "#f8fafc")
    draw = ImageDraw.Draw(img)
    draw.text((35, 22), "System Architecture Diagram — JalSuraksha Water Contamination & Risk-Mapping Portal (G315)", fill="#0f172a", font=get_font(22, True))
    draw.text((35, 52), "Three-Tier Web GIS & Automated PHED Alerting Architecture (React 18 + Node.js/Express + Local PostgreSQL 18)", fill="#475569", font=get_font(14, False))

    # Tier 1: Presentation Layer
    draw_box(
        draw,
        (40, 105, 390, 620),
        "1. Client Presentation Tier (React + Vite)",
        [
            "• Interactive Live Risk Map (FR7)",
            "  - MapLibre GL JS + OpenFreeMap Vector Tiles",
            "  - Color-coded Risk Markers (Low/Med/High)",
            "  - GPS / Click-to-Pin Coordinate Picker",
            "",
            "• Multi-Mode Reporting Wizard (FR2, FR3, FR4)",
            "  - Citizen Symptom & Visual Cluster Form",
            "  - Tester BIS IS 10500 Field Kit Input Form",
            "  - Local Photo Evidence Upload",
            "",
            "• PHED Authority Dashboard (FR6)",
            "  - KPI Cards & Unread Alert Center",
            "  - Report Verification & Moderation",
            "  - Source Treatment Status Workflow",
            "",
            "• Role-Based Auth Context (FR1)",
            "  - Citizen | Tester | PHED Authority | Admin",
        ],
        fill="#f0f9ff",
        header_fill="#0369a1",
    )

    # Tier 2: Application & Business Logic Layer
    draw_box(
        draw,
        (475, 105, 835, 620),
        "2. Application Logic Tier (Node.js + Express)",
        [
            "• REST API Gateway & RBAC Middleware",
            "  - JWT Token Verification & Role Guards",
            "  - Optional Auth for Anonymous Citizens",
            "  - Multer Multipart Photo Storage (/uploads)",
            "",
            "• BIS IS 10500:2012 Risk Scoring Engine (FR8)",
            "  - Evaluates pH, TDS, Turbidity, Coliform,",
            "    Fluoride, Arsenic, Nitrate, Iron limits",
            "  - Weighs Symptom Clusters & Severity",
            "  - Computes Risk Score (0-100) & Confidence",
            "",
            "• Spatial Duplicate Detector",
            "  - Haversine 250m proximity check",
            "",
            "• Automated Alert Dispatcher (FR5)",
            "  - Triggers Critical/Warning PHED Alerts",
            "  - Nodemailer Email + In-App Dispatch",
        ],
        fill="#fefce8",
        header_fill="#b45309",
    )

    # Tier 3: Data & External Services Layer
    draw_box(
        draw,
        (920, 105, 1260, 410),
        "3. Data Tier (Local PostgreSQL 18)",
        [
            "• Relational + JSONB Schema:",
            "  - users (RBAC & jurisdictions)",
            "  - water_sources (coords, risk_score,",
            "    risk_level, confidence, status)",
            "  - reports (test_parameters JSONB,",
            "    symptom_data JSONB, verification)",
            "  - alerts (severity, status, timestamps)",
            "",
            "• Spatial & Composite Indexes:",
            "  - idx_water_sources_coords (lat, lng)",
            "  - idx_water_sources_risk (risk, status)",
        ],
        fill="#f0fdf4",
        header_fill="#15803d",
    )

    draw_box(
        draw,
        (920, 440, 1260, 620),
        "4. External Map & Notification Services",
        [
            "• OpenFreeMap Vector Tile Server",
            "  - Liberty Style OpenStreetMap Tiles",
            "• Nodemailer PHED Alert Dispatch",
            "  - Automated Email / Alert Log",
            "• Local Static Media Store (/uploads)",
        ],
        fill="#faf5ff",
        header_fill="#6d28d9",
    )

    draw_arrow(draw, (390, 260), (475, 260), "REST JSON / FormData")
    draw_arrow(draw, (475, 320), (390, 320), "Live Risk & GeoJSON")
    draw_arrow(draw, (835, 240), (920, 240), "SQL + JSONB Queries")
    draw_arrow(draw, (920, 295), (835, 295), "Normalized Rows")
    draw_arrow(draw, (835, 510), (920, 510), "SMTP / Alert Dispatch")

    img.save(os.path.join(OUT_DIR, "architecture.png"))


def make_use_case_diagram():
    img = Image.new("RGB", (1300, 680), "#f8fafc")
    draw = ImageDraw.Draw(img)
    draw.text((35, 22), "UML Use-Case Diagram — Community Water Contamination Portal (Group G315)", fill="#0f172a", font=get_font(22, True))
    draw.text((35, 52), "Actor Interactions Across Citizen, Community Field Tester, PHED Authority Officer, and Platform Admin", fill="#475569", font=get_font(14, False))

    # System Boundary
    draw.rounded_rectangle((310, 95, 990, 640), radius=14, fill="#ffffff", outline="#0f172a", width=2)
    draw.text((470, 110), "JalSuraksha Portal System Boundary", fill="#0f172a", font=get_font(17, True))

    # Actors on Left and Right
    actors = [
        (70, 180, "Citizen / Water User", "#0284c7"),
        (70, 440, "Community Field Tester", "#0d9488"),
        (1060, 210, "PHED Authority Officer", "#d97706"),
        (1060, 460, "Platform Administrator", "#7c3aed"),
    ]
    for ax, ay, name, col in actors:
        draw.rounded_rectangle((ax, ay, ax + 190, ay + 90), radius=10, fill=col, outline="#0f172a", width=2)
        draw.text((ax + 15, ay + 34), name, fill="#ffffff", font=get_font(14, True))

    use_cases = [
        (430, 155, 870, 205, "UC1: View Live Contamination Risk Map & BIS Parameters (FR7, FR9)"),
        (430, 225, 870, 275, "UC2: Pin New Water Source via GPS / Map & Report Symptoms (FR2, FR4)"),
        (430, 295, 870, 345, "UC3: Submit Structured BIS IS 10500 Test Data & Photos (FR3)"),
        (430, 365, 870, 415, "UC4: Calculate Composite Risk Score & Auto-Trigger PHED Alert (FR5, FR8)"),
        (430, 435, 870, 485, "UC5: Verify Reports & Update Source Treatment Status (FR6)"),
        (430, 505, 870, 555, "UC6: Acknowledge / Resolve Automated Contamination Alerts (FR5, FR6)"),
        (430, 575, 870, 625, "UC7: Moderate Spam/Duplicate Reports & Manage Jurisdictions (FR10)"),
    ]

    for x1, y1, x2, y2, text in use_cases:
        draw.rounded_rectangle((x1, y1, x2, y2), radius=24, fill="#f0f9ff", outline="#0369a1", width=2)
        draw.text((x1 + 22, y1 + 15), text, fill="#0f172a", font=get_font(13, True))

    # Connect Actors to Use Cases
    draw_arrow(draw, (260, 210), (430, 180), "", "#0284c7")
    draw_arrow(draw, (260, 235), (430, 250), "", "#0284c7")
    draw_arrow(draw, (260, 470), (430, 190), "", "#0d9488")
    draw_arrow(draw, (260, 485), (430, 320), "", "#0d9488")
    draw_arrow(draw, (1060, 250), (870, 460), "", "#d97706")
    draw_arrow(draw, (1060, 270), (870, 530), "", "#d97706")
    draw_arrow(draw, (1060, 500), (870, 465), "", "#7c3aed")
    draw_arrow(draw, (1060, 520), (870, 600), "", "#7c3aed")

    img.save(os.path.join(OUT_DIR, "use_case.png"))


def make_dfd_diagram():
    img = Image.new("RGB", (1300, 680), "#f8fafc")
    draw = ImageDraw.Draw(img)
    draw.text((35, 22), "Data Flow Diagram (DFD Level-0 & Level-1) — JalSuraksha Portal (Group G315)", fill="#0f172a", font=get_font(22, True))
    draw.text((35, 52), "End-to-End Contamination Data Flow from Ground Reporting to BIS Risk Scoring and PHED Treatment", fill="#475569", font=get_font(14, False))

    # Processes
    draw_box(draw, (50, 120, 340, 270), "P1.0 Report Ingestion & Validation", [
        "• Validate GPS coordinates",
        "• Check 250m spatial duplicates",
        "• Parse BIS test & symptom JSON",
        "• Store photo evidence",
    ], fill="#e0f2fe", header_fill="#0369a1")

    draw_box(draw, (480, 120, 810, 270), "P2.0 BIS IS 10500 Risk Engine", [
        "• Compare pH, TDS, Coliform, As, F⁻",
        "• Weight symptom clusters & counts",
        "• Apply tester verification multiplier",
        "• Output risk_score & confidence",
    ], fill="#fef3c7", header_fill="#b45309")

    draw_box(draw, (940, 120, 1250, 270), "P3.0 Automated Alert Dispatcher", [
        "• Check threshold (score >= 35/65)",
        "• Route by source jurisdiction",
        "• Create critical/warning Alert",
        "• Dispatch PHED Email + Badge",
    ], fill="#fee2e2", header_fill="#b91c1c")

    draw_box(draw, (480, 430, 810, 595), "P4.0 PHED Triage & Status Workflow", [
        "• Verify or reject pending reports",
        "• Transition source: reported ->",
        "  verified -> under_treatment ->",
        "  resolved (resets active risk)",
    ], fill="#f3e8ff", header_fill="#6d28d9")

    draw_box(draw, (50, 430, 340, 595), "D1: PostgreSQL 18 Data Store", [
        "• Table: users",
        "• Table: water_sources",
        "• Table: reports (JSONB)",
        "• Table: alerts",
    ], fill="#dcfce7", header_fill="#15803d")

    draw_box(draw, (940, 430, 1250, 595), "P5.0 Live Risk Map Publisher", [
        "• Render OpenFreeMap vector tiles",
        "• Color-code source markers",
        "• Show BIS violations & disclaimers",
    ], fill="#e0f2fe", header_fill="#0f766e")

    draw_arrow(draw, (340, 195), (480, 195), "Validated Report")
    draw_arrow(draw, (810, 195), (940, 195), "Score >= Threshold")
    draw_arrow(draw, (195, 270), (195, 430), "Insert Report")
    draw_arrow(draw, (645, 270), (340, 470), "Update Source Risk")
    draw_arrow(draw, (645, 430), (645, 270), "Recalculate on Verify")
    draw_arrow(draw, (810, 510), (940, 510), "Updated Map State")

    img.save(os.path.join(OUT_DIR, "dfd_diagram.png"))


def make_er_diagram():
    img = Image.new("RGB", (1300, 680), "#f8fafc")
    draw = ImageDraw.Draw(img)
    draw.text((35, 22), "Entity-Relationship (ER) Database Diagram — Local PostgreSQL 18 Schema (G315)", fill="#0f172a", font=get_font(22, True))
    draw.text((35, 52), "Normalized Relational Tables with JSONB Parameter Storage and Spatial Coordinates", fill="#475569", font=get_font(14, False))

    draw_box(draw, (50, 110, 410, 355), "USERS (PK: id)", [
        "PK  id : SERIAL",
        "    name : VARCHAR(120) NOT NULL",
        "UK  email : VARCHAR(160) UNIQUE",
        "    password_hash : VARCHAR(255)",
        "    phone : VARCHAR(25)",
        "    role : VARCHAR(30) [citizen|tester|authority|admin]",
        "    jurisdiction : VARCHAR(120)",
        "    created_at : TIMESTAMPTZ",
    ], fill="#ffffff", header_fill="#1e3a8a")

    draw_box(draw, (50, 405, 410, 645), "ALERTS (PK: id)", [
        "PK  id : SERIAL",
        "FK  source_id : INT -> water_sources(id)",
        "FK  report_id : INT -> reports(id)",
        "    severity : VARCHAR(20) [warning|critical]",
        "    title : VARCHAR(200)",
        "    message : TEXT",
        "    assigned_jurisdiction : VARCHAR(120)",
        "    status : VARCHAR(30) [unread|acknowledged|resolved]",
        "    created_at, resolved_at : TIMESTAMPTZ",
    ], fill="#ffffff", header_fill="#991b1b")

    draw_box(draw, (485, 110, 865, 540), "WATER_SOURCES (PK: id)", [
        "PK  id : SERIAL",
        "UK  code : VARCHAR(32) UNIQUE (e.g. GN-WS-101)",
        "    name : VARCHAR(160) NOT NULL",
        "    source_type : VARCHAR(40) [handpump|well|tank]",
        "    description : TEXT",
        "    locality : VARCHAR(140)",
        "    jurisdiction : VARCHAR(120)",
        "IDX latitude : NUMERIC(9,6) NOT NULL",
        "IDX longitude : NUMERIC(9,6) NOT NULL",
        "    risk_score : NUMERIC(5,2) DEFAULT 10.0",
        "IDX risk_level : VARCHAR(20) [low|medium|high]",
        "    confidence_level : VARCHAR(20) [low|medium|high]",
        "IDX status : VARCHAR(30) [reported|verified|...]",
        "    latest_parameters : JSONB (BIS IS 10500)",
        "    authority_notes : TEXT",
        "    last_tested_at, updated_at : TIMESTAMPTZ",
    ], fill="#ffffff", header_fill="#065f46")

    draw_box(draw, (930, 110, 1265, 580), "REPORTS (PK: id)", [
        "PK  id : SERIAL",
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
        "    created_at : TIMESTAMPTZ",
    ], fill="#ffffff", header_fill="#0369a1")

    draw_arrow(draw, (410, 210), (930, 210), "1 : N submits / verifies")
    draw_arrow(draw, (865, 310), (930, 310), "1 : N has reports")
    draw_arrow(draw, (485, 480), (410, 480), "1 : N triggers alerts")

    img.save(os.path.join(OUT_DIR, "er_diagram.png"))


if __name__ == "__main__":
    make_architecture_diagram()
    make_use_case_diagram()
    make_dfd_diagram()
    make_er_diagram()
    print("Generated all 4 high-resolution engineering diagrams in docs/diagrams/")
