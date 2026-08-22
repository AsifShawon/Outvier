# Outvier Architecture — Current State

## 1. System Overview & Boundaries

Outvier is an Australian university discovery, comparison, and application-readiness platform architected as a **modular monolith** with three execution boundaries:

```
┌───────────────────────────────────────────────────────────┐
│                      Public & Users                       │
└──────────────┬────────────────────────────┬───────────────┘
               │ HTTP / JSON                │ Next.js App
               ▼                            ▼
┌──────────────────────────────┐   ┌────────────────────────┐
│  Express API Server (Port 5000)│   │ Next.js 16 Web App     │
│  - Public endpoints          │   │ (Port 3000)            │
│  - Student Portal & Tracker  │   │ - Public Discovery     │
│  - Admin & Staged Changes    │   │ - Compare & Radar      │
│  - Data Ingestion & CRICOS   │   │ - Student Dashboard    │
│  - Auth & Object-level Auth  │   │ - Admin Management     │
└──────────────┬───────────────┘   └────────────────────────┘
               │
      ┌────────┴────────┐
      ▼                 ▼
┌──────────────┐ ┌──────────────┐
│   MongoDB    │ │ Redis 7 /    │
│  Datastore   │ │ BullMQ Queue │
└──────────────┘ └──────┬───────┘
                        │ Job Dispatch
                        ▼
               ┌────────────────────────┐
               │ BullMQ Worker Process  │
               │ - CRICOS Sync Jobs     │
               │ - Web Crawlers (Crawlee)│
               │ - AI Extraction (Groq) │
               │ - Ranking & Outcomes   │
               └────────────────────────┘
```

### Execution Boundaries
1. **Frontend (`frontend/`)**: Next.js 16 (React 19, TypeScript, Tailwind CSS v4, Base UI, TanStack Query v5). Provides public discovery pages, comparison tooling, the student portal (tracker, fit analysis, budget planner), and the administrative console.
2. **API Server (`backend/src/server.ts` & `src/app.ts`)**: Express 4 with TypeScript. Serves REST API routes under `/api/v1`, handles authentication (JWT + bcrypt), input validation via Zod, and object-level authorization for user resources.
3. **Background Worker (`backend/src/jobs/workerProcess.ts`)**: Standalone Node process consuming Redis queues via BullMQ to execute heavy web scraping, CRICOS bulk synchronization, and LLM structured extraction without blocking HTTP traffic.

---

## 2. Databases & Queues

### Primary Datastore: MongoDB (Mongoose ODM)
- Stores domain entities, relational references, raw sync payloads, and audit history.
- Utilizes MongoDB transactions with standalone fallback detection (`stagedChanges.controller.ts`).

### Message Broker & Cache: Redis (ioredis & BullMQ)
- Manages asynchronous job dispatch, concurrency controls, exponential backoff retries, and job retention policies.

### Active BullMQ Queues
| Queue Name | Purpose | Concurrency / Policy |
| :--- | :--- | :--- |
| `cricos-sync` | Ingests data.gov.au CKAN datasets for institutions, courses, and locations | Sequential sync |
| `program-discovery` | Crawls university websites and extracts curriculum details via LLM | Concurrency: 2 (configurable) |
| `batch-import` | Processes batch CSV/Excel institution and program data uploads | Attempt retries: 3 |
| `university-sync` | Synchronizes university metadata from external registries | Exponential backoff |
| `program-sync` | Synchronizes program course codes and details | Exponential backoff |
| `tuition-sync` | Fetches and computes domestic vs international fee schedules | Exponential backoff |
| `scholarship-sync` | Aggregates scholarship deadlines, eligibility, and grant amounts | Exponential backoff |
| `ranking-sync` | Synchronizes QS, THE, and ARWU ranking records | Exponential backoff |
| `outcome-sync` | Synchronizes graduate employment and salary outcomes (QILT) | Exponential backoff |

---

## 3. Existing API Routes & Capabilities

### Public Endpoints
- `GET /api/v1/universities` — Paginated university search, state, ranking, and filter queries.
- `GET /api/v1/universities/:slug` — University detail by slug or ID with populated programs.
- `GET /api/v1/programs` — Multi-filter program discovery (field, level, tuition range, location).
- `GET /api/v1/programs/:slug` — Program detail by slug or ID.
- `GET /api/v1/programs/fields` — List unique disciplines and fields of study.
- `GET /api/v1/programs/cities` — List available Australian study locations.
- `GET /api/v1/scholarships` — Search active scholarships by degree level, nationality, and university.
- `GET /api/v1/scholarships/:slug` — Scholarship detail page.
- `POST /api/v1/comparison/create` — Generate new anonymous or authenticated comparison session.
- `GET /api/v1/comparison/:hash` — Retrieve comparison payload and programs.
- `POST /api/v1/comparison/:hash/add-program` & `remove-program` — Mutate comparison set.
- `POST /api/v1/comparison/:hash/add-university` & `remove-university` — Compare universities.
- `GET /api/v1/comparison/:hash/scores` — Calculate multi-dimensional fit scores.

### Authentication & Student Portal
- `POST /api/v1/auth/signup` & `POST /api/v1/auth/login` — User authentication.
- `GET /api/v1/auth/me` — Current user identity and role.
- `GET /api/v1/profile` & `PUT /api/v1/profile` — Student profile and preferences.
- `GET /api/v1/recommendations` — Fit score matching engine based on student academic profile.
- `GET /api/v1/tracker/board` — User Kanban board, stage columns, and WIP limits.
- `GET /api/v1/tracker/items` & `POST /api/v1/tracker/items` — Application items and checklist tasks.
- `PATCH /api/v1/tracker/items/:id/move` — Stage drag-and-drop transitions.
- `GET /api/v1/budget` & `POST /api/v1/budget` — Student cost-of-living and tuition budget models.

### Admin & Data Operations
- `GET /api/v1/admin/dashboard/stats` — Metrics for universities, programs, staged changes, and sync status.
- `GET /api/v1/admin/staged-changes` — Staging queue for crawled or ingested modifications.
- `POST /api/v1/admin/staged-changes/:id/approve` & `reject` — Human-in-the-loop review workflow.
- `POST /api/v1/admin/staged-changes/bulk-approve-cricos` — High-throughput CRICOS reconciler.
- `GET /api/v1/admin/cricos/resources` & `inspect-fields` — Raw CKAN resource inspector.
- `POST /api/v1/admin/cricos/sync` — Trigger on-demand sync from Australian Government data.
- `POST /api/v1/admin/universities/:id/discover-programs` — Web crawling & LLM program extraction.
- `GET /api/v1/admin/settings/ai` & `POST /api/v1/admin/settings/ai` — Configure LLM providers (Groq, Ollama).

---

## 4. Main Business Entities

1. **`University` (`University.model.ts`)**
   - Core educational institution in Australia (e.g., University of Melbourne, UNSW).
   - Contains ranking positions, location, campus lists, accreditation, CRICOS provider code, website, and logo.
2. **`Program` (`Program.model.ts`)**
   - Course offerings associated with a University.
   - Contains degree level (bachelor, master, PhD, diploma), CRICOS course code, local & international tuition fees, duration, intake months, English language requirements (IELTS, PTE, TOEFL), and career pathways.
3. **`Scholarship` (`Scholarship.model.ts`)**
   - Financial aids, grants, and bursaries linked to institutions or government bodies.
   - Contains value, coverage type, eligibility rules, citizenship constraints, and application deadlines.
4. **`ApplicationTracker` & `TrackerBoard` (`ApplicationTracker.model.ts`, `TrackerBoard.model.ts`)**
   - Student CRM tracking university applications through customizable pipeline stages.
   - Includes document checklists, reminders, tasks, priority, deadlines, and audit history.
5. **`StudentProfile` & `BudgetPlan` (`StudentProfile.model.ts`, `BudgetPlan.model.ts`)**
   - Student academic history (GPA, IELTS/PTE scores), destination preferences, migration interests, and financial budget projections (tuition + living cost).
6. **`StagedChange` (`StagedChange.model.ts`)**
   - Staging table holding proposed updates from automated crawlers, CRICOS syncs, or AI extractors before committing to live production records.
7. **`CricosRaw` Family (`CricosInstitutionRaw`, `CricosCourseRaw`, `CricosLocationRaw`, `CricosCourseLocationRaw`)**
   - Exact raw CKAN datastore snapshots for auditability and schema divergence detection.
8. **`IngestionJob` & `SyncJob` (`IngestionJob.model.ts`, `SyncJob.model.ts`)**
   - Tracks lifecycle, visited URLs, error logs, and metrics of background extraction tasks.

---

## 5. Known Legacy Fields & Model Aliases

During modernization, the following dual-field conventions and legacy mappings were normalized to prevent runtime exceptions:

| Domain | Canonical Field | Legacy / Aliased Field | Notes |
| :--- | :--- | :--- | :--- |
| **University** | `logo` | `logoUrl` | Supported across public and admin interfaces. |
| **University** | `cricosProviderCode` | `providerCode` | Used for government registry lookups. |
| **University** | `city`, `state`, `country` | `location` | Compound string vs granular address fields. |
| **Program** | `tuitionFeeInternational` | `tuitionFee` | Distinguishes domestic vs international fee schedules. |
| **Program** | `university` (`ObjectId`) | `universityId` / populated object | Normalized in controllers and frontend interfaces. |
| **Program** | `level` | Degree enum | Normalized to support `graduate_certificate`, `secondary`, `elicos`, `non_award`. |

---

## 6. External Data Sources & Connectors

1. **Australian Government CRICOS Registry (data.gov.au)**
   - API Protocol: CKAN Action API (`datastore_search`).
   - Datasets: Institutions, Courses, Locations, Course-Locations.
   - Synchronized periodically to ensure compliance and course accreditation accuracy.
2. **University Web Crawlers (`backend/src/services/crawler.service.ts`)**
   - Built on `Crawlee` and `Cheerio` with strict domain restrictions, rate limiting (1.5s delay), and custom user-agent headers.
3. **Structured AI Extraction (`backend/src/services/aiExtraction.service.ts`)**
   - Uses LangChain with Groq (`llama3-70b-8192`) or local Ollama.
   - Output parser enforces Zod JSON schemas for admissions criteria and fees.
4. **Rankings & Outcomes Data (QILT / QS / THE)**
   - Seeded and synchronized into `RankingRecord` and `OutcomeMetric` models to power the radar comparison and fit-score calculators.
