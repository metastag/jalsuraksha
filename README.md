# JalSuraksha — Community Water Contamination Reporting & Risk-Mapping Portal

**Group G315** | **Abhibhav Sharma (E23CSEU0416)** & **Shivam Upmanyu (E23CSEU0403)**  
**Milestone-2: System Design, Working MVP/Prototype & Initial Validation**

---

## Option A: Run with Docker Compose (Recommended — Zero Local Setup)

Requires only **Docker Desktop** (no local Node.js or PostgreSQL installation needed).

```bash
# 1. Build and start the PostgreSQL 18 container + Full-Stack App container
docker compose up --build
```

Then open **http://localhost:5000** in your browser.

- On first startup, the app automatically creates the PostgreSQL schema and seeds the 12 Greater Noida water sources, BIS IS 10500 reports, and PHED alerts.
- Subsequent restarts (`docker compose up`) preserve any new reports and uploaded images in Docker volumes (`postgres_data` and `uploads_data`).
- To completely reset the database back to initial seed data:
  ```bash
  docker compose down -v
  docker compose up --build
  ```

---

## Option B: Run Locally Without Docker (Local Node.js + Local PostgreSQL 18)

1. Copy `backend/.env.example` to `backend/.env` and set your local PostgreSQL credentials.
2. Run:
   ```powershell
   npm --prefix backend install
   npm --prefix frontend install
   npm run build
   npm start
   ```
3. Open **http://localhost:5000** (or run `npm run dev:backend` and `npm run dev:frontend` for hot-reload on **http://localhost:5173**).

---

## Pre-Seeded Demo Accounts (`password123` or 1-Click Role Switcher in Top Navbar)

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Citizen** | Ramesh Kumar | `citizen@jalsuraksha.in` | `password123` |
| **Community Field Tester** | Abhibhav Sharma | `tester@jalsuraksha.in` | `password123` |
| **PHED Authority Officer** | Er. Shivam Upmanyu | `authority@jalsuraksha.in` | `password123` |
| **Platform Admin** | G315 Platform Admin | `admin@jalsuraksha.in` | `password123` |
