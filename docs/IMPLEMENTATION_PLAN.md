# Outvier — Detailed Implementation Plan
**Last updated:** 2026-04-30  
**Status:** Phase 0.5 complete, Phase 1 partially complete

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [What Has Been Implemented](#2-what-has-been-implemented)
3. [What Is Partially Done — With Specific Gaps](#3-what-is-partially-done--with-specific-gaps)
4. [What Is Completely Missing](#4-what-is-completely-missing)
5. [Known Bugs and Broken Behaviours](#5-known-bugs-and-broken-behaviours)
6. [Codebase Structure Reference](#6-codebase-structure-reference)
7. [Phase-by-Phase Implementation Plan (Remaining Work)](#7-phase-by-phase-implementation-plan-remaining-work)
8. [Environment Variables Required](#8-environment-variables-required)
9. [Dependencies to Install](#9-dependencies-to-install)
10. [Manual QA Checklist](#10-manual-qa-checklist)

---

## 1. Project Overview

Outvier is a full-stack TypeScript study-in-Australia decision-support platform.

**Backend:** Node.js + Express + TypeScript + MongoDB (Mongoose) + BullMQ + Redis  
**Frontend:** Next.js 16 (App Router) + Tailwind CSS v4 + Shadcn/UI + TanStack Query  
**AI:** LangChain + Groq (NVIDIA and Mistral stubs not yet wired)  
**Queue:** BullMQ + Redis for async crawling/sync jobs  
**Analytics:** Power BI embed (optional) + Recharts (not yet installed)

The platform has two primary user flows:

**Admin flow:** Add universities → trigger enrichment → review staged changes → approve → publish  
**Student flow:** Browse universities → compare → build profile → get fit recommendations → use AI copilot

---

## 2. What Has Been Implemented

### Phase 0.5 — Security (COMPLETE)
- `backend/.gitignore` — covers `.env`, `node_modules`, `dist`
- `frontend/.gitignore` — covers `.env.local`, `.next`, `node_modules`
- Root `.gitignore` — umbrella coverage
- Confirmed: actual `.env` file is NOT tracked in git (only `.env.example` is)

### Phase 1 — Route Mounting & API Consistency (MOSTLY COMPLETE)

**Backend — new files created:**
- `backend/src/controllers/aiSettings.controller.ts` — GET settings (masked keys), POST upsert, POST test connection, POST activate provider
- `backend/src/controllers/recommendations.controller.ts` — GET /recommendations/me, POST /recommendations/profile
- `backend/src/routes/aiSettings.routes.ts` — mounts at `/api/v1/admin/settings/ai`
- `backend/src/routes/recommendations.routes.ts` — mounts at `/api/v1/recommendations`
- `backend/src/routes/publicAnalytics.routes.ts` — mounts at `/api/v1/analytics`
- `backend/src/jobs/workerProcess.ts` — standalone worker entry point (no HTTP server)

**Backend — files updated:**
- `backend/src/app.ts` — now mounts all routes including new aiSettings, recommendations, publicAnalytics
- `backend/src/routes/admin.routes.ts` — removed duplicate `/analytics/embed-token` stub
- `backend/src/routes/analytics.routes.ts` — added `GET /` for admin analytics stats
- `backend/src/controllers/analytics.controller.ts` — added `getAdminAnalytics()` and `getPublicAnalytics()`
- `backend/src/controllers/admin.controller.ts` — removed dead `getEmbedToken()` method and `powerbiService` import
- `backend/src/jobs/workers/universitySync.worker.ts` — fixed `errors` → `errorCount` (TypeScript bug)
- `backend/package.json` — added `dev:worker` and `start:worker` scripts

**Frontend — files updated:**
- `frontend/src/lib/api/admin.api.ts` — fixed `confirmImport(id)` to send NO body; added `cancelImport`, `getAdminAnalytics`, `getAISettings`, `upsertAISetting`, `testAIConnection`, `activateAIProvider`

**Frontend — new files created:**
- `frontend/src/lib/api/recommendations.api.ts` — `getMyRecommendations()`, `getRecommendationsForProfile(profile)`

### Pre-existing Features (Working Before This Work)
- Auth: signup, login, logout, getMe — working with JWT + bcrypt
- Universities: public list/filter/search, detail, states list
- Programs: public list/filter/search, detail, fields list
- Admin: university/program CRUD (manual)
- Admin: dashboard stats (total counts + breakdowns)
- Admin: Seed CSV import (preview → staged → confirm)
- Admin: Staged changes (approve/reject/bulk/edit-approve)
- Admin: Sync jobs (trigger, list, retry)
- Admin: Data sources (list, create, delete) under `/admin/sync/data-sources`
- Admin: Power BI token generation (mocked if not configured)
- Comparison sessions (program-based, hash-identified, anonymous or authenticated)
- Student profile (CRUD, save/unsave university/program)
- Fit score service (runs on comparison session)
- AI copilot (Groq only, LangChain, context-aware via comparison session)
- AI copilot floating widget in frontend

---

## 3. What Is Partially Done — With Specific Gaps

### 3.1 Admin AI Settings Page
**File:** `frontend/src/app/admin/settings/ai-providers/page.tsx`

**Current state:**
- Saves API key to `localStorage` — CRITICAL SECURITY ISSUE
- Provider dropdown shows "Gemini" and "OpenAI" instead of Groq, NVIDIA, Mistral
- No connection to the backend API at all — just reads/writes `localStorage`
- No "Test Connection" button wired to backend
- No "Set Active" concept

**What needs to happen:**
1. Replace entire page UI to use `adminApi.getAISettings()`, `adminApi.upsertAISetting()`, `adminApi.testAIConnection()`, `adminApi.activateAIProvider()`
2. Fix provider list to: Groq, NVIDIA (OpenAI-compatible), Mistral
3. Show masked key fetched from backend, not from localStorage
4. Show `lastTestedAt`, `testStatus` per provider
5. "Test Connection" triggers `POST /admin/settings/ai/test`
6. API key is stored encrypted in MongoDB, NOT in localStorage

---

### 3.2 Fit Score — Uses Legacy Fields, Not Approved Records
**File:** `backend/src/services/fitScore.service.ts`

**Current state:**
- Affordability: uses `program.annualTuition` (legacy inline field, often empty), fallback `35000`
- Ranking: 80/100 hardcoded dummy for ALL universities
- Employability: 80/100 hardcoded dummy for ALL universities
- Scholarship: 50/100 hardcoded dummy for ALL universities
- Admission match: uses `program.ieltsRequirement` (exists in new schema fields)
- Location: uses `university.state` (works)
- Missing data warnings: none — student never knows when data is fake

**What needs to happen:**
1. Affordability: first try `TuitionRecord` (approved, for that programId or universityId + year=latest), fall back to `program.annualTuition`, then `35000`
2. Ranking: query `RankingRecord` (approved, for that universityId), use `globalRank` scaled (rank 1 = 100, rank 500+ = 0)
3. Employability: query `OutcomeMetric` (approved, for universityId), use `graduateEmploymentRate`
4. Scholarship: query `Scholarship` (approved, for universityId), score by count (any = 80, none = 20)
5. Add `missingDataWarnings: string[]` to `FitScoreResult`
6. Add `sourceFreshness: Date | null` (oldest `fetchedAt` among records used)
7. Add `getWeightsFromPreset(preset)` function

---

### 3.3 Student Profile — No Preset System
**File:** `frontend/src/app/dashboard/profile/page.tsx`

**Current state:**
- Shows 6 raw percentage sliders (affordability, ranking, employability, admissionMatch, location, scholarship) — confusing for students
- Students must manually set percentages and ensure they sum to 100%
- No concept of "I care most about budget" or "career outcome matters most"

**What needs to happen:**
1. Backend: Add `priorityPreset` field to `StudentProfile.model.ts`
2. Backend: `getWeightsFromPreset(preset)` in fitScore.service.ts
3. Backend: In `studentProfile.controller.ts`, when `priorityPreset` is set during update, auto-compute `priorityWeights` before saving
4. Frontend: Replace weight sliders with a preset radio group:
   - "Balanced recommendation" → `balanced`
   - "Lower cost matters most" → `budget`
   - "Career outcome matters most" → `career`
   - "Better ranking matters most" → `prestige`
   - "Easier admission matters most" → `easy-admission`
   - "Scholarships matter most" → `scholarship`
5. Show a summary of what each preset prioritises (small descriptive text)
6. Keep the sliders available in an "Advanced" collapsible section for power users

---

### 3.4 Comparison — Program-only, No University Comparison
**File:** `frontend/src/context/ComparisonContext.tsx`  
**File:** `backend/src/routes/comparison.routes.ts`

**Current state:**
- `ComparisonSession` model has `selectedUniversityIds` AND `selectedProgramIds`
- Backend routes only handle programs (`add-program`, `remove-program`, `scores`)
- Frontend `ComparisonContext` only tracks `selectedProgramIds` (state variable `selectedIds`)
- "Add to Compare" on university cards does not exist — only save exists
- `/compare/[hash]` page shows programs only

**What needs to happen:**

Backend — add to `comparison.routes.ts`:
```
POST   /:hash/add-university
DELETE /:hash/remove-university
GET    /:hash/university-scores
POST   /universities   (direct comparison without session)
```

Backend — add to `comparison.controller.ts`:
- `addUniversity(req, res)` — max 4, addToSet, 409 if already 4
- `removeUniversity(req, res)` — pull
- `getUniversityScores(req, res)` — calls `fitScoreService.calculateUniversityScores()`
- `compareUniversities(req, res)` — stateless direct compare for up to 4 universities

Backend — add to `fitScore.service.ts`:
- `calculateUniversityScores(profile, universities)` — aggregates approved RankingRecord, TuitionRecord, OutcomeMetric, Scholarship per university; returns university-level fit scores with same breakdown shape

Frontend — update `ComparisonContext.tsx`:
- Add `selectedUniversityIds: string[]` state
- Add `addUniversity(id)` (max 4), `removeUniversity(id)`
- Persist university hash separately in localStorage (`outvier_comparison_hash_uni`) OR extend same session

Frontend — update comparison page `/compare/[hash]`:
- Add tab/toggle: "Compare Programs" vs "Compare Universities"
- University comparison shows: name, city/state, ranking, tuition, employment rate, scholarships, programs count
- Add Recharts bar charts (ranking, tuition, employment rate)
- Add radar chart (fit score dimensions)
- Add "winner" badge cards

Frontend — update `UniversityCard.tsx`:
- Add "Add to Compare" button (alongside existing "Save")

---

### 3.5 University Detail Page — Static Only
**File:** `frontend/src/app/universities/[slug]/page.tsx`

**Current state:** Shows only static University document fields. No rankings, no tuition, no scholarships, no outcomes, no programs section.

**Backend gap:** `universityService.getBySlug()` returns only the University document. Does not query `RankingRecord`, `TuitionRecord`, `OutcomeMetric`, `Scholarship` for that university.

**What needs to happen:**

Backend — update `university.controller.ts` `getBySlug`:
```typescript
const [university, rankings, tuition, outcomes, scholarships] = await Promise.all([
  University.findOne({ slug }),
  RankingRecord.find({ universityId: uni._id, status: 'approved' }).sort({ year: -1 }).limit(5),
  TuitionRecord.find({ universityId: uni._id, status: 'approved' }).sort({ year: -1 }).limit(3),
  OutcomeMetric.find({ universityId: uni._id, status: 'approved' }).sort({ year: -1 }).limit(1),
  Scholarship.find({ universityId: uni._id, status: 'approved' }).limit(10),
]);
```

Return enriched response with all these sections.

Frontend — rebuild university detail page with tabs:
- Overview (logo, description, campuses, website, CRICOS)
- Rankings (QS/THE/ARWU table by year — or "No ranking data yet" if empty)
- Programs (list programs for this university — paginated)
- Tuition (by program level — or "No tuition data yet")
- Scholarships (cards — or "No scholarship data yet")
- Outcomes (employment rate, median salary, teaching quality — or "No outcome data yet")
- Source Freshness (table showing each data type, source, last verified date, confidence)

Add `DataFreshnessLabel` component: shows coloured badge (green = fresh <30 days, amber = 30-90 days, red = stale >90 days, grey = no data)

---

### 3.6 Sync Workers — Very Thin Extraction
**File:** `backend/src/services/connectors/universityOfficial.connector.ts`

**Current state:** Only extracts:
- `meta[name=description]` content → university description
- Regex search for 4-digit year → `establishedYear`
- Returns confidence 0.85 if meta found, 0.1 if nothing found

**What needs to happen:**
- Extend to detect and score internal links for: programs page, fees/tuition page, scholarships page, international students page
- Create `sourceDiscovery.connector.ts` that extracts all internal links, scores by keyword, and creates `DataSource` records for high-confidence links
- Integrate source discovery into `universitySync.worker.ts` after the main connector runs
- Wire `tuitionSync.worker.ts` to actually scrape a tuition DataSource URL (if one exists)
- Wire `scholarshipSync.worker.ts` to actually scrape a scholarship DataSource URL (if one exists)

All other workers (`programSync`, `rankingSync`, `outcomeSync`) currently have no actual connector — they just create a SyncJob record and mark it completed without doing anything.

---

### 3.7 AI Service — Groq Only, No Multi-Provider
**File:** `backend/src/services/ai.service.ts`

**Current state:**
- `getModel()` checks DB for active `AIProviderSetting`, falls back to env `GROQ_API_KEY`
- If provider is NOT groq → throws `"Provider X is not fully implemented yet"`
- No provider factory, no abstraction
- NVIDIA and Mistral are no-ops

**What needs to happen:**
- Create provider abstraction in `backend/src/services/ai/providers/`
- Implement `groq.provider.ts` (move existing LangChain ChatGroq logic)
- Implement `nvidia.provider.ts` (OpenAI-compatible API via `NVIDIA_BASE_URL`)
- Implement `mistral.provider.ts` (Mistral REST API)
- Create `providerFactory.ts` — reads active AIProviderSetting, decrypts key, returns correct provider
- Update `ai.service.ts` to use factory

---

### 3.8 Import Cancel Endpoint Missing
**File:** `backend/src/routes/imports.routes.ts`  
**File:** `backend/src/services/seedImport.service.ts`

**Current state:** Cancel route does not exist. `seedImportService.cancel()` does not exist.

**What needs to happen:**
- Add `cancel(jobId)` to `seedImportService`
- Add `POST /:id/cancel` route
- Add cancel button to frontend preview page

---

### 3.9 Staged Changes — applyApprovedChange Not Fully Wired
**File:** `backend/src/controllers/stagedChanges.controller.ts`

**Current state:** Need to read the actual file to verify `applyApprovedChange` handles all entity types (university, program, ranking, tuition, outcome, scholarship).

**Concern:** If `applyApprovedChange` only handles `university` and `program`, then approving a `RankingRecord` staged change will silently fail or error without publishing any data.

**Action needed:** Read `stagedChanges.controller.ts`, verify all entity type branches exist, add missing ones.

---

### 3.10 Homepage — Not University-First
**File:** `frontend/src/app/page.tsx`

**Current state:** Shows a hero section ("Comparative Analytics Dashboard") with stats about programs and universities. No "Find your best-fit Australian university" messaging. No featured universities section.

**What needs to happen:**
- Update hero headline: "Find Your Best-Fit Australian University"
- Sub-headline: "Compare universities, get personalised recommendations, and make confident study decisions."
- Main CTA: "Explore Universities" → `/universities`
- Secondary CTA: "How it works" → anchor
- Add "Featured Universities" section (3–4 university cards from the database)
- Add "How Outvier works" 3-step section:
  1. Search and explore universities
  2. Build your profile and get a personalised Fit Score
  3. Ask the AI Copilot anything
- Remove/repurpose static stats widget (or make it dynamic from `/api/v1/analytics`)

---

### 3.11 Admin Analytics Page — Power BI Only, No Recharts
**File:** `frontend/src/app/admin/analytics/page.tsx`

**Current state:** Calls `getPowerBiToken()` and tries to embed a Power BI report. Falls back to a message if not configured. No built-in charts.

**What needs to happen:**
- Add a primary "Built-in Analytics" tab using Recharts
- Fetch from `GET /admin/analytics` (newly created endpoint)
- Show: total students, total comparisons, pending staged changes, sync jobs by status pie, staged changes by entity type
- Keep Power BI as a secondary "Power BI" tab
- Gracefully show "Power BI not configured" message if token fetch fails — do NOT crash

---

### 3.12 Student Fit Page — Still Uses Comparison Session Scores
**File:** `frontend/src/app/dashboard/student-fit/page.tsx`

**Current state:** Calls `comparisonApi.getScores()` for the comparison session — shows program scores from whatever programs the student has added to comparison. This is not a recommendation engine.

**What needs to happen:**
- Call `GET /api/v1/recommendations/me` (new endpoint, created in Phase 1)
- Show top 10 programs ranked by fit score based on student's profile
- Show `missingDataWarnings` (amber badge when data is dummy/absent)
- Show `sourceFreshness` date
- Show "Complete your profile to improve recommendations" if profile is empty

---

### 3.13 Admin Add University — Wrong Fields
**File:** `frontend/src/app/admin/universities/new/page.tsx`

**Current state:** Unknown — need to inspect. The backend validator `createUniversitySchema` uses legacy fields (`name`, `description`, `location`, `website`, `logo`, `type`). These do NOT match the new University model's primary fields (`universityName`, `officialWebsite`, `shortName`, `cricosProviderCode`, `logoUrl`, `providerType`, `state`, `city`).

**What needs to happen:**
- Read both the new page and the validator
- Update `university.validator.ts` to accept both old fields (for CRUD) and new seed fields (for the Add University flow)
- Or split into two schemas: `createUniversityShellSchema` for admin add, keep old for CRUD
- Add "Start enrichment" button on success

---

### 3.14 University Cards — Missing Rich Info
**File:** `frontend/src/components/ui-custom/UniversityCard.tsx`

**Current state:** Shows name, type badge, location, established year. Has a "Save" button. No "Add to Compare" button. No ranking badge. No affordability indicator.

**What needs to happen:**
- Add ranking badge: shows `university.ranking` or "Unranked" if null (colour-coded: gold ≤50, silver ≤100, blue ≤200)
- Add affordability indicator: derived from average program tuition or TuitionRecord average
- Add "Add to Compare" button that triggers `ComparisonContext.addUniversity(id)`
- Add data freshness dot (green/amber/red)

---

## 4. What Is Completely Missing

| Feature | Affected Files | Priority |
|---------|---------------|----------|
| Priority preset system (Backend model + weights function) | `StudentProfile.model.ts`, `fitScore.service.ts`, `studentProfile.controller.ts` | High |
| Priority preset system (Frontend UI) | `dashboard/profile/page.tsx` | High |
| University comparison routes + controller | `comparison.routes.ts`, `comparison.controller.ts` | High |
| University comparison frontend + charts | `compare/[hash]/page.tsx`, `ComparisonContext.tsx` | High |
| University detail dynamic sections | `universities/[slug]/page.tsx`, `university.controller.ts` | High |
| University-first homepage | `app/page.tsx` | High |
| Admin AI settings page wired to backend | `admin/settings/ai-providers/page.tsx` | High |
| AI multi-provider factory (NVIDIA, Mistral) | New files under `backend/src/services/ai/providers/` | High |
| Real fit score (approved records, not dummies) | `fitScore.service.ts` | High |
| Source discovery connector | New file: `connectors/sourceDiscovery.connector.ts` | Medium |
| Tuition sync worker actually scraping | `tuitionSync.worker.ts` | Medium |
| Scholarship sync worker actually scraping | `scholarshipSync.worker.ts` | Medium |
| Admin analytics page with Recharts | `admin/analytics/page.tsx` | Medium |
| Student fit page wired to recommendations endpoint | `dashboard/student-fit/page.tsx` | Medium |
| Import cancel endpoint (backend + frontend) | `seedImport.service.ts`, `imports.routes.ts`, preview page | Medium |
| University cards "Add to Compare" button | `UniversityCard.tsx` | Medium |
| DataFreshnessLabel component | New component | Medium |
| Auth redirect guards (login/signup for logged-in users) | `login/page.tsx`, `signup/page.tsx` | Low-Medium |
| Old CSV bulk upload removal from navigation | `admin/universities/page.tsx`, `admin/programs/page.tsx` | Medium |
| Backend tests | New dir: `backend/src/__tests__/` | Medium |
| recharts package | `frontend/package.json` | Required for charts |
| Public analytics page in frontend | New page or section | Low |
| Admin business dashboard page (full analytics) | `admin/analytics/page.tsx` | Medium |
| Staged changes `applyApprovedChange` — all entity types | `stagedChanges.controller.ts` | High |
| docs/ folder documentation files | Entire `docs/` folder | Low |

---

## 5. Known Bugs and Broken Behaviours

### BUG-01: AI Settings Stores Key in localStorage
**Severity:** Critical  
**File:** `frontend/src/app/admin/settings/ai-providers/page.tsx`  
**Issue:** Line 33 — `localStorage.setItem('outvier_ai_settings', JSON.stringify({ provider, apiKey, model }))` stores the plaintext API key in browser localStorage. Any XSS or browser inspection exposes the key.  
**Fix:** Remove localStorage storage entirely. API key must only be sent to backend once via `POST /admin/settings/ai`, stored encrypted in MongoDB, and returned masked thereafter.

---

### BUG-02: AI Settings Shows Wrong Providers
**Severity:** High  
**File:** `frontend/src/app/admin/settings/ai-providers/page.tsx`  
**Issue:** Provider dropdown shows "Gemini" and "OpenAI" — neither of which are supported by the backend. Backend supports: Groq, NVIDIA, Mistral.  
**Fix:** Replace dropdown options with Groq, NVIDIA (OpenAI-compatible), Mistral.

---

### BUG-03: Comparison Max-4 Not Enforced at Backend
**Severity:** High  
**File:** `backend/src/controllers/comparison.controller.ts` — `addProgram()`  
**Issue:** Uses `$addToSet` to add programs but does NOT check if the array already has 4 items. A user can add unlimited programs.  
**Fix:** Before the update, check `session.selectedProgramIds.length >= 4` and return 400 with "Maximum 4 programs allowed".

---

### BUG-04: confirmImport Frontend Was Sending Rows
**Severity:** High (FIXED in Phase 1)  
**File:** `frontend/src/lib/api/admin.api.ts`  
**Issue:** Was: `api.post('/admin/imports/${id}/confirm', { rows })` — sending validated row data from frontend. This is a security and consistency issue.  
**Status:** Fixed. Now sends no body.

---

### BUG-05: Comparison `addProgram` Uses Wrong User ID Field
**Severity:** Medium  
**File:** `backend/src/controllers/comparison.controller.ts`  
**Issue:** `createSession` uses `(req as any).user?._id` but `protect` middleware sets `req.user.id` (not `._id`). So userId is always `undefined` — comparison sessions are never linked to authenticated users.  
**Fix:** Change `(req as any).user?._id` → `(req as any).user?.id` in both `createSession` and `getScores`.

---

### BUG-06: AI Copilot Context Uses Wrong Field for University
**Severity:** Medium  
**File:** `backend/src/services/ai.service.ts` line 66  
**Issue:** `.populate('universityId', 'name')` — but the Program model uses field `university` (ObjectId ref) for legacy programs, and `universityId` as an alias. If the program uses the legacy `university` field, the populate fails and universityId resolves to null.  
**Fix:** Populate both: `.populate('university', 'name').populate('universityId', 'name')` — or standardise the field name in the Program model.

---

### BUG-07: University Fit Score — Ranking and Employability Always 80/100
**Severity:** High  
**File:** `backend/src/services/fitScore.service.ts` lines 94–95  
**Issue:** `totalScore += (80 * (weights.ranking / totalWeight))` — ranking and employability are hardcoded to 80 for every university. This makes the fit score meaningless for distinguishing universities.  
**Fix:** Query approved RankingRecord and OutcomeMetric for real values (see Section 3.2).

---

### BUG-08: No Max-4 Guard on University Comparison (Not Yet Built)
**Severity:** High (future — route doesn't exist yet)  
**Note:** When university comparison routes are built, ensure `selectedUniversityIds.length >= 4` check is present before allowing `add-university`.

---

### BUG-09: `protect` Middleware Uses Hardcoded Fallback Secret
**Severity:** Medium  
**File:** `backend/src/middleware/auth.middleware.ts` line 22  
**Issue:** `const secret = process.env.JWT_SECRET || 'outvier_secret_key_2024'` — if JWT_SECRET is not set, falls back to a weak predictable value.  
**Fix:** Remove the fallback. Throw a startup error if JWT_SECRET is missing.

---

### BUG-10: University `getAll` Does Not Filter by `status: 'active'`
**Severity:** Medium  
**File:** `backend/src/services/university.service.ts` line 16  
**Issue:** `const filter: Record<string, unknown> = {}` — no status filter. Universities with `status: 'draft'` are returned in the public listing.  
**Fix:** Add `filter.status = 'active'` as a default filter.

---

### BUG-11: Programs `getAll` Does Not Filter by `status: 'active'`
**Severity:** Medium  
**File:** `backend/src/services/program.service.ts`  
**Same issue as BUG-10 — draft programs visible to students.**

---

### BUG-12: TypeScript — `any[]` in `fitScore.service.ts`
**Severity:** Low  
**File:** `backend/src/services/fitScore.service.ts` line 23  
**Issue:** `programs: any[]` — no type safety on the program list.  
**Fix:** Type as `Partial<IProgram> & { university?: Partial<IUniversity> }[]`

---

## 6. Codebase Structure Reference

### Backend (`backend/src/`)

```
app.ts                          — Express app + route mounting
server.ts                       — HTTP server + worker init + graceful shutdown

config/
  db.ts                         — MongoDB connection
  redis.ts                      — Redis singleton for BullMQ

controllers/
  admin.controller.ts           — Dashboard stats, university/program CRUD, users list
  ai.controller.ts              — POST /copilot/chat
  aiSettings.controller.ts      — GET/POST /admin/settings/ai (NEW Phase 1)
  analytics.controller.ts       — getPowerBiToken, getAdminAnalytics, getPublicAnalytics
  comparison.controller.ts      — createSession, getSession, addProgram, removeProgram, getScores
  imports.controller.ts         — uploadSeedCSV, confirmImport, listImports, getImport
  program.controller.ts         — getAll, getBySlug, getByUniversity, getFields
  recommendations.controller.ts — getMyRecommendations, getRecommendationsForProfile (NEW Phase 1)
  stagedChanges.controller.ts   — list, approve, reject, editAndApprove, bulkApprove, bulkReject
  studentProfile.controller.ts  — getProfile, updateProfile, save/unsave university/program
  sync.controller.ts            — trigger jobs, list jobs, retry, list/create/update/delete data sources
  university.controller.ts      — getAll, getBySlug, getStates
  upload.controller.ts          — uploadUniversities, uploadPrograms (OLD — direct upsert)

routes/
  admin.routes.ts               — /api/v1/admin/* (CRUD)
  ai.routes.ts                  — /api/v1/copilot
  aiSettings.routes.ts          — /api/v1/admin/settings/ai (NEW Phase 1)
  analytics.routes.ts           — /api/v1/admin/analytics
  auth.routes.ts                — /api/v1/auth
  comparison.routes.ts          — /api/v1/comparison
  imports.routes.ts             — /api/v1/admin/imports
  program.routes.ts             — /api/v1/programs
  publicAnalytics.routes.ts     — /api/v1/analytics (NEW Phase 1)
  recommendations.routes.ts     — /api/v1/recommendations (NEW Phase 1)
  stagedChanges.routes.ts       — /api/v1/admin/staged-changes
  studentProfile.routes.ts      — /api/v1/profile
  sync.routes.ts                — /api/v1/admin/sync
  university.routes.ts          — /api/v1/universities

models/ (15 Mongoose models)
  AIProviderSetting.model.ts    — provider, aiModel, encryptedApiKey, isActive, testStatus
  ChatLog.model.ts              — userId, sessionKey, provider, question, answer
  ComparisonSession.model.ts    — userId, sessionKey, selectedUniversityIds[], selectedProgramIds[], generatedScores
  DataSource.model.ts           — name, type, baseUrl, allowed, refreshFrequency, status
  OutcomeMetric.model.ts        — universityId, programId, source, year, employmentRate, medianSalary
  Program.model.ts              — legacy fields + new fields, status, dataQuality
  RankingRecord.model.ts        — universityId, source (QS/THE/ARWU), year, globalRank, nationalRank
  Scholarship.model.ts          — universityId, title, amount, eligibility, deadline, status
  StagedChange.model.ts         — entityType, changeType, oldValue, newValue, confidence, status
  StudentProfile.model.ts       — userId, preferences, priorityWeights, savedUniversities, savedPrograms
  SyncJob.model.ts              — jobType, targetUniversityId, status, startedAt, finishedAt, stats
  TuitionRecord.model.ts        — universityId, programId, year, annualTuition, currency, status
  University.model.ts           — legacy + new fields (officialWebsite, cricosProviderCode, campusDetails), status
  UploadJob.model.ts            — entity, originalFilename, status, previewRows, rowErrors
  User.model.ts                 — name, email, passwordHash, role ('user'|'admin'), status

services/
  ai.service.ts                 — getModel() [Groq only], generateResponse()
  auth.service.ts               — signup, login, getMe
  fitScore.service.ts           — calculateScores() [partial — uses dummy values for ranking/employability]
  powerbi.service.ts            — getAccessToken(), getEmbedToken()
  program.service.ts            — getAll, getBySlug, getById, getByUniversity, create, update, delete
  seedImport.service.ts         — preview(), confirm() [cancel() MISSING]
  university.service.ts         — getAll, getBySlug, getById, create, update, delete, getStates
  upload.service.ts             — processUniversitiesCSV [OLD — direct upsert, should be removed]
  
  connectors/
    base.connector.ts           — Abstract BaseConnector class
    universityOfficial.connector.ts — Fetches HTML, extracts meta description + year only

middleware/
  auth.middleware.ts            — protect, optionalAuth, adminOnly
  error.middleware.ts           — errorHandler, notFound
  validate.middleware.ts        — Zod schema validation wrapper

validators/
  auth.validator.ts             — loginSchema, signupSchema
  program.validator.ts          — createProgramSchema (legacy fields)
  seedUniversity.validator.ts   — seedUniversityRowSchema
  university.validator.ts       — createUniversitySchema (legacy fields — NEEDS UPDATE)

jobs/
  queue.ts                      — 6 BullMQ queues (university-sync, program-sync, tuition-sync, scholarship-sync, ranking-sync, outcome-sync)
  workerProcess.ts              — Standalone entry point for workers (NEW Phase 1)
  workers/
    index.ts                    — Exports all workers + closeWorkers()
    universitySync.worker.ts    — Runs universityOfficialConnector, creates StagedChanges
    programSync.worker.ts       — Creates SyncJob record, marks completed (NO actual extraction)
    tuitionSync.worker.ts       — Creates SyncJob record, marks completed (NO actual extraction)
    scholarshipSync.worker.ts   — Creates SyncJob record, marks completed (NO actual extraction)
    rankingSync.worker.ts       — Creates SyncJob record, marks completed (NO actual extraction)
    outcomeSync.worker.ts       — Creates SyncJob record, marks completed (NO actual extraction)

utils/
  encryption.ts                 — encryptText(), decryptText() using CryptoJS AES

seed/
  seed.ts                       — Database seeding script
```

### Frontend (`frontend/src/`)

```
app/
  layout.tsx                    — Root layout with providers, AICopilot floating widget
  page.tsx                      — Homepage (NOT university-first yet)
  providers.tsx                 — TanStack Query + theme provider
  
  login/page.tsx                — Login (no redirect guard for already-logged-in users)
  signup/page.tsx               — Signup (no redirect guard)
  
  universities/
    page.tsx                    — List + filter (search, state, type)
    [slug]/page.tsx             — Detail (static only, no dynamic sections)
  
  programs/
    page.tsx                    — List + filter
    [slug]/page.tsx             — Detail
  
  compare/
    [hash]/page.tsx             — Program comparison only, NO university comparison, NO charts
  
  dashboard/
    layout.tsx                  — Auth check (no auth → /login, admin → /admin)
    page.tsx                    — Overview (profile completeness, top fit scores, saved count)
    profile/page.tsx            — Raw weight sliders (NOT preset-based)
    student-fit/page.tsx        — Uses comparison session scores (NOT recommendations endpoint)
    saved/page.tsx              — Saved programs + universities tabbed

  admin/
    layout.tsx                  — Auth check (non-admin → /dashboard)
    page.tsx                    — Dashboard stats
    universities/
      page.tsx                  — List + CRUD + (has bulk upload CSV button — should be removed)
      new/page.tsx              — Create form (legacy fields — needs update)
      [id]/edit/page.tsx        — Edit form
    programs/
      page.tsx                  — List + CRUD + (has bulk upload CSV button — should be removed)
      new/page.tsx              — Create form
      [id]/edit/page.tsx        — Edit form
    imports/
      page.tsx                  — Import history list
      new/page.tsx              — Upload CSV form
      [id]/preview/page.tsx     — Preview + confirm (CORRECT — sends no rows body)
      [id]/errors/page.tsx      — Error details
    staged-changes/page.tsx     — Approve/reject workflow
    sync/page.tsx               — Sync jobs list + trigger
    data-sources/page.tsx       — Correctly calls /admin/sync/data-sources
    analytics/page.tsx          — Power BI only (no Recharts)
    settings/
      ai-providers/page.tsx     — BROKEN (localStorage, wrong providers, not wired to backend)

lib/
  api.ts                        — Axios instance with Bearer token injection + 401 handler
  utils.ts                      — shadcn cn() utility
  api/
    admin.api.ts                — All admin API calls (updated in Phase 1)
    ai.api.ts                   — POST /copilot/chat
    auth.api.ts                 — signup, login, logout, getMe
    comparison.api.ts           — createSession, getSession, addProgram, removeProgram, getScores
    profile.api.ts              — getProfile, updateProfile, save/unsave
    programs.api.ts             — getAll, getBySlug, getFields (+ bulkUpload — should be removed)
    recommendations.api.ts      — getMyRecommendations, getRecommendationsForProfile (NEW Phase 1)
    universities.api.ts         — getAll, getBySlug, getPrograms, getStates (+ bulkUpload — should be removed)

context/
  ComparisonContext.tsx         — Manages program IDs only (university IDs NOT tracked)

hooks/
  useDebounce.ts                — Generic debounce

components/
  AICopilot.tsx                 — Floating chat widget (calls /copilot/chat via ai.api.ts)
  PowerBIEmbed.tsx              — Power BI embedding component
  admin/
    CsvUploader.tsx             — File upload UI component
    ProgramTable.tsx            — Admin program table with CRUD
    StatsCard.tsx               — Admin stats card
    UniversityTable.tsx         — Admin university table with CRUD
  layout/
    AdminSidebar.tsx            — Admin navigation sidebar
    Footer.tsx
    Navbar.tsx
  ui-custom/
    CompareBar.tsx              — Floating comparison bar (programs only)
    DeleteDialog.tsx            — Confirm delete modal
    EmptyState.tsx              — Empty state component
    Pagination.tsx              — Pagination controls
    ProgramCard.tsx             — Program card with save/compare
    SearchBar.tsx               — Debounced search
    SkeletonCard.tsx            — Loading skeleton
    UniversityCard.tsx          — University card (NO Add-to-Compare, NO ranking badge)

types/
  api.ts                        — ApiResponse, PaginatedResponse, DashboardStats, UploadJob
  auth.ts                       — AuthUser, LoginPayload, SignupPayload, AuthResponse
  program.ts                    — ProgramLevel, CampusMode, Program, CreateProgramPayload
  university.ts                 — University, CreateUniversityPayload
```

---

## 7. Phase-by-Phase Implementation Plan (Remaining Work)

### Phase 2 — Auth Redirect Guards + Priority Preset System

**Estimated effort:** Medium

#### 2A — Auth Redirects

**Files to change:**
- `frontend/src/app/login/page.tsx` — On mount, check `localStorage.getItem('outvier_token')`. If token exists, call `authApi.getMe()`. If valid, redirect: `role === 'admin'` → `/admin`, else → `/dashboard`. Do NOT show the login form to already-logged-in users.
- `frontend/src/app/signup/page.tsx` — Same redirect guard.

```typescript
// Add near top of login/signup page components:
useEffect(() => {
  const token = localStorage.getItem('outvier_token');
  if (token) {
    authApi.getMe().then(res => {
      const role = res.data.data.role;
      router.replace(role === 'admin' ? '/admin' : '/dashboard');
    }).catch(() => {
      localStorage.removeItem('outvier_token');
    });
  }
}, []);
```

#### 2B — Priority Preset Backend

**Files to change:**
- `backend/src/models/StudentProfile.model.ts` — Add field:
  ```typescript
  priorityPreset: { 
    type: String, 
    enum: ['balanced', 'budget', 'career', 'prestige', 'easy-admission', 'scholarship'],
    default: 'balanced'
  }
  ```
- `backend/src/services/fitScore.service.ts` — Add function:
  ```typescript
  export function getWeightsFromPreset(preset: string): IPriorityWeights {
    const presets: Record<string, IPriorityWeights> = {
      balanced:       { affordability: 25, ranking: 20, employability: 20, admissionMatch: 15, location: 10, scholarship: 10 },
      budget:         { affordability: 45, scholarship: 20, admissionMatch: 15, employability: 10, location: 5, ranking: 5 },
      career:         { employability: 40, ranking: 20, affordability: 15, admissionMatch: 10, scholarship: 10, location: 5 },
      prestige:       { ranking: 45, employability: 20, affordability: 10, admissionMatch: 10, scholarship: 5, location: 10 },
      'easy-admission': { admissionMatch: 40, affordability: 20, scholarship: 15, location: 10, employability: 10, ranking: 5 },
      scholarship:    { scholarship: 35, affordability: 25, admissionMatch: 15, employability: 10, ranking: 10, location: 5 },
    };
    return presets[preset] || presets.balanced;
  }
  ```
- `backend/src/controllers/studentProfile.controller.ts` — In `updateProfile()`, before saving, if `priorityPreset` is in body: compute `priorityWeights = getWeightsFromPreset(body.priorityPreset)` and include in update data.

#### 2C — Priority Preset Frontend

**File:** `frontend/src/app/dashboard/profile/page.tsx`

Replace the "Priority Weights" card with a preset radio group:

```
○ Balanced recommendation      — All factors considered equally
○ Lower cost matters most      — Prioritises affordable tuition and scholarships
○ Career outcome matters most  — Prioritises graduate employment and outcomes
○ Better ranking matters most  — Prioritises QS/THE world ranking
○ Easier admission matters most — Prioritises meeting entry requirements
○ Scholarships matter most     — Prioritises scholarship availability
```

Below the preset selector, show a read-only summary of what weights that preset uses (e.g. "Affordability 45% · Scholarship 20% · Admission 15% ...").

Keep advanced weight sliders in a collapsed `<details>` / accordion section for power users.

---

### Phase 3 — Remove Old Direct CSV Bypass

**Estimated effort:** Small

**Files to change:**
- `backend/src/routes/admin.routes.ts` — Remove:
  - `router.post('/universities/bulk-upload', ...)`
  - `router.post('/programs/bulk-upload', ...)`
  - `router.get('/uploads', ...)`
- `backend/src/controllers/upload.controller.ts` — Delete the file (no callers remain)
- `backend/src/services/upload.service.ts` — Keep the `upload` multer export (used by imports), but DELETE `processUniversitiesCSV()` and `processProgramsCSV()` functions. Keep only `multer` export.
- `frontend/src/app/admin/universities/page.tsx` — Remove or replace "Bulk Upload CSV" button with link to `/admin/imports/new`
- `frontend/src/app/admin/programs/page.tsx` — Same
- `frontend/src/lib/api/universities.api.ts` — Remove `bulkUpload` function
- `frontend/src/lib/api/programs.api.ts` — Remove `bulkUpload` function

---

### Phase 4 — Import Cancel + Staged Changes Verification

**Estimated effort:** Small-Medium

**4A — Cancel import endpoint:**
- `backend/src/services/seedImport.service.ts` — Add:
  ```typescript
  async cancel(jobId: string): Promise<IUploadJob> {
    const job = await UploadJob.findById(jobId);
    if (!job) throw new Error('Job not found');
    if (job.status !== 'preview') throw new Error(`Cannot cancel job with status: ${job.status}`);
    job.status = 'cancelled';
    await job.save();
    return job;
  }
  ```
- `backend/src/controllers/imports.controller.ts` — Add `cancelImport()` handler
- `backend/src/routes/imports.routes.ts` — Add `router.post('/:id/cancel', importsController.cancelImport)`
- `frontend/src/app/admin/imports/[id]/preview/page.tsx` — Add "Cancel" button beside "Confirm Import" button

**4B — Read `stagedChanges.controller.ts` and verify `applyApprovedChange()` handles:**
- `entityType: 'university'` + `changeType: 'create'` → creates new University record
- `entityType: 'university'` + `changeType: 'update'` → updates existing University by `entityId`
- `entityType: 'program'` + both → same for Program
- `entityType: 'ranking'` → creates/updates RankingRecord
- `entityType: 'tuition'` → creates/updates TuitionRecord
- `entityType: 'outcome'` → creates/updates OutcomeMetric
- `entityType: 'scholarship'` → creates/updates Scholarship

If any branch is missing, add it.

---

### Phase 5 — Admin Add University + Enrichment Trigger

**Estimated effort:** Medium

**5A — Backend validator update:**
- `backend/src/validators/university.validator.ts` — Update `createUniversitySchema` to accept new fields. Consider two schemas:
  - `createUniversityShellSchema` — for the "Add University" admin form (new fields): `universityName`, `shortName`, `officialWebsite`, `cricosProviderCode`, `logoUrl`, `providerType`, `state`, `city`, `campusName`, `notes`
  - Keep `createUniversitySchema` for the legacy CRUD endpoints

**5B — Backend admin controller:**
- `backend/src/controllers/admin.controller.ts` — `createUniversity()`: After creating university, also:
  1. Create a `DataSource` record: `{ name: university.name + ' Official Site', type: 'official_site', baseUrl: university.officialWebsite, status: 'active' }`
  2. Queue a job: `universitySyncQueue.add('sync', { universityId: university._id.toString(), triggeredBy: req.user?.username })`

**5C — New trigger-enrichment route:**
- `backend/src/routes/admin.routes.ts` — Add: `router.post('/universities/:id/trigger-enrichment', syncController.triggerUniversitySync)`

**5D — Frontend form update:**
- `frontend/src/app/admin/universities/new/page.tsx` — Read current form fields, update to new schema fields
- After successful create, show: "University created. Start enrichment to auto-discover programs, tuition, and rankings." + "Start Enrichment Now" button → calls `POST /admin/sync/university/:id`

**5E — Fix university.validator.ts** to map `universityName` → `name` (or update the University model to use `universityName` as primary field — check which approach is cleaner given existing data).

---

### Phase 6 — Source Discovery Connector

**Estimated effort:** Medium-High

**6A — Extend `universityOfficial.connector.ts`:**
Add link discovery after fetching the homepage HTML:
```typescript
// Score each internal <a href> link by keyword relevance
const keywordGroups = {
  programs: ['course', 'program', 'degree', 'study', 'faculty', 'school'],
  fees:     ['fee', 'tuition', 'cost', 'international fee', 'expense'],
  scholarships: ['scholarship', 'grant', 'funding', 'bursary', 'award'],
  outcomes: ['career', 'outcome', 'employability', 'graduate'],
  admission: ['admission', 'entry', 'requirement', 'apply', 'application'],
};
```

**6B — Create `sourceDiscovery.connector.ts`:**
```typescript
// Input: universityId, officialWebsite
// Fetch homepage HTML
// Extract all <a href> internal links
// Score each link by keyword match (0–1)
// Filter: score >= 0.6 AND not already in DataSource for this university
// Create DataSource records for high-confidence links
// Return: { created: number, links: { url, score, category }[] }
```

**6C — Update `universitySync.worker.ts`:**
After running `universityOfficialConnector.execute()`, run `sourceDiscovery.connector.execute()` if the university has no DataSources yet (or if `forceDiscover` flag is set in job data).

**6D — Wire `tuitionSync.worker.ts`:**
```typescript
// 1. Find DataSource records for this university where type = 'official_site' and name contains 'fee' or 'tuition'
// 2. If found, fetch the page, extract tuition values using cheerio
// 3. Create StagedChange records with entityType: 'tuition'
// 4. If no tuition DataSource found, log and mark job completed with 0 records
```

**6E — Wire `scholarshipSync.worker.ts`:**
Same pattern as tuition but for scholarship DataSources.

---

### Phase 7 — University-First Public Experience

**Estimated effort:** Medium-High

**7A — Backend enriched university detail:**
- `backend/src/controllers/university.controller.ts` — `getBySlug()`:
  ```typescript
  const [university, rankings, tuitionRecords, outcomes, scholarships] = await Promise.all([
    University.findOne({ slug }),
    RankingRecord.find({ universityId: uni._id, status: 'approved' }).sort({ year: -1 }).limit(5),
    TuitionRecord.find({ universityId: uni._id, status: 'approved' }).sort({ year: -1 }).limit(10),
    OutcomeMetric.find({ universityId: uni._id, status: 'approved' }).sort({ year: -1 }).limit(3),
    Scholarship.find({ universityId: uni._id, status: 'approved' }).limit(10),
  ]);
  res.json({ success: true, data: { university, rankings, tuitionRecords, outcomes, scholarships } });
  ```

**7B — Frontend university detail page rebuild:**
Replace flat detail view with tabbed layout: Overview, Rankings, Programs, Tuition, Scholarships, Outcomes, Source Info

Each tab shows data if available, or a "No data yet — admin can trigger enrichment" empty state.

**7C — Homepage update:**
- New hero: "Find Your Best-Fit Australian University"
- Featured universities grid (call `GET /universities?limit=4&sort=ranking`)
- "How Outvier Works" 3-step section
- CTA to `/universities`

**7D — University card update:**
Add ranking badge, affordability indicator, "Add to Compare" button.

---

### Phase 8 — University Comparison Engine + Recharts

**Estimated effort:** High

**8A — Install Recharts:**
```bash
cd frontend && npm install recharts
```

**8B — Backend comparison routes:**
Add to `comparison.routes.ts`:
```
POST /:hash/add-university    → comparisonController.addUniversity
DELETE /:hash/remove-university → comparisonController.removeUniversity  
GET /:hash/university-scores  → comparisonController.getUniversityScores
POST /universities            → comparisonController.compareUniversities (stateless)
```

**8C — Backend fit score for universities:**
Add `calculateUniversityScores(profile, universities)` to `fitScoreService`:
- Queries RankingRecord, TuitionRecord (averages), OutcomeMetric, Scholarship per university
- Uses same preset-based weights as program scores
- Returns university-level scores with breakdown + reasons

**8D — Frontend comparison context update:**
Add `selectedUniversityIds`, `addUniversity(id)`, `removeUniversity(id)` to `ComparisonContext.tsx`.

**8E — Frontend compare page update:**
Add university comparison view with:
- Side-by-side comparison table
- BarChart (ranking)
- BarChart (average tuition)
- BarChart (employment rate)
- RadarChart (fit score dimensions)
- "Winner" badge cards (Best Overall, Best for Budget, Best Ranking, Best Career)

---

### Phase 9 — Real Fit Score + Recommendations Endpoint Wired to Frontend

**Estimated effort:** Medium

**9A — Real fit score data:**
Update `fitScoreService.calculateScores()` to:
1. Collect all `programIds` and `universityIds` from the program list
2. Batch query: `RankingRecord.find({ universityId: { $in: universityIds }, status: 'approved' })`
3. Batch query: `TuitionRecord.find({ programId: { $in: programIds }, status: 'approved' })`
4. Batch query: `OutcomeMetric.find({ universityId: { $in: universityIds }, status: 'approved' })`
5. Batch query: `Scholarship.find({ universityId: { $in: universityIds }, status: 'approved' })`
6. For each program: use the approved records instead of dummies; log warning if not found

**9B — Frontend student fit page:**
Wire `GET /recommendations/me` (already created in Phase 1) to the student fit page. Replace comparison session score display with recommendation results.

---

### Phase 10 — AI Multi-Provider + Admin AI Settings Frontend

**Estimated effort:** Medium-High

**10A — Provider abstraction (backend):**

Create `backend/src/services/ai/providers/`:
- `AIProvider.ts` — Interface: `{ generateResponse(prompt, context): Promise<string>; testConnection(): Promise<boolean> }`
- `groq.provider.ts` — Move ChatGroq logic here
- `nvidia.provider.ts` — Use fetch to `NVIDIA_BASE_URL` with OpenAI-compatible messages endpoint
- `mistral.provider.ts` — Use fetch to `https://api.mistral.ai/v1/chat/completions`
- `providerFactory.ts` — `getActiveProvider(): AIProvider`

Update `ai.service.ts` to call `providerFactory.getActiveProvider()`.

**10B — Admin AI settings page rebuild (frontend):**

Replace localStorage-based page with backend-connected version:
- Fetch all 3 provider settings on load: `adminApi.getAISettings()`
- Show each provider (Groq / NVIDIA / Mistral) as a card with: masked key, model, test status, isActive badge
- "Edit" button per provider → opens form with: API key (password input), model name, baseURL (NVIDIA only)
- "Test Connection" button → `adminApi.testAIConnection(provider)`
- "Set as Active" button → `adminApi.activateAIProvider(provider)`

---

### Phase 11 — Analytics Dashboard (Recharts + Public)

**Estimated effort:** Medium

**11A — Backend (already created in Phase 1):**
- `GET /api/v1/admin/analytics` → admin stats ✓
- `GET /api/v1/analytics` → public stats ✓

**11B — Frontend admin analytics page:**
- Replace Power BI-only page with tabbed view
- Tab 1: "Overview" — Recharts charts using `adminApi.getAdminAnalytics()`
  - StatsCard grid: total students, comparisons, pending approvals, active universities
  - BarChart: sync jobs by status
  - PieChart: staged changes by entity type
  - Table: 5 most recent sync jobs
- Tab 2: "Power BI" — existing embed, with graceful fallback if not configured

**11C — Create chart components:**
- `frontend/src/components/analytics/SyncJobsStatusChart.tsx`
- `frontend/src/components/analytics/StagedChangesByTypeChart.tsx`
- `frontend/src/components/analytics/StatsOverviewGrid.tsx`

---

### Phase 12 — UI/UX Polish

**Estimated effort:** Medium

- Add `error.tsx` files to key route segments (universities, programs, dashboard, admin)
- Verify all list pages use `SkeletonCard` during loading
- Verify all list pages use `EmptyState` when data is empty
- Admin sidebar: group "Data Pipeline" section (Imports, Staged Changes, Sync Jobs, Data Sources)
- Student-facing text audit: remove any technical words
- `UniversityCard.tsx`: finalise ranking/affordability badges
- `CompareBar.tsx`: add university comparison count display
- Mobile layout check on compare page

---

### Phase 13 — Data Source Strategy & Freshness Labels

**Estimated effort:** Small

**13A — Backend:** Ensure all sync workers include `sourceUrl`, `fetchedAt`, `confidence` in every `StagedChange.newValue`. Ensure `applyApprovedChange()` copies these to target record's `dataQuality` sub-document.

**13B — Frontend:**
- Create `DataFreshnessLabel` component: shows "Last verified: X days ago" with colour coding
- Use it on university detail page for each dynamic section
- If `confidence < 0.7`, show "Needs official verification" warning badge

---

### Phase 14 — Backend Tests

**Estimated effort:** High

**Install:**
```bash
cd backend && npm install -D jest supertest ts-jest @types/jest @types/supertest
```

**Add `jest.config.ts`:**
```typescript
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
};
```

**Add `"test": "jest"` to backend `package.json` scripts.**

**Write tests in `backend/src/__tests__/`:**
- `auth.test.ts` — signup success, login success, login wrong password, getMe with valid token, getMe with no token
- `imports.test.ts` — preview CSV creates job, confirm by importId reads from DB (not body), cancel changes status
- `stagedChanges.test.ts` — approve university create → creates University record, reject → no record created
- `comparison.test.ts` — addProgram max 4 enforced, addUniversity max 4 enforced
- `fitScore.test.ts` — getWeightsFromPreset('budget') returns correct weights, calculateScores returns sorted results
- `aiProviderFactory.test.ts` — returns groq provider when groq is active setting

---

### Phase 15 — Documentation

**Estimated effort:** Medium

Files to create/update:
- `README.md` — Rewrite (overview, both flows, setup, redis, env vars, demo credentials, limitations)
- `docs/ARCHITECTURE.md` — Backend structure, data flow, tech stack choices
- `docs/DATA_PIPELINE.md` — CSV import → staged changes → approval → publish flow
- `docs/ADMIN_FLOW.md` — Step-by-step admin journey with screenshots (or ASCII diagram)
- `docs/STUDENT_FLOW.md` — Step-by-step student journey
- `docs/AI_COPILOT.md` — How the copilot uses approved data, disclaimers, provider config
- `docs/COMPARISON_ENGINE.md` — How comparison sessions work, max-4, university vs program
- `docs/FIT_SCORE.md` — Scoring algorithm, presets, real vs dummy data warnings
- `docs/POWERBI_SETUP.md` — How to configure Power BI embed
- `docs/SCRAPING_POLICY.md` — Data sources, confidence levels, robots.txt, attribution
- `docs/QA_CHECKLIST.md` — Full end-to-end test checklist

---

## 8. Environment Variables Required

All required in `backend/.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27018/outvier

# Auth — MUST be changed from defaults
JWT_SECRET=<long-random-string-minimum-32-chars>
ENCRYPTION_SECRET=<exactly-32-chars-random-string>

# CORS
FRONTEND_URL=http://localhost:3000

# Redis (required for BullMQ workers)
REDIS_URL=redis://localhost:6379

# AI Providers (at least one needed for copilot)
DEFAULT_AI_PROVIDER=groq
GROQ_API_KEY=<your-groq-api-key>
NVIDIA_API_KEY=<optional>
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
MISTRAL_API_KEY=<optional>

# Power BI (optional — app works without this)
POWERBI_TENANT_ID=
POWERBI_CLIENT_ID=
POWERBI_CLIENT_SECRET=
POWERBI_WORKSPACE_ID=
POWERBI_REPORT_ID=
POWERBI_DATASET_ID=
```

Frontend `frontend/.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
```

---

## 9. Dependencies to Install

### Backend (not yet installed):
```bash
# Testing
cd backend && npm install -D jest supertest ts-jest @types/jest @types/supertest

# AI providers (if adding NVIDIA/Mistral as native SDK — OR use fetch directly)
# No new packages required if using fetch() for NVIDIA and Mistral REST APIs
```

### Frontend (not yet installed):
```bash
# Charts (required for Phase 8 + 11)
cd frontend && npm install recharts
```

---

## 10. Manual QA Checklist

Once all phases are complete, test these flows end-to-end:

| # | Test | Expected Result |
|---|------|----------------|
| 1 | Visit `/` | University-first hero visible, featured universities show |
| 2 | Visit `/universities` | List of universities with ranking badges, affordability |
| 3 | Click "Add to Compare" on 2 universities | Compare bar shows 2 universities |
| 4 | Navigate to `/compare/[hash]` | Side-by-side table + charts visible |
| 5 | Visit `/signup` while logged in | Redirected to /dashboard or /admin (not shown form) |
| 6 | Visit `/login` while logged in | Redirected away |
| 7 | Sign up as new student | Redirected to /dashboard |
| 8 | Go to `/dashboard/profile`, select "Career" preset | Weights auto-set, save succeeds |
| 9 | Go to `/dashboard/student-fit` | Top 10 programs ranked, fit score breakdown, freshness shown |
| 10 | Save a university | Appears in /dashboard/saved |
| 11 | Ask AI Copilot "Which university is best for my budget?" | Gets grounded answer using approved data |
| 12 | Log out, log in as admin | Redirected to /admin |
| 13 | Admin: `/admin/universities/new` | Form shows new fields (officialWebsite, cricosProviderCode etc.) |
| 14 | Admin creates a university, clicks "Start Enrichment" | Sync job appears in /admin/sync |
| 15 | Admin: `/admin/sync` — sync job completes | Staged changes appear in /admin/staged-changes |
| 16 | Admin approves a staged change | University detail page updates |
| 17 | Admin: `/admin/settings/ai-providers` | Shows Groq/NVIDIA/Mistral cards, test connection works |
| 18 | Admin: `/admin/analytics` | Recharts dashboard shows real stats |
| 19 | Admin: `/admin/analytics` without Power BI configured | Recharts tab works, Power BI shows "not configured" |
| 20 | Admin: Upload CSV at `/admin/imports/new` | Preview shows, confirm creates staged changes |
| 21 | Admin: Reject staged change | No data published, status = rejected |
| 22 | Try to add 5 universities to compare | Blocked at 4 |
| 23 | Run `npm run dev:worker` separately | Worker starts, processes queued jobs |
