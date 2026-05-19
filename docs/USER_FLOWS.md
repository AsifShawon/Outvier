# Outvier — Comprehensive User Flow Documentation

This document provides a detailed mapping of the key user flows within the **Outvier** platform. It bridges frontend UI interactions, backend API endpoints, validation logic, background processing, and database mutations.

---

## 🗺️ Master Flow Map

The diagram below represents how different user journeys connect across the Student and Administrator environments.

```mermaid
graph TD
    subgraph "Public Area"
        Landing[Landing Page / Search] --> Directory[University & Program Directory]
        Landing --> Auth[Sign Up / Login]
    end

    subgraph "Student User Journey"
        Auth --> Profile[Student Profile Setup & Weights]
        Profile --> FitScore[Fit Score Calculation Engine]
        Directory --> Compare[Comparison Matrix & Recharts]
        Compare --> Tracker[Kanban Application Tracker]
        Tracker --> Checklist[Document Checklist & Tasks]
        Checklist --> AI[Sudokkho AI Copilot]
    end

    subgraph "Administrator Journey"
        Auth --> AdminDash[Admin Dashboard Overview]
        AdminDash --> CRICOS[CRICOS Ingestion Pipeline]
        CRICOS --> Review[Staged Changes Review & Approval]
        Review --> Enrich[AI Content Enrichment Module]
        Enrich --> Meta[Metabase Analytics Dashboard]
    end

    classDef student fill:#dbeafe,stroke:#2563eb,stroke-width:2px;
    classDef admin fill:#fef3c7,stroke:#d97706,stroke-width:2px;
    classDef public fill:#f3f4f6,stroke:#4b5563,stroke-width:2px;
    
    class Profile,FitScore,Compare,Tracker,Checklist,AI student;
    class AdminDash,CRICOS,Review,Enrich,Meta admin;
    class Landing,Directory,Auth public;
```

---

## 🔑 1. User Sign Up, Login, and Session Recovery Flow

This flow details how users register an account, authenticate, remain logged in across page refreshes, and log out securely.

### A. Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant API as Express Auth API
    participant DB as MongoDB (User Collection)

    %% Registration
    Note over User, DB: Scenario A: User Registration (Sign Up)
    User->>Browser: Enters Name, Email, Password, clicks Sign Up
    Browser->>Browser: Front-end validation (Zod: signupSchema)
    Browser->>API: POST /api/v1/auth/signup {name, email, password}
    API->>API: Back-end validation (Zod: signupSchema)
    API->>DB: User.findOne({ email })
    DB-->>API: Returns null (email is unique)
    API->>API: Bcrypt hashes password (salt rounds = 10)
    API->>DB: Save new User document {status: 'active', role: 'user'}
    DB-->>API: Persisted user document
    API->>API: Generate JWT signed with JWT_SECRET (7d expiry)
    API-->>Browser: Response: 201 Created { success: true, token, user }
    Browser->>Browser: Store token in localStorage (outvier_token)
    Browser->>User: Redirects to Student Profile Setup

    %% Login
    Note over User, DB: Scenario B: User Login
    User->>Browser: Enters Email, Password, clicks Sign In
    Browser->>API: POST /api/v1/auth/login {email, password}
    API->>DB: User.findOne({ email })
    DB-->>API: Returns User document
    API->>API: Verify user.status === 'active'
    API->>API: bcrypt.compare(password, user.passwordHash)
    API->>API: Generate JWT signed with JWT_SECRET (7d expiry)
    API-->>Browser: Response: 200 OK { success: true, token, user }
    Browser->>Browser: Store token in localStorage (outvier_token)
    Browser->>User: Redirect to /dashboard (or /admin if role = admin)

    %% Session Recovery
    Note over User, DB: Scenario C: Session Recovery (Page Refresh)
    Browser->>Browser: Checks localStorage for outvier_token
    Browser->>API: GET /api/v1/auth/me (Authorization: Bearer <token>)
    API->>API: Verify token signature and expiry
    API->>DB: User.findById(decoded.id)
    DB-->>API: Returns User document
    API-->>Browser: Response: 200 OK { success: true, user }
    Browser->>Browser: Mounts authenticated Application Shell
```

### B. User Actions & System State

| Phase | User Action | Frontend State | API / Backend Action | Database Mutation / Query |
| :--- | :--- | :--- | :--- | :--- |
| **Registration** | Fills in Sign Up form, clicks "Sign Up" | Validates input format; fires `authApi.signup()` mutation. | Validates payload, checks uniqueness of email, hashes password, saves record. | `INSERT INTO users` (Mongoose: `user.save()`) |
| **Authentication** | Fills in Login form, clicks "Sign In" | Dispatches `authApi.login()` mutation, disables inputs, triggers spinner. | Validates payload, searches user, matches bcrypt hash, signs JWT. | `SELECT FROM users WHERE email = ?` |
| **Persistence** | Reloads web page | Reads `outvier_token` from `localStorage`, displays app-wide global loading shell. | Decodes token via `protect` middleware, confirms user validity. | `SELECT FROM users WHERE _id = ?` (excluding `passwordHash`) |
| **Logout** | Clicks "Logout" in sidebar | Removes `outvier_token` from `localStorage`, redirects to `/login`. | Clear cookies (if used), returns success message. | None |

---

## 🎓 2. Student Exploration & Directory Flow

How students search, filter, and discover universities and programs without or before logging in.

### A. Flowchart

```mermaid
graph TD
    Start([User lands on Landing Page]) --> Search{Has Query?}
    Search -- Yes --> Results[Fuzzy Search matching Title/State/Level]
    Search -- No --> Browse[Default Program / Uni List]
    Results --> Filter[Apply Sidebar Filters: Tuition Max, State, IELTS Requirement]
    Browse --> Filter
    Filter --> Display[Render Program/University cards]
    Display --> Click[Click Program Card]
    Click --> Detail[Load Program Details Page]
```

### B. User Actions & System State

*   **Step 1: Landing Page Search**
    *   *Action:* User types "Computer Science MASTER" into search bar and selects "Victoria" state.
    *   *Frontend:* Captures query variables and forwards user to `/programs?search=Computer+Science&level=master&state=VIC`.
    *   *API Endpoint:* `GET /api/v1/programs?search=...&level=...&state=...`
    *   *Database query:* Performs a MongoDB `$text` fuzzy query on `Program` fields, and filters by `level` and state.
*   **Step 2: Program Detail Exploration**
    *   *Action:* Student clicks "Master of Information Technology" at Monash University.
    *   *Frontend:* Navigates to `/programs/[id]` and initiates React Query fetching state.
    *   *API Endpoint:* `GET /api/v1/programs/:id` (Populates university details inside the program).
    *   *Database query:* `Program.findById(id).populate('university')` to load comprehensive details, tuition structures, and intakes.

---

## 📊 3. Fit Score & Personalization Flow

One of Outvier's premium core features: calculating a tailored program match score based on individual academic and budget parameters.

### A. Data & Calculation Flow

```mermaid
graph TD
    Student[1. Student Profile Saved] --> Config[Weights Configured: e.g., Balanced / Budget / Career]
    Config --> API_Call[2. API calls GET /api/v1/programs or /compare]
    API_Call --> Fetch_Profile[3. Backend fetches StudentProfile matching req.user.id]
    Fetch_Profile --> Run_Algorithm[4. Run fitScoreService.ts Algorithm]
    
    subgraph "fitScoreService.ts Calculations"
        Budget[Budget: Annual Tuition vs budgetMaxAud]
        Admission[Admission: User IELTS/GPA vs requirement]
        Loc[Location: Preferred States & Cities]
        Rank[Ranking: QS/THE Logarithmic ranking scale]
        Employ[Employability: Median Graduate salary & employment rates]
        Scholar[Scholarship: Counts and financial support value]
    end
    
    Run_Algorithm --> Budget
    Run_Algorithm --> Admission
    Run_Algorithm --> Loc
    Run_Algorithm --> Rank
    Run_Algorithm --> Employ
    Run_Algorithm --> Scholar
    
    Budget & Admission & Loc & Rank & Employ & Scholar --> Combine[5. Apply Category weights based on Profile Preset]
    Combine --> Return_Score[6. Return integer score 0 - 100 with Color Tag & AI Top Insights]
```

### B. User Actions & System State

*   **Step 1: Set Preferences**
    *   *Action:* User navigates to their profile page, adjusts the slider priorities (e.g., sets "Budget" weight to 45%, "Rankings" to 5%), and clicks "Save".
    *   *Frontend:* Sends a PUT request with the full parameters list to `/api/v1/student-profile`.
    *   *API Endpoint:* `PUT /api/v1/student-profile` (Uses `protect` middleware).
    *   *Database Mutation:* `StudentProfile.findOneAndUpdate({ userId: req.user.id }, req.body, { upsert: true })`
*   **Step 2: Real-time Calculation Display**
    *   *Action:* User navigates back to the Programs directory.
    *   *Frontend:* Every program card displays a dynamic badge (e.g. `92% Fit - Excellent Match` in a green tag).
    *   *API Endpoint:* `GET /api/v1/programs` (internally checks if the user is authenticated; if yes, fetches their `StudentProfile` and computes a Fit Score dynamically for each returned record).

---

## 📈 4. Multi-Item Comparison Matrix Flow

Allows students to compare up to 4 programs or universities side-by-side with rich visualization charts.

### A. Flowchart

```mermaid
graph TD
    Start([Browse Directory]) --> Select[Click Add to Compare on Program/Uni Card]
    Select --> MaxCheck{Selected Count == 4?}
    MaxCheck -- Yes --> Alert[Disable Further Selection / Show Max limit toast]
    MaxCheck -- No --> ActiveCount[Increment selection in ComparisonContext]
    ActiveCount --> Render[Click Compare Float Bar]
    Render --> MatrixPage[Navigate to /compare]
    MatrixPage --> QueryScores[API fetches dynamic comparisons & Fit Scores]
    QueryScores --> Visuals[Render Recharts: Radar, Bar, and Stacked charts]
    MatrixPage --> Share[Click Share comparison]
    Share --> SaveHash[Backend generates session hash]
    SaveHash --> Clipboard[Copy shareable URL /compare/hash to Clipboard]
```

### B. User Actions & System State

| Phase / Action | Frontend State | API Endpoint Invoked | Database Action / Query |
| :--- | :--- | :--- | :--- |
| **Selecting Items** | Tracks selected items (`[id1, id2]`) inside standard React Context. | None (Client-side state) | None |
| **Loading Comparison Matrix** | Mounts `/compare` page, passes array of IDs. Renders comparison matrices and inserts loading skeletons for Recharts. | `POST /api/v1/comparison/batch` | Queries multiple documents: `Program.find({ _id: { $in: ids } })` |
| **Fetching Fit Breakdown** | Renders dynamic metrics. Once scores load, overlays **Recharts RadarChart** showing the 6-axis overlays. | `GET /api/v1/comparison/scores?ids=...` | Sourced via `fitScoreService.ts` running algorithms against user's profile. |
| **Generating Shared Session** | Toggles sharing button state, copy-to-clipboard animation. | `POST /api/v1/comparison/sessions` | `INSERT INTO comparison_sessions` with generated unique hashes. |

---

## 📋 5. Kanban Application Tracker Flow

Tracks study applications through progressive pipeline phases with integrated tasks and document checkpoints.

### A. Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as Kanban UI
    participant API as Express API (Tracker)
    participant DB as MongoDB (ApplicationTracker)

    %% Add application
    User->>Frontend: Clicks "Add Application" on Program Page
    Frontend->>Frontend: Mounts Multi-Step Wizard
    User->>Frontend: Input Intake Month, Year, & Custom Notes, clicks Submit
    Frontend->>API: POST /api/v1/application-tracker {programId, intakeMonth, intakeYear}
    API->>API: Validate details & fetch standard checklist for program level
    API->>DB: Create ApplicationTracker {stage: 'Researching', checklist: [...]}
    DB-->>API: Saved Document
    API-->>Frontend: Response: 201 Created
    Frontend->>User: Renders card in "Researching" column of Kanban board

    %% Drag and drop
    User->>Frontend: Drags Card from 'Researching' to 'Preparing' column
    Frontend->>Frontend: Optimistic UI Update (Card shifts columns immediately)
    Frontend->>API: PATCH /api/v1/application-tracker/:id/stage {stage: 'Preparing'}
    API->>DB: ApplicationTracker.findByIdAndUpdate(id, { stage })
    DB-->>API: Success
    API-->>Frontend: Response: 200 OK (Confirms placement)
    
    %% Checklist update
    User->>Frontend: Uploads Passport PDF in detail drawer
    Frontend->>API: POST /api/v1/application-tracker/:id/documents/passport (Form-Data)
    API->>API: Middleware uploads file to storage, maps document URL
    API->>DB: Update checklist status to 'uploaded' and set fileUrl
    DB-->>API: Success
    API-->>Frontend: Response: 200 OK (Checklist marks green)
```

### B. Kanban Board Columns & Life-Cycle Stages
Students guide their applications through six distinct visual pipeline stages:

1.  **Researching (default):** Initial bookmarking of programs. Standard document requirements generated.
2.  **Preparing:** Writing Statements of Purpose, seeking references, preparing certified transcript files.
3.  **Applied:** Formally submitted through university portals. Awaiting offer letter.
4.  **In Progress:** Handling conditional offers, submitting english test results, paying security deposits.
5.  **Onboarding:** COE (Confirmation of Enrolment) issued. Visa application lodged and health insurance finalized.
6.  **Archived:** Successfully completed applications or deferred/withdrawn programs.

---

## 🤖 6. Sudokkho AI (Copilot Advisor) Flow

Provides contextual conversational support to students searching for visa, housing, or degree details.

### A. Interaction Flow

```mermaid
graph TD
    User[Student types query: 'Is IELTS 6.5 enough for Monash Masters?'] --> Input[Sudokkho Panel captures Input]
    Input --> FetchContext[Frontend app gathers active Compare Program IDs]
    FetchContext --> API_Call[POST /api/v1/ai/chat {message, context: {profile, comparedPrograms}}]
    
    subgraph "Express Server - AI Orchestration"
        VerifyAuth[Validate User Session] --> BuildPrompt[Inject Context into System Instructions]
        BuildPrompt --> AppendHistory[Append conversation log memory]
        AppendHistory --> CallLLM[Invoke LLM Groq / Mistral Endpoint]
    end
    
    API_Call --> VerifyAuth
    CallLLM --> ReceiveResponse[Receive model response]
    ReceiveResponse --> DB_Log[Save message and response in ChatLog collection]
    ReceiveResponse --> SendClient[Send stream or message response to frontend]
    SendClient --> Display[Render rich markdown responses in conversation bubble]
```

---

## 🛡️ 7. Admin: CRICOS Data Sync Pipeline Flow

The primary data management pipeline used by administrators to ingest, verify, and publish official academic catalogs.

### A. Flowchart

```mermaid
graph TD
    Admin[Admin Logs in] --> Nav[Navigate to Admin / CRICOS Sync]
    Nav --> Input[Enter CRICOS Provider Code: e.g. 00008C]
    Input --> Action[Click Sync Data]
    Action --> API_Trigger[POST /api/v1/ingestion/sync {providerCode}]
    
    subgraph "Background Processing (BullMQ & Redis)"
        Queue[Push Job 'cricos-sync' into BullMQ] --> Worker[Worker takes Job]
        Worker --> API_Gov[Request data.gov.au CKAN API Resources]
        API_Gov --> DB_Raw[Write records to CricosRaw collections]
        DB_Raw --> Mapping[Run Mapper: durational normalizer & tuition mapper]
        Mapping --> DB_Stage[Calculate diff vs active collection & create StagedChange]
    end
    
    API_Trigger --> Queue
    DB_Stage --> Finish[Job completes: updates SyncRun status to SUCCESS]
    
    Finish --> Review[Admin views Staged Changes comparison UI]
    Review --> Choice{Approve Diff?}
    Choice -- Yes --> Apply[POST /api/v1/staged-changes/:id/approve]
    Apply --> Merge[Merge changes into University / Program / Location collection]
    Merge --> Active[Data is live for Students immediately]
    Choice -- No --> Reject[POST /api/v1/staged-changes/:id/reject]
    Reject --> Del[Mark StagedChange as Rejected / Delete Diff]
```

### B. Detailed Admin Action Sequence & Database Mutations

1.  **Triggering Sync Ingestion:**
    *   *Endpoint:* `POST /api/v1/ingestion/sync`
    *   *Payload:* `{ providerCode: "00008C" }`
    *   *Database:* Creates a `CricosSyncRun` record with status `'pending'`.
2.  **Staging Updates:**
    *   The background worker fetches institutions, courses, and course locations.
    *   *Database:* Writes raw data directly into `CricosInstitutionRaw`, `CricosCourseRaw`, and `CricosLocationRaw`.
    *   The mapper checks if this institution/course already exists in production.
    *   *Database:* If there's an update or new insertion, it creates a `StagedChange` document containing:
        *   `type`: `'create'` or `'update'`
        *   `targetCollection`: `'University'` or `'Program'`
        *   `diff`: A JSON object showing `{ field: { old: value, new: value } }`
        *   `status`: `'pending'`
3.  **Reviewing & Approving Changes:**
    *   Administrators view the color-coded side-by-side diff in `/admin/staged-changes`.
    *   *Endpoint:* `POST /api/v1/staged-changes/:id/approve`
    *   *Backend:* Reads the JSON diff. Merges values directly into the target active document.
    *   *Database Mutation:* Updates targeted `University` or `Program` record, and updates the `StagedChange` document status to `'applied'`.

---

## 🦾 8. Admin: AI Content Enrichment Flow

Outvier enhances basic Government CRICOS directories with AI enrichment to supply rich student-facing data.

### A. Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant Frontend as Admin UI
    participant API as Express API
    participant Worker as Background LLM Service
    participant DB as MongoDB

    Admin->>Frontend: Clicks "AI Find Scholarships" on Monash Page
    Frontend->>API: POST /api/v1/admin/universities/:id/enrich-scholarships
    API->>Worker: Add AI enrichment task to Redis Queue
    API-->>Frontend: Response: 202 Accepted (Sync spinner activates)
    
    Note over Worker: LLM searches / synthesizes scholarship options
    Worker->>DB: Write newly discovered records to Scholarship collection
    Worker->>DB: Update University.hasScholarships = true
    Worker->>DB: Create operational log activity
    Worker-->>API: Job completed
    
    API->>Frontend: Send Event / React Query invalidates cache
    Frontend->>Admin: Displays freshly imported scholarships with 'Approved' badge
```

---

## 📊 9. Admin: Operational Monitoring & Analytics (Metabase) Flow

Real-time business intelligence dashboarding for tracking platform usage and system diagnostics.

### A. Flowchart

```mermaid
graph TD
    Start([Admin visits Dashboard]) --> Dashboard[Load Admin Overview Page]
    Dashboard --> Health[Fetch Background Health Metrics API]
    Health --> Stats[Render Sync Run Success Rates & active queue statuses]
    Dashboard --> Metabase_Embed[API requests secure Single-Sign-On SSO Metabase Token]
    
    subgraph "Metabase Handshake"
        ReqToken[API signs JSON Web Token JWT containing Dashboard ID & Secret]
        ReqToken --> ReturnUrl[Formulate secure Embedded iframe URL]
    end
    
    Metabase_Embed --> ReqToken
    ReturnUrl --> Mount[Render Metabase dashboard inside sandboxed Admin iframe]
    Mount --> Interactive[Admin filters charts: Total Active Students, top fit score presets]
```

### B. User Actions & System State

*   **Step 1: Dashboard Loading**
    *   *Action:* Administrator navigates to `/admin`.
    *   *Frontend:* Renders structural overview charts (Recharts) and loads a secure iframe element targeting `/admin/analytics`.
    *   *API Endpoint:* `GET /api/v1/analytics/dashboard-url` (using authentication checks).
    *   *Backend Action:* Utilizes the local Metabase secret key to sign a payload:
        ```javascript
        const payload = {
          resource: { dashboard: 1 },
          params: {},
          exp: Math.round(Date.now() / 1000) + (10 * 60) // 10 minute expiry
        };
        const token = jwt.sign(payload, METABASE_SECRET_KEY);
        const embedUrl = `${METABASE_SITE_URL}/embed/dashboard/${token}#bordered=true&titled=false`;
        ```
    *   *Database query:* None required for the token handshake; Metabase reads directly from the read-only replication or production database to render charts.
