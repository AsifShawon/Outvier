# 🎓 Outvier — Comparative Analytics & Decision-Support Platform

Welcome to **Outvier**, a full-stack Australian university comparison and decision-support platform. Outvier goes beyond simple searching, providing students with personalized "Fit Scores," a Kanban-style application tracker, and a comprehensive budget calculator, while giving administrators automated data-sync pipelines and deep business intelligence through Metabase.

---

## 🏗️ Architecture Overview

Outvier is built as a high-performance monorepo with a decoupled frontend, backend, and background processing layer.

### 1. Frontend (`/frontend`)
- **Framework:** Next.js 16 (App Router)
- **Design System:** Vanilla CSS with Radix UI & Shadcn components.
- **Analytics:** Metabase Embedding & Native Stats via **Recharts**.
- **Data Fetching:** TanStack React Query (v5).
- **Interactive UI:** Framer Motion for premium animations and Kanban-style drag-and-drop interfaces.

### 2. Backend (`/backend`)
- **Runtime:** Node.js with Express.js (TypeScript).
- **Queue System:** **BullMQ** with **Redis** for handling long-running scraping and sync jobs.
- **Data Pipeline:** Custom connectors for **QS World Rankings**, **QILT Graduate Outcomes**, and automated Scholarship scrapers.
- **Security:** JWT Authentication with Role-Based Access Control (RBAC).

### 3. Data & Services
- **Database:** MongoDB (Mongoose) with optimized text-indexes for fuzzy search.
- **Analytics Engine:** **Metabase** (Self-hosted via Docker) for deep business intelligence.
- **Notifications:** Nodemailer-based SMTP service for student engagement.

---

## 🚀 Getting Started

### 🛠️ 1. Infrastructure (Docker)
The easiest way to run the full stack (Database, Redis, and Metabase) is via Docker Compose:
```bash
docker compose up -d
```
This will start:
- **MongoDB** on port `27018`
- **Redis** on port `6379`
- **Metabase** on port `3001`

### 📦 2. Install Dependencies
```bash
# Root
cd backend && npm install
cd ../frontend && npm install
```

### 🏃‍♂️ 3. Run the Platform
You need to run three processes for the full experience:

**Start the Backend API:**
```bash
cd backend
npm run dev
```

**Start the Background Worker (For Scrapers/Sync):**
```bash
cd backend
npm run dev:worker
```

**Start the Frontend:**
```bash
cd frontend
npm run dev
```

---

## 🗺️ Key Features

### 🎓 For Students
- ✅ **Personalized Fit Score:** An advanced comparison engine that calculates a 0-100% match based on your academic profile, budget, and preferred location.
- ✅ **Comparison Table:** Side-by-side analysis of programs featuring real-time ranking data and graduate outcome metrics.
- ✅ **Application Tracker:** A Kanban board to manage your journey from "Researching" to "Enrolled."
- ✅ **Budget Calculator:** Estimate total yearly costs including tuition, accommodation, and lifestyle expenses across different Australian states.

### 🛡️ For Administrators
- ✅ **Metabase Dashboard:** Integrated BI dashboard for tracking student trends and platform performance.
- ✅ **Automated Data Sync:** Connectors that pull the latest data from QS Rankings and QILT Outcomes.
- ✅ **Staged Changes System:** Review and approve automated data updates before they go live.
- ✅ **Bulk CSV Upload:** High-speed ingestion for university and program data.
- ✅ **CRICOS Official Sync:** Direct integration with data.gov.au CKAN API for official Australian provider and course data.
- ✅ **Rankings & Scholarships CRUD:** Manage global rankings and financial aid records through a dedicated admin UI.

---

## 🔑 Environment Configuration

### Backend (.env)
- `MONGODB_URI`: Connection string for MongoDB.
- `REDIS_URL`: Connection string for Redis.
- `METABASE_URL`: URL of the Metabase instance (default: `http://localhost:3001`).
- `SMTP_*`: Credentials for the email notification service.

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL`: URL of the backend API (default: `http://localhost:5000/api/v1`).
- `NEXT_PUBLIC_METABASE_EMBED_URL`: Signed URL for Metabase dashboard embedding.

---

## 📊 Metabase Setup (Analytics)
The admin panel is pre-configured to link directly to your local Metabase instance. To set it up:
1. **Start Metabase**: Ensure Docker is running. Metabase will be active at `http://localhost:3001`.
2. **Connect MongoDB**:
   - **Database Type**: `MongoDB`
   - **Name**: `outvier`
   - **Host**: `outvier-mongodb` (internal Docker name) or `localhost` (if running locally).
   - **Port**: `27017`
   - **Database Name**: `outvier`
3. **Admin Dashboard**: Clicking **"Analytics"** in the sidebar will now open your Metabase instance in a new tab for full access.
4. **Embedding (Optional)**: If you prefer to see the dashboard *inside* the Outvier panel, enable embedding in Metabase settings and paste the signed URL into `frontend/.env.local` as `NEXT_PUBLIC_METABASE_EMBED_URL`.

---

## 🧪 Seeding Data
To populate the database with an initial dataset:
```bash
cd backend
npm run seed
```
**Admin Credentials:** `admin` / `admin`
