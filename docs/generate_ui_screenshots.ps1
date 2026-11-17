Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot "screenshots"
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

$brandFont = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Bold)
$smallFont = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Regular)
$boldSmall = New-Object System.Drawing.Font("Segoe UI", 9.5, [System.Drawing.FontStyle]::Bold)
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$skyBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(56, 189, 248))
$mutedBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(148, 163, 184))
$activeBtn = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(2, 132, 199))
$inactiveBtn = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(30, 41, 59))
$emeraldBtn = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(5, 150, 105))

function New-AppFrame($activeNav, $roleText) {
    $bmp = New-Object System.Drawing.Bitmap(1360, 820)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    # App Background
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(248, 250, 252))
    $g.FillRectangle($bgBrush, 0, 0, 1360, 820)

    # Top Navbar
    $navBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))
    $g.FillRectangle($navBrush, 0, 0, 1360, 62)

    $g.DrawString("JalSuraksha | Group G315 (SDG 6 & 3)", $brandFont, $whiteBrush, 24, 10)
    $g.DrawString("Community Water Contamination Reporting & Live Risk-Mapping Portal (Greater Noida / GB Nagar)", $smallFont, $mutedBrush, 24, 36)

    $g.FillRectangle($(if ($activeNav -eq "map") { $activeBtn } else { $inactiveBtn }), 575, 16, 125, 30)
    $g.DrawString("Live Risk Map", $boldSmall, $whiteBrush, 592, 22)

    $g.FillRectangle($emeraldBtn, 710, 16, 155, 30)
    $g.DrawString("+ Report Source / Test", $boldSmall, $whiteBrush, 720, 22)

    $g.FillRectangle($(if ($activeNav -eq "dashboard") { $activeBtn } else { $inactiveBtn }), 875, 16, 185, 30)
    $g.DrawString("PHED Authority Dashboard (9)", $boldSmall, $whiteBrush, 883, 22)

    $g.FillRectangle($inactiveBtn, 1090, 16, 245, 30)
    $g.DrawString("Role View: $roleText", $boldSmall, $skyBrush, 1102, 22)

    return @{ Bmp = $bmp; G = $g }
}

# 1. Live Risk Map Screenshot
$s1 = New-AppFrame "map" "Public Citizen (Live GPS)"
$g = $s1.G
$white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(203, 213, 225), 1.5)
$g.FillRectangle($white, 0, 62, 420, 758)
$g.DrawLine($borderPen, 420, 62, 420, 820)

$hFont = New-Object System.Drawing.Font("Segoe UI", 10.5, [System.Drawing.FontStyle]::Bold)
$bFont = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Regular)
$dark = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))
$redFill = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 226, 226))
$redText = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(153, 27, 27))
$ambFill = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 243, 199))
$ambText = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(146, 64, 14))
$grnFill = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(209, 250, 229))
$grnText = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(6, 95, 70))

$g.DrawRectangle($borderPen, 16, 78, 388, 30)
$g.DrawString("Search locality, source name or code (Kasna, Dankaur)...", $bFont, $dark, 26, 85)

$g.FillRectangle($redFill, 16, 120, 122, 46)
$g.DrawString("7 High Risk", $hFont, $redText, 32, 133)
$g.FillRectangle($ambFill, 149, 120, 122, 46)
$g.DrawString("2 Med Risk", $hFont, $ambText, 166, 133)
$g.FillRectangle($grnFill, 282, 120, 122, 46)
$g.DrawString("3 Safe/Treated", $hFont, $grnText, 292, 133)

$cards = @(
    @("GN-WS-101 | HANDPUMP | HIGH CONFIDENCE", "Kasna Village Main Mark-II Handpump", "Kasna Village, Greater Noida", "100 - HIGH RISK", "Verified (2 reports)", $redFill, $redText),
    @("GN-WS-103 | WELL | HIGH CONFIDENCE", "Dankaur Ward-4 Open Masonry Well", "Dankaur Town, GB Nagar", "100 - HIGH RISK", "Under Treatment (2 reports)", $redFill, $redText),
    @("GN-WS-104 | HANDPUMP | HIGH CONFIDENCE", "Ecotech-III Industrial Belt Borewell", "Ecotech-III, Greater Noida", "100 - HIGH RISK", "Verified (1 report)", $redFill, $redText),
    @("GN-WS-102 | HANDPUMP | MEDIUM CONFIDENCE", "Techzone-II Labour Settlement Pump", "Techzone-II / Near Bennett Univ", "96 - HIGH RISK", "Reported (2 reports)", $redFill, $redText),
    @("GN-WS-112 | HANDPUMP | HIGH CONFIDENCE", "Rabupura Rural Cluster Handpump #9", "Rabupura, GB Nagar", "89 - HIGH RISK", "Verified (1 report)", $redFill, $redText),
    @("GN-WS-106 | TANK | MEDIUM CONFIDENCE", "Pari Chowk Transit Camp Tank", "Pari Chowk, Greater Noida", "48 - MEDIUM RISK", "Reported (1 report)", $ambFill, $ambText),
    @("GN-WS-105 | TANK | HIGH CONFIDENCE", "Knowledge Park-III Standpost Tank", "Knowledge Park-III, Greater Noida", "12 - SAFE", "Resolved (1 report)", $grnFill, $grnText)
)
$cy = 182
foreach ($c in $cards) {
    $g.DrawRectangle($borderPen, 12, $cy, 396, 82)
    $g.DrawString($c[0], $bFont, $dark, 22, ($cy + 8))
    $g.DrawString($c[1], $hFont, $dark, 22, ($cy + 27))
    $g.DrawString($c[2], $bFont, $dark, 22, ($cy + 48))
    $g.FillRectangle($c[5], 285, ($cy + 12), 112, 24)
    $g.DrawString($c[3], $bFont, $c[6], 292, ($cy + 16))
    $cy += 88
}

# Map Canvas Area
$mapBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(226, 238, 232))
$g.FillRectangle($mapBg, 421, 62, 939, 758)
$roadPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(253, 230, 138), 5)
$g.DrawLine($roadPen, 450, 220, 1320, 640)
$g.DrawLine($roadPen, 580, 90, 960, 790)
$g.DrawLine($roadPen, 430, 520, 1340, 310)

# Floating Top Map Controls (Live GPS + High Risk Filter)
$skyBtn = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(2, 132, 199))
$g.FillRectangle($skyBtn, 440, 80, 295, 34)
$g.DrawString("Live GPS (28.4506 N, 77.5842 E) - Locate Me", $hFont, $white, 452, 88)

$redBtn = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 38, 38))
$g.FillRectangle($redBtn, 745, 80, 225, 34)
$g.DrawString("Show High-Risk Hotspots (7)", $hFont, $white, 758, 88)

# Render High-Risk Markers & User Live Location Marker on Map
$markers = @(
    @(780, 380, "HIGH RISK - 100", "Kasna Village Handpump", $redBtn),
    @(960, 430, "HIGH RISK - 96", "Techzone-II Pump", $redBtn),
    @(640, 250, "HIGH RISK - 100", "Ecotech-III Borewell", $redBtn),
    @(880, 610, "HIGH RISK - 100", "Dankaur Open Well", $redBtn),
    @(740, 310, "CAUTION - 48", "Pari Chowk Tank", (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(217, 119, 6)))),
    @(690, 290, "SAFE - 12", "KP-III Standpost", (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(5, 150, 105))))
)
$haloBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(55, 220, 38, 38))
foreach ($m in $markers) {
    $mx = $m[0]; $my = $m[1]
    $g.FillEllipse($haloBrush, ($mx - 32), ($my - 32), 64, 64)
    $g.FillRectangle($m[4], ($mx - 55), ($my - 42), 118, 22)
    $g.DrawString($m[2], $bFont, $white, ($mx - 48), ($my - 39))
    $g.FillEllipse($m[4], ($mx - 16), ($my - 16), 32, 32)
}

# Live User Marker
$g.FillRectangle($skyBtn, 930, 485, 115, 22)
$g.DrawString("YOU ARE HERE", $bFont, $white, 940, 488)
$g.FillEllipse($skyBtn, 975, 512, 22, 22)

$s1.Bmp.Save((Join-Path $outDir "1_live_risk_map.png"), [System.Drawing.Imaging.ImageFormat]::Png)

# 2. Source Detail Drawer Screenshot
$s2 = New-AppFrame "map" "Public Citizen (Live GPS)"
$g2 = $s2.G
$g2.DrawImage($s1.Bmp, 0, 0)
$g2.FillRectangle($white, 820, 62, 540, 758)
$g2.DrawRectangle($borderPen, 820, 62, 540, 758)
$navBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))
$g2.FillRectangle($navBrush, 820, 62, 540, 78)
$g2.DrawString("GN-WS-101 | HANDPUMP | KASNA VILLAGE, GREATER NOIDA", $bFont, $skyBrush, 838, 74)
$g2.DrawString("Kasna Village Main Mark-II Handpump", $brandFont, $white, 838, 96)

$g2.FillRectangle($redFill, 838, 155, 504, 68)
$g2.DrawString("Composite Risk Score: 100 / 100 (HIGH RISK - UNSAFE)", $hFont, $redText, 852, 165)
$g2.DrawString("Confidence Level: HIGH CONFIDENCE  |  PHED Status: Verified (Chlorination Scheduled)", $bFont, $redText, 852, 192)

$g2.FillRectangle($ambFill, 838, 235, 504, 48)
$g2.DrawString("Public Safety Notice: Risk scores are indicative based on BIS IS 10500 thresholds.", $bFont, $ambText, 850, 244)
$g2.DrawString("Avoid direct consumption until PHED treatment is completed.", $bFont, $ambText, 850, 261)

$g2.DrawString("Latest BIS IS 10500:2012 Field Kit Parameter Breakdown:", $hFont, $dark, 838, 298)
$bisBoxes = @(
    @(838, 325, "Coliform / E. coli: PRESENT", "BIS Limit: Absent (EXCEEDS BIS)", $redFill, $redText),
    @(1095, 325, "Turbidity: 6.8 NTU", "BIS Limit: <= 5 NTU (EXCEEDS BIS)", $redFill, $redText),
    @(838, 390, "Nitrate (NO3): 58 mg/L", "BIS Limit: <= 45 mg/L (EXCEEDS BIS)", $redFill, $redText),
    @(1095, 390, "TDS: 1480 mg/L", "BIS Acceptable: <= 500 mg/L (HIGH)", $redFill, $redText),
    @(838, 455, "Fluoride: 1.2 mg/L", "BIS Acceptable: <= 1.0 mg/L (ELEVATED)", $ambFill, $ambText),
    @(1095, 455, "pH Level: 7.9", "BIS Range: 6.5 - 8.5 (OK)", $grnFill, $grnText)
)
foreach ($b in $bisBoxes) {
    $g2.FillRectangle($b[4], $b[0], $b[1], 245, 55)
    $g2.DrawString($b[2], $hFont, $b[5], ($b[0] + 10), ($b[1] + 8))
    $g2.DrawString($b[3], $bFont, $b[5], ($b[0] + 10), ($b[1] + 30))
}
$g2.DrawString("Chronological Report History (2 Reports):", $hFont, $dark, 838, 528)
$g2.DrawRectangle($borderPen, 838, 555, 504, 95)
$g2.DrawString("Abhibhav Sharma (Field Tester) - TEST READING [VERIFIED]", $hFont, $dark, 850, 565)
$g2.DrawString("H2S strip test turned black within 18 hours indicating faecal coliform presence.", $bFont, $dark, 850, 590)
$g2.DrawRectangle($borderPen, 838, 660, 504, 95)
$g2.DrawString("Sunita Devi (Citizen) - SYMPTOM REPORT (11 Affected) [VERIFIED]", $hFont, $dark, 850, 670)
$g2.DrawString("Symptoms: Acute Diarrhea, Vomiting, Abdominal Cramps (Severity: Severe).", $bFont, $dark, 850, 695)
$s2.Bmp.Save((Join-Path $outDir "2_source_detail_drawer.png"), [System.Drawing.Imaging.ImageFormat]::Png)

# 3. Citizen Symptom Report Modal Screenshot
$s3 = New-AppFrame "map" "Public Citizen"
$g3 = $s3.G
$g3.DrawImage($s1.Bmp, 0, 0)
$dimBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(140, 15, 23, 42))
$g3.FillRectangle($dimBrush, 0, 62, 1360, 758)
$g3.FillRectangle($white, 260, 100, 840, 660)
$g3.FillRectangle($navBrush, 260, 100, 840, 58)
$g3.DrawString("Submit Water Contamination / Citizen Symptom Cluster Report (FR2, FR4)", $brandFont, $white, 280, 115)
$g3.DrawString("1. Selected Source: [GN-WS-102] Techzone-II Labour Settlement Handpump (28.4508 N, 77.5844 E)", $hFont, $dark, 285, 180)
$g3.FillRectangle($redFill, 285, 220, 790, 210)
$g3.DrawString("2. Observed Waterborne Health Symptoms Linked to Source (FR4):", $hFont, $redText, 300, 235)
$g3.DrawString("[X] Acute Diarrhea / Gastroenteritis     [X] Vomiting & Nausea     [X] Abdominal Cramps     [ ] Typhoid Fever", $bFont, $dark, 300, 270)
$g3.DrawString("[ ] Jaundice / Viral Hepatitis           [X] Dental / Skeletal Fluorosis                     [ ] Skin Rashes", $bFont, $dark, 300, 305)
$g3.DrawString("Estimated People Affected: [ 8 Households / Individuals ]     Symptom Severity: [ Severe (Cluster) ]", $hFont, $dark, 300, 355)
$g3.FillRectangle($ambFill, 285, 450, 790, 110)
$g3.DrawString("3. Visible / Organoleptic Water Issues:", $hFont, $ambText, 300, 465)
$g3.DrawString("[X] Sewage / Faecal Odor     [X] Cloudy / Muddy Turbidity     [X] Salty / Metallic Taste", $bFont, $dark, 300, 500)
$g3.FillRectangle($emeraldBtn, 820, 695, 255, 42)
$g3.DrawString("Submit Report & Calculate Risk", $hFont, $white, 842, 706)
$s3.Bmp.Save((Join-Path $outDir "3_citizen_symptom_modal.png"), [System.Drawing.Imaging.ImageFormat]::Png)

# 4. Tester BIS IS 10500 Modal Screenshot
$s4 = New-AppFrame "map" "Field Tester (Abhibhav Sharma)"
$g4 = $s4.G
$g4.DrawImage($s1.Bmp, 0, 0)
$g4.FillRectangle($dimBrush, 0, 62, 1360, 758)
$g4.FillRectangle($white, 260, 100, 840, 660)
$g4.FillRectangle($navBrush, 260, 100, 840, 58)
$g4.DrawString("Community Field Tester - BIS IS 10500:2012 Structured Test Submission (FR3)", $brandFont, $white, 280, 115)
$g4.DrawString("1. Selected Source: [GN-WS-101] Kasna Village Main Mark-II Handpump (250m Spatial Check Passed)", $hFont, $dark, 285, 180)
$skyFill = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(224, 242, 254))
$g4.FillRectangle($skyFill, 285, 220, 790, 260)
$g4.DrawString("2. Structured BIS IS 10500:2012 Field Test Kit Readings:", $hFont, $dark, 300, 235)
$g4.DrawString("pH Level (6.5-8.5): [ 7.9 ]        TDS mg/L (<=500): [ 1480 ]       Turbidity NTU (<=1): [ 6.8 ]", $hFont, $dark, 300, 280)
$g4.DrawString("Fluoride mg/L (<=1.0): [ 1.2 ]     Arsenic mg/L (<=0.01): [ 0.004 ]  Nitrate mg/L (<=45): [ 58 ]", $hFont, $dark, 300, 330)
$g4.DrawString("Iron mg/L (<=0.3): [ 0.45 ]        Total Coliform / E. coli: [ PRESENT (Contaminated) ]", $hFont, $redText, 300, 380)
$g4.DrawString("3. Attach Field Test Strip / Water Sample Photo Evidence (/uploads): [ kasna_h2s_strip_test.jpg ]", $hFont, $dark, 285, 515)
$g4.FillRectangle($emeraldBtn, 820, 695, 255, 42)
$g4.DrawString("Submit BIS Test & Trigger Alert", $hFont, $white, 838, 706)
$s4.Bmp.Save((Join-Path $outDir "4_tester_bis_modal.png"), [System.Drawing.Imaging.ImageFormat]::Png)

# 5. PHED Authority Dashboard & Alert Center Screenshot
$s5 = New-AppFrame "dashboard" "PHED Officer (Er. Shivam Upmanyu)"
$g5 = $s5.G
$kpis = @(
    @(24, "Monitored Sources", "12", "Gautam Buddha Nagar", $white, $dark),
    @(244, "High-Risk Unsafe", "7", "Immediate Action Needed", $redFill, $redText),
    @(464, "Unread PHED Alerts", "7", "7 Critical Severity", $ambFill, $ambText),
    @(684, "Pending Reports", "4", "Awaiting Verification", $skyFill, $dark),
    @(904, "Under Treatment", "2", "Field Crew Dispatched", $white, $dark),
    @(1124, "Safe / Resolved", "3", "BIS IS 10500 Compliant", $grnFill, $grnText)
)
foreach ($k in $kpis) {
    $g5.FillRectangle($k[4], $k[0], 85, 205, 88)
    $g5.DrawRectangle($borderPen, $k[0], 85, 205, 88)
    $g5.DrawString($k[1], $bFont, $k[5], ($k[0] + 14), 95)
    $g5.DrawString($k[2], $brandFont, $k[5], ($k[0] + 14), 118)
    $g5.DrawString($k[3], $bFont, $k[5], ($k[0] + 14), 148)
}

$g5.FillRectangle($navBrush, 24, 192, 260, 34)
$g5.DrawString("1. Automated Alert Center (9)", $hFont, $white, 38, 200)
$g5.FillRectangle($white, 296, 192, 310, 34)
$g5.DrawString("2. Source Treatment Status Workflow (12)", $hFont, $dark, 310, 200)
$g5.FillRectangle($white, 618, 192, 340, 34)
$g5.DrawString("3. Report Verification & Moderation Queue (15)", $hFont, $dark, 632, 200)

$alertsList = @(
    @("CRITICAL ALERT", "[GN-WS-101] CRITICAL CONTAMINATION ALERT: Kasna Village Main Mark-II Handpump", "Source [GN-WS-101] in Kasna Village scored 100/100 (HIGH risk, high confidence). Biological: Coliform / E. coli detected; Nitrate exceeds BIS 45 mg/L limit.", "UNREAD"),
    @("CRITICAL ALERT", "[GN-WS-102] CRITICAL CONTAMINATION ALERT: Techzone-II Labour Settlement Handpump", "Source [GN-WS-102] in Techzone-II scored 96.4/100 (HIGH risk). Fluoride exceeds permissible limit (1.85 mg/L > 1.5 mg/L); TDS 2340 mg/L > 2000 mg/L.", "UNREAD"),
    @("CRITICAL ALERT", "[GN-WS-104] CRITICAL CONTAMINATION ALERT: Ecotech-III Industrial Belt Borewell", "Source [GN-WS-104] in Ecotech-III scored 100/100 (HIGH risk). Arsenic exceeds acceptable limit (0.038 mg/L > 0.01 mg/L); Severe acidic pH 6.1.", "UNREAD"),
    @("CRITICAL ALERT", "[GN-WS-103] CRITICAL CONTAMINATION ALERT: Dankaur Ward-4 Open Masonry Well", "Source [GN-WS-103] in Dankaur Town scored 100/100 (HIGH risk). Coliform detected + 8 community typhoid/jaundice cases. Crew Dispatched.", "ACKNOWLEDGED")
)
$ay = 244
foreach ($a in $alertsList) {
    $g5.FillRectangle($redFill, 24, $ay, 1312, 118)
    $g5.DrawRectangle($borderPen, 24, $ay, 1312, 118)
    $g5.DrawString("$($a[0])  |  $($a[1])  |  In-App + PHED Email Dispatched", $hFont, $redText, 40, ($ay + 14))
    $g5.DrawString($a[2], $bFont, $dark, 40, ($ay + 44))
    $g5.DrawString("Jurisdiction: Gautam Buddha Nagar (Greater Noida)   |   Alert Status: $($a[3])", $bFont, $dark, 40, ($ay + 76))
    $g5.FillRectangle($emeraldBtn, 1165, ($ay + 40), 150, 34)
    $g5.DrawString("Mark Alert Resolved", $bFont, $white, 1180, ($ay + 48))
    $ay += 132
}
$s5.Bmp.Save((Join-Path $outDir "5_authority_dashboard_alerts.png"), [System.Drawing.Imaging.ImageFormat]::Png)

# 6. Authority Status Workflow & Report Moderation Search Queue Screenshot
$s6 = New-AppFrame "dashboard" "PHED Officer (Er. Shivam Upmanyu)"
$g6 = $s6.G
$g6.DrawImage($s5.Bmp, 0, 0)
$g6.FillRectangle((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(248, 250, 252))), 0, 185, 1360, 635)
$g6.FillRectangle($white, 24, 192, 260, 34)
$g6.DrawString("1. Automated Alert Center (9)", $hFont, $dark, 38, 200)
$g6.FillRectangle($white, 296, 192, 310, 34)
$g6.DrawString("2. Source Treatment Status Workflow (12)", $hFont, $dark, 310, 200)
$g6.FillRectangle($navBrush, 618, 192, 340, 34)
$g6.DrawString("3. Report Verification & Moderation Queue (15)", $hFont, $white, 632, 200)

# Search Bar inside Report Verification Queue
$g6.FillRectangle($white, 24, 242, 1312, 52)
$g6.DrawRectangle($borderPen, 24, 242, 1312, 52)
$g6.DrawString("Search reports by ID (#1), source code (GN-WS-101), locality, reporter name, or findings...", $bFont, $dark, 48, 260)
$g6.DrawString("Verification Status Filter:  [ All ]  [ Pending ]  [ Verified ]  [ Resolved ]  [ Rejected ]", $hFont, $dark, 780, 259)

$rows = @(
    @("Report #1 | GN-WS-101 | Kasna Village Handpump", "Abhibhav Sharma (Field Tester) | TEST READING", "H2S strip test positive for coliform; Nitrate 58 mg/L > 45 BIS limit.", "100/100", "VERIFIED"),
    @("Report #2 | GN-WS-101 | Kasna Village Handpump", "Sunita Devi (Citizen) | SYMPTOM REPORT", "Over 10 children and elderly residents suffered acute gastroenteritis.", "88.8/100", "VERIFIED"),
    @("Report #3 | GN-WS-102 | Techzone-II Settlement Pump", "Abhibhav Sharma (Field Tester) | TEST READING", "High TDS (2340 mg/L) and elevated Fluoride (1.85 mg/L > 1.5 BIS limit).", "77/100", "PENDING"),
    @("Report #4 | GN-WS-102 | Techzone-II Settlement Pump", "Mukesh Paswan (Citizen) | SYMPTOM REPORT", "Water tastes salty/metallic; 6 people complain of fluorosis & cramps.", "74.5/100", "PENDING"),
    @("Report #7 | GN-WS-105 | Knowledge Park-III Tank", "Abhibhav Sharma (Field Tester) | TEST READING", "Post-cleaning verification test: all parameters within BIS IS 10500 limits.", "0/100", "RESOLVED")
)
$ry = 310
foreach ($r in $rows) {
    $g6.FillRectangle($white, 24, $ry, 1312, 86)
    $g6.DrawRectangle($borderPen, 24, $ry, 1312, 86)
    $g6.DrawString($r[0], $hFont, $dark, 40, ($ry + 12))
    $g6.DrawString($r[1], $bFont, $skyBrush, 40, ($ry + 36))
    $g6.DrawString($r[2], $bFont, $dark, 40, ($ry + 58))
    $g6.DrawString("Impact: $($r[3])   |   Status: $($r[4])", $hFont, $dark, 920, ($ry + 32))
    $g6.FillRectangle($activeBtn, 1155, ($ry + 26), 75, 32)
    $g6.DrawString("Verify", $bFont, $white, 1175, ($ry + 34))
    $g6.FillRectangle($redBtn, 1240, ($ry + 26), 82, 32)
    $g6.DrawString("Reject", $bFont, $white, 1262, ($ry + 34))
    $ry += 94
}
$s6.Bmp.Save((Join-Path $outDir "6_authority_status_workflow.png"), [System.Drawing.Imaging.ImageFormat]::Png)

Write-Output "Generated all 6 UI screenshots in $outDir"
