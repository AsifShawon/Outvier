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
- **Data Pipeline:** **CRICOS-first** official synchronization with Government DataStore.
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

## 🛡️ Admin Dashboard & Data Pipeline

Outvier uses a **CRICOS-first** architecture. The official Government DataStore is the primary source for universities, programs, locations, and their relationships.

### CRICOS Sync Workflow
Administrators manage data via the **CRICOS Sync** menu:
1. **Provider Sync**: Fetch fresh data from the CRICOS API.
2. **Staged Changes**: Review and approve differences before they hit the production database.
3. **Raw Explorer**: Inspect original DataStore records.

### AI Enrichment
AI is used as a contextual enrichment tool integrated into:
- **Rankings**: Automated discovery of global/national ranks.
- **Scholarships**: Discovery of university-specific financial aid.
- **Outcomes**: Enrichment of graduate employment metrics.
- **Summaries**: Generation of student-friendly descriptions.

For more details, see [CRICOS Admin Workflow](docs/CRICOS_ADMIN_WORKFLOW.md).

---

## 🗺️ Key Features

### 🎓 For Students
- ✅ **Personalized Fit Score:** An advanced comparison engine that calculates a 0-100% match based on academic profile and budget.
- ✅ **Comparison Table:** Side-by-side analysis featuring real-time ranking data and outcomes.
- ✅ **Application Tracker:** A Kanban board to manage your journey from "Researching" to "Enrolled."
- ✅ **Budget Calculator:** Estimate total yearly costs including tuition and accommodation.

### 🛡️ For Administrators
- ✅ **Operational Dashboard:** Real-time health metrics of CRICOS syncs and staged changes.
- ✅ **Metabase Dashboard:** Integrated BI dashboard for tracking student trends.
- ✅ **Staged Changes System:** Review and approve automated data updates before they go live.
- ✅ **Field Inspector:** Debugging tool for CRICOS DataStore schemas.

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

---

## 🧪 Seeding Data
To populate the database with an initial dataset:
```bash
cd backend
npm run seed
```
**Admin Credentials:** `admin` / `admin`
