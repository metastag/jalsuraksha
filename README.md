# JalSuraksha — Community Water Contamination Reporting & Risk-Mapping Portal

**Group G315** | **Abhibhav Sharma (E23CSEU0416)** & **Shivam Upmanyu (E23CSEU0403)**  
**Milestone-2: System Design, Working MVP/Prototype & Initial Validation**

---

## 1. Overview

**JalSuraksha** is a full-stack geospatial web portal that bridges the information gap between citizens/community water testers and local Public Health Engineering Department (PHED) water authorities. It enables ground-level reporting of contaminated handpumps, open wells, and community tanks, computes a composite **BIS IS 10500:2012** risk score (0–100) and confidence level, renders a live color-coded contamination risk map on **OpenFreeMap** vector tiles via **MapLibre GL JS**, and automatically dispatches alerts to PHED officers.

---

## 2. Quick Start (Local PostgreSQL 18)

### Prerequisites
- **Node.js** (v18+ / v24)
- **PostgreSQL 18** running locally on `127.0.0.1:5432` (configured in `backend/.env`)

### Commands

```powershell
# 1. Initialize & seed the local PostgreSQL 18 database (water_portal_db)
npm run seed

# 2. Run the automated BIS IS 10500 & API validation suite (8 test cases)
npm test

# 3. Build frontend & start the unified full-stack server on http://127.0.0.1:5000
npm run build
npm start
```

Or run the frontend Vite dev server (`http://localhost:5173`) and backend Express API (`http://localhost:5000`) separately:
```powershell
npm run dev:backend
npm run dev:frontend
```

---

## 3. Pre-Seeded Demo Accounts (`password123` or 1-Click Role Switcher in Navbar)

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Citizen** | Ramesh Kumar | `citizen@jalsuraksha.in` | `password123` |
| **Community Field Tester** | Abhibhav Sharma | `tester@jalsuraksha.in` | `password123` |
| **PHED Authority Officer** | Er. Shivam Upmanyu | `authority@jalsuraksha.in` | `password123` |
| **Platform Admin** | G315 Platform Admin | `admin@jalsuraksha.in` | `password123` |
