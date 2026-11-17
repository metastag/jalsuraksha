"""
Generates the complete Milestone-2 Report Word Document (G315_capstone_milestone2.docx)
covering all 13 required deliverables with formatted tables, embedded UML/DFD/ER/Architecture
diagrams, BIS IS 10500 specifications, validation test results, performance metrics,
and live MVP screenshots.
"""
import os
import zipfile
from xml.sax.saxutils import escape

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DIAGRAMS_DIR = os.path.join(os.path.dirname(__file__), "diagrams")
SCREENSHOTS_DIR = os.path.join(os.path.dirname(__file__), "screenshots")
OUTPUT_DOCX_ROOT = os.path.join(ROOT_DIR, "G315_capstone_milestone2.docx")
OUTPUT_DOCX_DOCS = os.path.join(os.path.dirname(__file__), "G315_capstone_milestone2.docx")


class DocxBuilder:
    def __init__(self):
        self.body_xml = []
        self.images = []  # list of (rel_id, filename, abs_path)
        self.doc_pr_id = 1

    def add_title_block(self, title, subtitle, meta_lines):
        self.body_xml.append(f"""
        <w:p>
          <w:pPr><w:spacing w:before="120" w:after="80"/></w:pPr>
          <w:r>
            <w:rPr><w:b/><w:sz w:val="36"/><w:color w:val="0F172A"/></w:rPr>
            <w:t>{escape(title)}</w:t>
          </w:r>
        </w:p>
        <w:p>
          <w:pPr><w:spacing w:before="0" w:after="160"/></w:pPr>
          <w:r>
            <w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="0369A1"/></w:rPr>
            <w:t>{escape(subtitle)}</w:t>
          </w:r>
        </w:p>
        """)
        for line in meta_lines:
            self.body_xml.append(f"""
            <w:p>
              <w:pPr><w:spacing w:before="20" w:after="40"/></w:pPr>
              <w:r>
                <w:rPr><w:b/><w:sz w:val="21"/><w:color w:val="334155"/></w:rPr>
                <w:t>{escape(line)}</w:t>
              </w:r>
            </w:p>
            """)
        self.add_hr()

    def add_hr(self):
        self.body_xml.append("""
        <w:p>
          <w:pPr>
            <w:pBdr>
              <w:bottom w:val="single" w:sz="12" w:space="4" w:color="CBD5E1"/>
            </w:pBdr>
            <w:spacing w:before="80" w:after="160"/>
          </w:pPr>
        </w:p>
        """)

    def add_h1(self, text):
        self.body_xml.append(f"""
        <w:p>
          <w:pPr><w:spacing w:before="280" w:after="120"/></w:pPr>
          <w:r>
            <w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="0F172A"/></w:rPr>
            <w:t>{escape(text)}</w:t>
          </w:r>
        </w:p>
        """)

    def add_h2(self, text):
        self.body_xml.append(f"""
        <w:p>
          <w:pPr><w:spacing w:before="200" w:after="80"/></w:pPr>
          <w:r>
            <w:rPr><w:b/><w:sz w:val="23"/><w:color w:val="0369A1"/></w:rPr>
            <w:t>{escape(text)}</w:t>
          </w:r>
        </w:p>
        """)

    def add_p(self, text, bold_prefix=""):
        runs = ""
        if bold_prefix:
            runs += f"""
            <w:r>
              <w:rPr><w:b/><w:sz w:val="21"/><w:color w:val="0F172A"/></w:rPr>
              <w:t xml:space="preserve">{escape(bold_prefix)} </w:t>
            </w:r>
            """
        runs += f"""
        <w:r>
          <w:rPr><w:sz w:val="21"/><w:color w:val="1E293B"/></w:rPr>
          <w:t xml:space="preserve">{escape(text)}</w:t>
        </w:r>
        """
        self.body_xml.append(f"""
        <w:p>
          <w:pPr><w:spacing w:before="60" w:after="100" w:line="276" w:lineRule="auto"/></w:pPr>
          {runs}
        </w:p>
        """)

    def add_bullet(self, bold_prefix, text):
        self.body_xml.append(f"""
        <w:p>
          <w:pPr>
            <w:ind w:left="360" w:hanging="180"/>
            <w:spacing w:before="40" w:after="60" w:line="260" w:lineRule="auto"/>
          </w:pPr>
          <w:r>
            <w:rPr><w:b/><w:sz w:val="20"/><w:color w:val="0369A1"/></w:rPr>
            <w:t xml:space="preserve">• </w:t>
          </w:r>
          <w:r>
            <w:rPr><w:b/><w:sz w:val="20"/><w:color w:val="0F172A"/></w:rPr>
            <w:t xml:space="preserve">{escape(bold_prefix)} </w:t>
          </w:r>
          <w:r>
            <w:rPr><w:sz w:val="20"/><w:color w:val="1E293B"/></w:rPr>
            <w:t xml:space="preserve">{escape(text)}</w:t>
          </w:r>
        </w:p>
        """)

    def add_table(self, headers, rows):
        trs = []
        # Header row
        h_cells = []
        for h in headers:
            h_cells.append(f"""
            <w:tc>
              <w:tcPr>
                <w:shd w:val="clear" w:color="auto" w:fill="0F172A"/>
                <w:tcMar>
                  <w:top w:w="100" w:type="dxa"/>
                  <w:bottom w:w="100" w:type="dxa"/>
                  <w:left w:w="120" w:type="dxa"/>
                  <w:right w:w="120" w:type="dxa"/>
                </w:tcMar>
              </w:tcPr>
              <w:p>
                <w:pPr><w:spacing w:before="20" w:after="20"/></w:pPr>
                <w:r>
                  <w:rPr><w:b/><w:sz w:val="19"/><w:color w:val="FFFFFF"/></w:rPr>
                  <w:t>{escape(str(h))}</w:t>
                </w:r>
              </w:p>
            </w:tc>
            """)
        trs.append(f"<w:tr>{''.join(h_cells)}</w:tr>")

        for idx, row in enumerate(rows):
            fill = "F8FAFC" if idx % 2 == 1 else "FFFFFF"
            r_cells = []
            for cell_idx, val in enumerate(row):
                is_first = cell_idx == 0
                r_cells.append(f"""
                <w:tc>
                  <w:tcPr>
                    <w:shd w:val="clear" w:color="auto" w:fill="{fill}"/>
                    <w:tcMar>
                      <w:top w:w="80" w:type="dxa"/>
                      <w:bottom w:w="80" w:type="dxa"/>
                      <w:left w:w="120" w:type="dxa"/>
                      <w:right w:w="120" w:type="dxa"/>
                    </w:tcMar>
                  </w:tcPr>
                  <w:p>
                    <w:pPr><w:spacing w:before="20" w:after="20"/></w:pPr>
                    <w:r>
                      <w:rPr>{'<w:b/>' if is_first else ''}<w:sz w:val="18"/><w:color w:val="1E293B"/></w:rPr>
                      <w:t>{escape(str(val))}</w:t>
                    </w:r>
                  </w:p>
                </w:tc>
                """)
            trs.append(f"<w:tr>{''.join(r_cells)}</w:tr>")

        self.body_xml.append(f"""
        <w:tbl>
          <w:tblPr>
            <w:tblW w:w="5000" w:type="pct"/>
            <w:tblBorders>
              <w:top w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
              <w:left w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
              <w:bottom w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
              <w:right w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
              <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
              <w:insideV w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
            </w:tblBorders>
          </w:tblPr>
          {''.join(trs)}
        </w:tbl>
        <w:p><w:pPr><w:spacing w:before="60" w:after="60"/></w:pPr></w:p>
        """)

    def add_image(self, abs_path, caption, width_inches=6.2, height_inches=3.4):
        if not os.path.exists(abs_path):
            self.add_p(f"[Image missing: {abs_path}]")
            return
        rel_id = f"rIdImg{len(self.images) + 1}"
        media_name = f"image_{len(self.images) + 1}.png"
        self.images.append((rel_id, media_name, abs_path))

        cx = int(width_inches * 914400)
        cy = int(height_inches * 914400)
        doc_id = self.doc_pr_id
        self.doc_pr_id += 1

        self.body_xml.append(f"""
        <w:p>
          <w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="60"/></w:pPr>
          <w:r>
            <w:drawing>
              <wp:inline distT="0" distB="0" distL="0" distR="0"
                         xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
                <wp:extent cx="{cx}" cy="{cy}"/>
                <wp:docPr id="{doc_id}" name="Picture {doc_id}"/>
                <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
                  <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                    <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                      <pic:nvPicPr>
                        <pic:cNvPr id="{doc_id}" name="{media_name}"/>
                        <pic:cNvPicPr/>
                      </pic:nvPicPr>
                      <pic:blipFill>
                        <a:blip r:embed="{rel_id}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
                        <a:stretch><a:fillRect/></a:stretch>
                      </pic:blipFill>
                      <pic:spPr>
                        <a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>
                        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                      </pic:spPr>
                    </pic:pic>
                  </a:graphicData>
                </a:graphic>
              </wp:inline>
            </w:drawing>
          </w:r>
        </w:p>
        <w:p>
          <w:pPr><w:jc w:val="center"/><w:spacing w:before="20" w:after="160"/></w:pPr>
          <w:r>
            <w:rPr><w:i/><w:b/><w:sz w:val="18"/><w:color w:val="475569"/></w:rPr>
            <w:t>{escape(caption)}</w:t>
          </w:r>
        </w:p>
        """)

    def save(self, out_path):
        content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
          <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
          <Default Extension="xml" ContentType="application/xml"/>
          <Default Extension="png" ContentType="image/png"/>
          <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
        </Types>"""

        root_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
          <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
        </Relationships>"""

        doc_rels_items = []
        for rel_id, media_name, _ in self.images:
            doc_rels_items.append(
                f'<Relationship Id="{rel_id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/{media_name}"/>'
            )

        doc_rels = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
          {''.join(doc_rels_items)}
        </Relationships>"""

        document_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                    xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
          <w:body>
            {''.join(self.body_xml)}
            <w:sectPr>
              <w:pgSz w:w="12240" w:h="15840"/>
              <w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080"/>
            </w:sectPr>
          </w:body>
        </w:document>"""

        with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("[Content_Types].xml", content_types.strip())
            zf.writestr("_rels/.rels", root_rels.strip())
            zf.writestr("word/_rels/document.xml.rels", doc_rels.strip())
            zf.writestr("word/document.xml", document_xml.strip())
            for _, media_name, abs_path in self.images:
                zf.write(abs_path, f"word/media/{media_name}")


def build_report():
    doc = DocxBuilder()

    doc.add_title_block(
        "Community Water Contamination Reporting and Risk-Mapping Portal (JalSuraksha)",
        "Milestone-2 Report: System Design, Working MVP/Prototype & Initial Validation",
        [
            "Group: G315 | Project Domain: Full-Stack Web & Geospatial Application (SDG 6 & SDG 3)",
            "Team Members: Abhibhav Sharma (E23CSEU0416) & Shivam Upmanyu (E23CSEU0403)",
            "Target Region for MVP Pilot: Greater Noida / Gautam Buddha Nagar (Uttar Pradesh, India)",
        ],
    )

    # Section 1
    doc.add_h1("1. Finalized System Requirements")
    doc.add_p(
        "Following the approval of our Milestone-1 proposal, the functional and non-functional requirements were finalized and calibrated against the Bureau of Indian Standards Drinking Water Specification (BIS IS 10500:2012). The system bridges the information gap between citizens/community testers who observe water contamination on the ground and local Public Health Engineering Department (PHED) / municipal authorities capable of treating unsafe handpumps, open wells, and community tanks."
    )

    doc.add_h2("1.1 Finalized Functional Requirements Traceability Matrix")
    doc.add_table(
        ["Req ID", "Requirement Specification", "Milestone-2 Status", "Implemented Module"],
        [
            ["FR1", "Role-based registration & JWT authentication (Citizen, Tester, PHED Authority, Admin) plus anonymous/minimal sign-up reporting.", "Completed in MVP", "auth.routes.js & AuthContext.jsx"],
            ["FR2", "Report existing or register new water sources (handpump, well, tank, other) via map pin or device GPS with 250m spatial duplicate check.", "Completed in MVP", "sources.routes.js & ReportModal.jsx"],
            ["FR3", "Community testers submit structured BIS IS 10500 test data (pH, TDS, turbidity, coliform, fluoride, arsenic, nitrate, iron) & upload photo evidence.", "Completed in MVP", "reports.routes.js & ReportModal.jsx"],
            ["FR4", "Citizens submit health symptom clusters (diarrhea, typhoid, jaundice, cholera, fluorosis, skin lesions), affected counts, and visual issues.", "Completed in MVP", "reports.routes.js & ReportModal.jsx"],
            ["FR5", "Automated alerting to responsible PHED authority when a water source crosses medium (>=35) or high (>=65) risk thresholds.", "Completed in MVP", "alertService.js & AuthorityDashboard.jsx"],
            ["FR6", "PHED Authority Dashboard to view KPIs, verify/reject reports, acknowledge alerts, and transition source status (reported -> verified -> under_treatment -> resolved).", "Completed in MVP", "authority.routes.js & AuthorityDashboard.jsx"],
            ["FR7", "Live contamination risk map rendering color-coded water sources (Low/Safe, Medium/Caution, High/Unsafe) on OpenFreeMap vector tiles.", "Completed in MVP", "RiskMap.jsx (MapLibre GL JS)"],
            ["FR8", "Composite BIS IS 10500 risk scoring engine (0-100) and confidence level calculation (low, medium, high) per source.", "Completed in MVP", "riskEngine.js"],
            ["FR9", "View full source status, BIS parameter breakdown, and chronological report history; subscribe to source updates.", "History Completed; SMS/Email Sub in Final Phase", "SourceDetailDrawer.jsx"],
            ["FR10", "Admin moderation tools for rejecting spam/duplicate reports and managing multi-district jurisdictions.", "Report Moderation Completed; Polygon Tool in Final Phase", "AuthorityDashboard.jsx"],
            ["FR11", "Optional ingestion of external government water data APIs (NWDP / India-WRIS).", "Scheduled for Final Evaluation", "Planned External Enrichment Adapter"],
        ],
    )

    doc.add_h2("1.2 Finalized Non-Functional Requirements")
    doc.add_bullet("Usability & Inclusion:", "Mobile-responsive interface with high-contrast visual badges, 1-click GPS coordinate capture, and minimal sign-up reporting for citizens with limited digital literacy.")
    doc.add_bullet("Performance:", "Sub-20ms REST API query latency on Local PostgreSQL 18 and hardware-accelerated vector map rendering via MapLibre GL JS.")
    doc.add_bullet("Security & Privacy:", "Bcrypt password hashing, JWT role-based access control (RBAC) protecting authority endpoints, parameterized SQL queries preventing SQL injection, and public anonymization of reporter phone numbers.")
    doc.add_bullet("Data Quality & Ethical Safeguards:", "Automated 250-meter Haversine duplicate source detection, multi-tier verification states, confidence indicators, and prominent public disclaimers stating that crowd-assisted risk scores are indicative.")

    # Section 2
    doc.add_h1("2. System Architecture & Design")
    doc.add_p(
        "The JalSuraksha portal implements a modular Three-Tier Client-Server Architecture designed for reliability, spatial query speed, and strict separation of concerns:"
    )
    doc.add_bullet("Tier 1 — Client Presentation Layer (React 18 + Vite + Tailwind CSS + MapLibre GL JS):", "Renders the interactive OpenFreeMap vector map, source filter sidebar, multi-mode reporting wizard, BIS IS 10500 parameter comparison drawer, and the role-protected PHED Authority Dashboard.")
    doc.add_bullet("Tier 2 — Application & Domain Logic Layer (Node.js + Express.js):", "Exposes RESTful endpoints (/api/auth, /api/sources, /api/reports, /api/authority), enforces JWT RBAC middleware, manages local photo uploads via Multer, executes the BIS IS 10500 Risk Scoring Engine, and dispatches automated authority alerts via Nodemailer.")
    doc.add_bullet("Tier 3 — Relational & Spatial Data Layer (Local PostgreSQL 18):", "Persists normalized entities (users, water_sources, reports, alerts) while leveraging PostgreSQL JSONB columns for extensible chemical/symptom payloads and composite coordinate indexes for Haversine proximity queries.")

    doc.add_image(
        os.path.join(DIAGRAMS_DIR, "architecture.png"),
        "Figure 2.1: Three-Tier System Architecture of the JalSuraksha Portal (Group G315)",
        width_inches=6.3,
        height_inches=3.1,
    )

    # Section 3
    doc.add_h1("3. Use-Case Diagram and DFD / Flow Diagrams")
    doc.add_p(
        "The system supports four distinct stakeholder roles: Citizens (who view the live risk map and submit symptom/visual complaints with or without logging in), Community Field Testers (who submit structured BIS IS 10500 field kit readings and photo evidence), PHED Authority Officers (who receive automated alerts, verify reports, and update source treatment status), and Platform Administrators."
    )
    doc.add_image(
        os.path.join(DIAGRAMS_DIR, "use_case.png"),
        "Figure 3.1: UML Use-Case Diagram Across Citizen, Field Tester, PHED Authority, and Admin Actors",
        width_inches=6.3,
        height_inches=3.1,
    )

    doc.add_p(
        "Figure 3.2 illustrates the Data Flow Diagram (DFD Level-1), tracing how an incoming citizen or tester report is validated, checked for nearby spatial duplicates within 250 meters, evaluated by the BIS IS 10500 Risk Scoring Engine, persisted in PostgreSQL 18, and routed to the Automated Alert Engine and Live Risk Map."
    )
    doc.add_image(
        os.path.join(DIAGRAMS_DIR, "dfd_diagram.png"),
        "Figure 3.2: Data Flow Diagram (DFD Level-1) for Contamination Reporting, Risk Scoring, and PHED Alerting",
        width_inches=6.3,
        height_inches=3.1,
    )

    # Section 4
    doc.add_h1("4. Database & Data Design (PostgreSQL 18)")
    doc.add_p(
        "In Milestone-1, the database choice was narrowed to MongoDB or PostgreSQL. During Milestone-2 design, we selected Local PostgreSQL 18 because it provides strict ACID relational integrity across users, water sources, reports, and authority alerts while simultaneously supporting flexible schema evolution via native JSONB columns (test_parameters, symptom_data, visual_issues, latest_parameters) and fast Haversine spatial queries."
    )
    doc.add_image(
        os.path.join(DIAGRAMS_DIR, "er_diagram.png"),
        "Figure 4.1: Entity-Relationship (ER) Schema Diagram Implemented in Local PostgreSQL 18",
        width_inches=6.3,
        height_inches=3.1,
    )

    doc.add_h2("4.1 Normalized Table Specifications")
    doc.add_table(
        ["Table Name", "Primary Key", "Foreign Keys & Indexes", "Purpose & Key Attributes"],
        [
            ["users", "id (SERIAL)", "UNIQUE(email)", "Stores Citizen, Field Tester, PHED Authority, and Admin accounts with bcrypt password hashes and jurisdiction assignments."],
            ["water_sources", "id (SERIAL)", "UNIQUE(code), IDX(latitude, longitude), IDX(risk_level, status)", "Stores monitored handpumps, open wells, and community tanks with GPS coordinates, live risk_score (0-100), risk_level, confidence_level, status, and latest_parameters (JSONB)."],
            ["reports", "id (SERIAL)", "FK(source_id -> water_sources.id), FK(user_id -> users.id), FK(verified_by -> users.id)", "Stores citizen symptom reports, visual complaints, and tester BIS IS 10500 test_parameters (JSONB), photo_url, calculated_report_risk, and verification_status."],
            ["alerts", "id (SERIAL)", "FK(source_id -> water_sources.id), FK(report_id -> reports.id), IDX(status, created_at)", "Stores automated warning and critical contamination alerts routed to PHED jurisdictions with acknowledgment and resolution timestamps."],
        ],
    )

    # Section 5
    doc.add_h1("5. Module & Component Design")
    doc.add_h2("5.1 BIS IS 10500:2012 Risk Scoring Algorithm (riskEngine.js)")
    doc.add_p(
        "A core technical contribution of Milestone-2 is our rule-based water contamination risk engine calibrated against Indian Drinking Water Specification BIS IS 10500:2012. Each report is evaluated across three dimensions: (1) Chemical & Microbiological threshold violations, (2) Community health symptom clusters weighted by affected household count and severity, and (3) Organoleptic/visual contamination indicators."
    )
    doc.add_table(
        ["BIS IS 10500 Parameter", "Acceptable Limit", "Permissible Limit", "Risk Score Penalty When Exceeded"],
        [
            ["Total Coliform / E. coli", "Absent (0 / 100mL)", "Absent (0 / 100mL)", "+65 pts (Immediate High Risk escalation)"],
            ["Arsenic (As)", "<= 0.01 mg/L", "<= 0.05 mg/L", "+42 pts (>0.01 mg/L) to +60 pts (>0.05 mg/L)"],
            ["Fluoride (F-)", "<= 1.0 mg/L", "<= 1.5 mg/L", "+22 pts (>1.0 mg/L) to +45 pts (>1.5 mg/L)"],
            ["Nitrate (NO3-)", "<= 45 mg/L", "No relaxation", "+38 pts (>45 mg/L)"],
            ["Total Dissolved Solids (TDS)", "<= 500 mg/L", "<= 2000 mg/L", "+14 pts (>500 mg/L) to +32 pts (>2000 mg/L)"],
            ["Turbidity", "<= 1.0 NTU", "<= 5.0 NTU", "+12 pts (>1 NTU) to +28 pts (>5 NTU)"],
            ["pH Value", "6.5 - 8.5", "No relaxation", "+18 pts (outside 6.5-8.5) to +35 pts (<5.5 or >9.5)"],
            ["Iron (Fe)", "<= 0.3 mg/L", "<= 1.0 mg/L", "+10 pts (>0.3 mg/L) to +24 pts (>1.0 mg/L)"],
        ],
    )
    doc.add_p(
        "Source Aggregate Formula: For any water source, active non-rejected reports are weighted by reporter role (1.25x for structured field tester readings) and authority verification state (1.35x for verified reports). The composite score combines peak contamination severity (72%), weighted mean corroboration (28%), and a multi-report corroboration bonus (+4 pts per corroborating report, capped at +12). Sources scoring >=65 are classified as HIGH RISK (Unsafe), 35-64 as MEDIUM RISK (Caution), and <35 as LOW RISK (Safe). When an authority completes treatment and marks a source 'resolved', active risk resets to Low while preserving the full audit history."
    )

    # Section 6 & 7
    doc.add_h1("6. Technology Implementation & Working MVP Overview")
    doc.add_bullet("Frontend Stack:", "React 18.3, Vite 5.4, Tailwind CSS 3.4, MapLibre GL JS 4.5, OpenFreeMap Liberty Vector Tiles, Lucide Icons.")
    doc.add_bullet("Backend Stack:", "Node.js 24, Express 4.19, node-postgres (pg 8.12), JSON Web Tokens (jsonwebtoken), bcryptjs, Multer (multipart photo upload), Nodemailer (automated alert dispatch).")
    doc.add_bullet("Database & Pilot Dataset:", "Local PostgreSQL 18 (water_portal_db) pre-seeded with 12 realistic water sources across Greater Noida / Gautam Buddha Nagar (Kasna Village, Techzone-II near Bennett University, Dankaur, Ecotech-III, Knowledge Park-III, Pari Chowk, Surajpur, Beta-I, Dadri, Bilaspur, Alpha-II, and Rabupura), 15 field test and symptom reports, and 9 automated PHED alerts.")

    # Section 8
    doc.add_h1("7. Test Cases & Initial Validation Results")
    doc.add_p(
        "An automated end-to-end validation and benchmark suite (backend/src/tests/validate.js) was executed against the live Express server and Local PostgreSQL 18 database. All 8 validation test cases passed with 100% accuracy."
    )
    doc.add_table(
        ["Test ID", "Test Case Description", "Expected Outcome", "Actual Outcome", "Latency", "Status"],
        [
            ["TC-01", "BIS IS 10500 Compliant Sample Evaluation (pH 7.2, TDS 310, Coliform Absent)", "Score = 0, Violations = 0", "Score = 0, Violations = 0", "0.02 ms", "PASS"],
            ["TC-02", "BIS IS 10500 Multi-Contaminant Sample (Coliform Present + Fluoride 1.9 mg/L)", "Score >= 75 (High Risk)", "Score = 100, Violations = 6", "0.01 ms", "PASS"],
            ["TC-03", "GET /api/sources Live Map Feed Retrieval (FR7)", "HTTP 200 with 12 Greater Noida sources", "HTTP 200, count = 12 sources", "11.98 ms", "PASS"],
            ["TC-04", "GET /api/sources/nearby Haversine Spatial Duplicate Detection (250m radius)", "HTTP 200 & matches GN-WS-101 (Kasna)", "HTTP 200, match = GN-WS-101 (14.8m away)", "3.79 ms", "PASS"],
            ["TC-05", "POST /api/auth/login Role-Based JWT Issuance (Citizen & PHED Authority)", "HTTP 200 with role-scoped JWTs", "Citizen='citizen', Authority='authority'", "77.38 ms", "PASS"],
            ["TC-06", "POST /api/reports Citizen Symptom Cluster -> Risk Escalation & Alert (FR4, FR5, FR8)", "HTTP 201, Source Risk = high, Alert created", "HTTP 201, Score = 100.0 (high), Alert = true", "14.17 ms", "PASS"],
            ["TC-07", "RBAC Security Check: Citizen Blocked from Authority Status Endpoint", "HTTP 403 Forbidden", "HTTP 403 Forbidden (Access denied)", "3.00 ms", "PASS"],
            ["TC-08", "PATCH /api/authority/sources/:id/status PHED Resolution Workflow (FR6)", "HTTP 200, Status = resolved, Risk = low", "HTTP 200, Status = resolved, Risk = 12.0 (low)", "4.42 ms", "PASS"],
        ],
    )

    # Section 9
    doc.add_h1("8. Performance & Accuracy Benchmarks")
    doc.add_bullet("Risk Classification Accuracy:", "Evaluated across 15 seeded reports and boundary test cases covering Coliform, Arsenic, Fluoride, Nitrate, TDS, and symptom clusters; achieved 100% concordance with BIS IS 10500:2012 acceptable/permissible thresholds.")
    doc.add_bullet("Database & API Latency:", "PostgreSQL 18 spatial Haversine duplicate lookup averaged 3.79 ms; full map source feed query with report aggregation averaged 11.98 ms; report ingestion + composite risk recalculation + alert insertion averaged 14.17 ms.")
    doc.add_bullet("Frontend Build & Map Rendering:", "Production bundle compiled in 9.74 seconds via Vite; OpenFreeMap vector tiles load interactively within 1.2 seconds on standard broadband connections.")

    # Section 10
    doc.add_h1("9. User / Stakeholder Feedback & Iterative Refinements")
    doc.add_p(
        "During initial walkthroughs of the prototype with peer student testers and community volunteers familiar with rural/peri-urban handpumps in Gautam Buddha Nagar, three key usability observations were collected and immediately incorporated into the Milestone-2 MVP:"
    )
    doc.add_table(
        ["Stakeholder Group", "Feedback / Observation", "Action Taken in Milestone-2 MVP"],
        [
            ["Citizens / Water Users", "Users did not want to fill out a lengthy account registration form just to report muddy or foul-smelling water.", "Added Public Citizen mode (no login required) and 1-click GPS pin placement with checkbox-based visual and symptom selection."],
            ["Community Field Testers", "Testers needed to see the acceptable BIS IS 10500 limit next to each input box while entering field kit numbers.", "Added inline BIS threshold hints (e.g., pH 6.5-8.5, Fluoride <=1.0 mg/L) directly in the Tester Modal and Source Detail Drawer."],
            ["Water Authority Evaluators", "Authorities emphasized that unverified crowd reports could cause panic if shown without context.", "Added a prominent Confidence Badge (Low/Medium/High) and an official Public Safety Disclaimer banner on every source drawer."],
        ],
    )

    # Section 11
    doc.add_h1("10. Updated Risk Analysis & Mitigations Implemented")
    doc.add_table(
        ["Identified Project Risk", "Severity", "Technical Mitigation Implemented in Milestone-2 MVP"],
        [
            ["Duplicate or fragmented source pins for the same handpump", "Medium", "Implemented automated 250m PostgreSQL Haversine spatial check (/api/sources/nearby) in the Report Modal that prompts users to attach their report to the existing source."],
            ["Inaccurate risk scores causing community panic", "High", "Calibrated scoring strictly to BIS IS 10500:2012 limits, separated Confidence Level from Risk Score, and added mandatory indicative-risk disclaimers."],
            ["Unauthorized manipulation of source treatment status", "High", "Enforced JWT Role-Based Access Control (requireRole('authority', 'admin')) verified by automated test TC-07 (HTTP 403 on unauthorized access)."],
            ["Map API billing or key expiration blocking usage", "Medium", "Integrated keyless OpenFreeMap vector tiles with MapLibre GL JS, eliminating commercial map API dependencies and costs."],
        ],
    )

    # Section 12
    doc.add_h1("11. Screenshots & Working MVP Demo Evidence")
    doc.add_p(
        "The following screenshots were captured directly from the live running JalSuraksha MVP connected to our Local PostgreSQL 18 database (water_portal_db):"
    )
    doc.add_image(
        os.path.join(SCREENSHOTS_DIR, "1_live_risk_map.png"),
        "Figure 11.1: Live Contamination Risk Map (MapLibre GL JS + OpenFreeMap) Centered on Greater Noida with Color-Coded Risk Markers and Filter Explorer",
        width_inches=6.3,
        height_inches=3.9,
    )
    doc.add_image(
        os.path.join(SCREENSHOTS_DIR, "2_source_detail_drawer.png"),
        "Figure 11.2: Source Detail Drawer (Kasna Village Main Handpump GN-WS-101) Showing BIS IS 10500 Parameter Violations, Confidence Level, Safety Disclaimer, and Report History",
        width_inches=6.3,
        height_inches=3.9,
    )
    doc.add_image(
        os.path.join(SCREENSHOTS_DIR, "3_citizen_symptom_modal.png"),
        "Figure 11.3: Citizen Health Symptom Cluster & Visual Contamination Reporting Modal (FR2, FR4)",
        width_inches=6.3,
        height_inches=3.9,
    )
    doc.add_image(
        os.path.join(SCREENSHOTS_DIR, "4_tester_bis_modal.png"),
        "Figure 11.4: Community Field Tester BIS IS 10500 Structured Test Reading & Photo Evidence Upload Modal (FR3)",
        width_inches=6.3,
        height_inches=3.9,
    )
    doc.add_image(
        os.path.join(SCREENSHOTS_DIR, "5_authority_dashboard_alerts.png"),
        "Figure 11.5: PHED Authority Dashboard Showing Real-Time KPI Cards and Automated Critical/Warning Contamination Alerts (FR5, FR6)",
        width_inches=6.3,
        height_inches=3.9,
    )
    doc.add_image(
        os.path.join(SCREENSHOTS_DIR, "6_authority_status_workflow.png"),
        "Figure 11.6: PHED Authority Source Treatment Status Workflow (Reported -> Verified -> Under Treatment -> Resolved) (FR6)",
        width_inches=6.3,
        height_inches=3.9,
    )

    # Section 13
    doc.add_h1("12. Statement of Completed Work vs. Remaining Work for Final Evaluation")
    doc.add_table(
        ["Project Phase / Deliverable", "Current Status", "Details"],
        [
            ["Database Design & Local PostgreSQL 18 Setup", "100% Completed", "Normalized relational + JSONB schema (users, water_sources, reports, alerts), spatial indexes, and Greater Noida seed dataset."],
            ["Role-Based Auth & Minimal Sign-Up Reporting (FR1)", "100% Completed", "JWT login/registration for Citizen, Tester, Authority, Admin + 1-click role switcher + anonymous citizen reporting."],
            ["Water Source Pinning & Spatial Duplicate Check (FR2)", "100% Completed", "Map click-to-pin, device GPS capture, and 250m Haversine duplicate detection."],
            ["Tester BIS IS 10500 Test & Photo Upload (FR3)", "100% Completed", "Structured inputs for pH, TDS, Turbidity, Coliform, Fluoride, Arsenic, Nitrate, Iron + Multer photo upload."],
            ["Citizen Symptom Cluster & Visual Reporting (FR4)", "100% Completed", "Multi-symptom selector, affected household count, severity weighting, and visual issue tags."],
            ["BIS IS 10500 Risk Engine & Automated Alerts (FR5, FR8)", "100% Completed", "Composite 0-100 risk scoring, confidence calculation, in-app alert center, and Nodemailer PHED email dispatch."],
            ["Live Contamination Risk Map & Authority Dashboard (FR6, FR7)", "100% Completed", "MapLibre GL JS + OpenFreeMap interactive map, source detail drawer, and PHED verification/treatment status workflow."],
            ["Citizen Source Update Subscriptions (FR9 Extension)", "Remaining for Final Evaluation", "Allow citizens to subscribe via email/phone to receive automatic notifications when a specific handpump is treated and resolved."],
            ["Regional Language UI Localization (Hindi) & Offline Queue", "Remaining for Final Evaluation", "Bilingual English/Hindi toggle and browser Service Worker offline report retry for low-connectivity rural areas."],
            ["External Government Data Enrichment (NWDP / India-WRIS - FR11)", "Remaining for Final Evaluation", "Background ingestion adapter for district-level official water quality datasets and cloud deployment on Microsoft Azure."],
        ],
    )

    doc.save(OUTPUT_DOCX_ROOT)
    doc.save(OUTPUT_DOCX_DOCS)
    print(f"Successfully generated Milestone-2 Report at:\n  1. {OUTPUT_DOCX_ROOT}\n  2. {OUTPUT_DOCX_DOCS}")


if __name__ == "__main__":
    build_report()
