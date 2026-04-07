# 🎓 Outvier — Comparative Analytics Dashboard

Welcome to **Outvier**, a full-stack comparative analytics platform designed for discovering, filtering, and comparing university programs across Australia. Built to empower data-driven decisions, Outvier offers an elegant, high-performance UI and a robust scalable API.

---

## 🏗️ Architecture Overview

The application is structured as a **Monorepo** consisting of two main environments:

### 1. Frontend (`/frontend`)
Built with cutting-edge web technologies optimized for performance and aesthetics:
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (v4) & Shadcn/UI
- **Animations:** Framer Motion (Scroll-triggered animations, interactive hover states, glassmorphism hero sections)
- **Data Fetching:** TanStack React Query & Axios
- **State/Forms:** React Hook Form & Zod validation

### 2. Backend (`/backend`)
A fully typed, robust RESTful API that bridges the database and front-end reliably.
- **Runtime & Framework:** Node.js, Express.js
- **Language:** TypeScript
- **Database Modeler:** Mongoose
- **File Handling:** Multer & CSV-Parse (For bulk document parsing)
- **Security:** JWT Authentication, Bcrypt Password Hashing, CORS, and centralized Error Middleware routes.

### 3. Database
- **Engine:** MongoDB
- **Collections:** `Users`, `Universities`, `Programs`, and `UploadJobs`.
- **Search Optimization:** MongoDB Text Indexes (`$text`) mapped for rapid multi-field fuzzy search across titles, locations, and descriptions.

---

## 🚀 Getting Started

Follow the steps below to start the platform from a completely clean slate.

### 🛠️ 1. Setup the Database (MongoDB)

You have two choices for running the database locally.

**Option A: Using Docker (Recommended for ease)**
1. Ensure Docker Desktop is running.
2. In the root directory (`ICT801/`), spin up the provided `docker-compose.yml`:
   ```bash
   docker compose up -d
   ```
   *Note: Our config maps the container to port `27018` to avoid common local port conflicts.*

**Option B: Without Docker (Native Install)**
1. Download and install [MongoDB Community Server](https://www.mongodb.com/try/download/community).
2. Start the `mongod` service on your machine (Default binds to port `27017`).
3. If using standard port 27017, update `backend/.env` line 2 to: `MONGODB_URI=mongodb://localhost:27017/outvier`

### 📦 2. Install Dependencies
Open your terminal and navigate to the project directory:

```bash
# Install backend packages
cd backend
npm install

# In a new terminal, install frontend packages
cd frontend
npm install
```

### 🌱 3. Initialize & Seed Database
There are two ways to populate data:

**Using the Default Seeder:**
Provides an instantaneous baseline of mock data.
```bash
cd backend
npm run seed
```
*(Creates the Admin account: `admin / admin`, plus core Universities and Programs).*

**Seeding using the Sample CSVs (Admin Dashboard):**
1. Wait to start both servers (see Step 4 below).
2. Log into the application at `http://localhost:3000/login` as `admin`.
3. Navigate to the **CSV Upload** tab in the admin sidebar.
4. Drag and drop `universities.csv` from the root folder `sample-csvs/` into the dropzone to bulk insert Universities.
5. Drag and drop `programs.csv` into the Programs dropzone. 
*(The backend employs strict Upsert logic—any duplicate uploads will gracefully match and update the exact row).*

### 🏃‍♂️ 4. Start the Application Servers
To visualize the whole platform:

**Start the Backend:**
```bash
cd backend
npm run dev
# Running securely on http://localhost:5000/api/v1
```

**Start the Frontend:**
```bash
cd frontend
npm run dev
# Running securely on http://localhost:3000
```

---

## 🗺️ What We Have Built & What is Working

### Public Interfaces (Client-Side)
- ✅ **Dynamic Interactive Homepage:** Framer Motion-powered landing view with glassmorphism dashboard mockups, fluid gradients, scroll-activated components, and deep hover scales.
- ✅ **University Directory (`/universities`):** Grid layout with real-time text-index debounced search and active State / Type filters.
- ✅ **University Detail View (`/universities/[slug]`):** Renders all critical context (established year, international students, location) alongside a dynamically linked grid of all nested *Programs* belonging to that school.
- ✅ **Program Directory (`/programs`):** Advanced comparison list featuring filters for Campus Mode and Program Levels.
- ✅ **Program Detail View (`/programs/[slug]`):** In-depth information displaying tuition breakdowns, intake months, academic requirements, duration, and direct website references.

### Admin Dashboard (Protected Route)
- ✅ **Secure Login (`/login`):** JWT-secured gateway with `httpOnly` cookie injection capabilities.
- ✅ **Stats Dashboard (`/admin`):** Rapid overview displaying total active Universities and Programs.
- ✅ **Data Modifiers (CRUD):** 
  - Complete "Create", "Read", "Update", "Delete" interface integrations across both Universities and Programs.
  - Form validation utilizes `React Hook Form` piped with `Zod` logic resolving to strict types against the Node Server mappings.
- ✅ **Intelligent CSV Bulk-Uploads (`/admin/uploads`):** 
  - Handles parsing logic seamlessly. Identifies duplicate structures by mapping Regex lookups to Row Headers safely. Provides visual success/failure feedback per row immediately on frontend.

## 🔑 Key API Routes
Here is a snapshot of the major functioning routes active in the `v1` backend framework:
*   `POST /api/v1/auth/login` - Generates JWT login scope.
*   `GET /api/v1/universities` - Accepts `?search`, `?state`, `?type`, `?page`, and `?limit`. Returns paginated lists.
*   `GET /api/v1/universities/:slug` - Matches specific URI query for detail views.
*   `GET /api/v1/universities/:slug/programs` - Maps and returns all unique courses mapped strictly to a designated University ID.
*   `POST /api/v1/admin/upload/:entity` - Multipart-Form target route for capturing and digesting CSV streams.
