# Comparison Metrics

**Last updated:** 2026-05-08

---

## Overview

The `/compare` page lets users compare up to **4 programs** or **4 universities** side-by-side. For programs, a **Fit Score** (0–100) is calculated from the student's saved profile. For universities, key outcome and ranking data is surfaced directly from the database.

---

## Program Comparison Matrix

| Metric | Source Field | Notes |
|---|---|---|
| University | `program.university.name` | Populated from University collection |
| State | `program.university.state` | |
| Level | `program.level` | bachelor / master / phd / diploma / etc. |
| Duration | `program.duration` | |
| Study Mode | `program.campusMode` | on-campus / online / hybrid |
| Campus | `program.campus` | |
| Intake | `program.intakeMonths` | Array of months |
| Tuition (AUD/yr) | `program.annualTuition` or `tuitionDetails.annualTuitionFee` | Annual fee |
| Total Course Cost | `program.tuitionDetails.totalEstimatedTuitionFee` | Full program cost |
| Scholarship | `program.scholarshipAvailable` | Boolean flag |
| IELTS | `program.ieltsRequirement` or `englishRequirementsDetail.ieltsOverall` | Minimum band |
| Min. GPA | `program.minimumGPA` | String (e.g. "3.0/4.0", "65%") |
| Intl. Deadline | `program.intakeDetails.internationalDeadline` | Application deadline |
| Internship / Placement | `program.courseStructure.hasInternship` | Boolean |
| Graduate Salary | `OutcomeMetric.medianSalary` | Sourced via fit score `rawMetrics` |
| Teaching Quality | `OutcomeMetric.teachingQuality` | Sourced via fit score `rawMetrics` |
| Description | `program.description` | Clamped to 3 lines |
| AI Fit Insights | Computed — see Fit Score section | Top 3 reasons |

---

## University Comparison Matrix

| Metric | Source Field | Notes |
|---|---|---|
| State | `university.state` | |
| City | `university.city` | |
| Global Rank | `RankingRecord.globalRank` | Best rank across QS / THE / ARWU |
| Type | `university.providerType` | public / private |
| CRICOS Code | `university.cricosProviderCode` | Australian accreditation |
| Est. Year | `university.establishedYear` | |
| Avg. Tuition | `university.averageEstimatedTotalCostAud` | Estimated total cost |
| Capacity | `university.institutionCapacity` | Students |
| Website | `university.officialWebsite` | |
| Programs | `university.programCount` | Total indexed programs |
| Graduate Employment % | `OutcomeMetric.graduateEmploymentRate` | From `analytics` enrichment |
| Graduate Salary | `OutcomeMetric.medianSalary` | From `analytics` enrichment |
| Teaching Quality | `OutcomeMetric.teachingQuality` | From `analytics` enrichment |
| Student Support | `OutcomeMetric.studentSupport` | From `analytics` enrichment |

---

## Fit Score (Programs Only)

The Fit Score is a weighted composite of 6 categories, computed in `backend/src/services/fitScore.service.ts` and returned by `GET /api/v1/comparison/:hash/scores`.

### Categories and Formulas

#### 1. Affordability
Compares the program's annual tuition against the student's `budgetMaxAud`.

```
if tuition ≤ budget → score = 100
else → score = max(0, 100 - floor((tuition - budget) / budget × 100))
```

#### 2. Admission Match
Weighted composite of IELTS (60%) and GPA (40%).

**IELTS component:**
```
if userIelts ≥ required → 100
else → max(0, 100 - (required - userIelts) × 50)
```

**GPA component** (skipped if `program.minimumGPA` is ambiguous):
```
Parses "3.0/4.0" or "65%" formats.
normalised = max(0, 100 - ((reqNorm - studentNorm) / reqNorm × 200))
```

```
admissionMatch = ielts × 0.6 + gpa × 0.4
```

#### 3. Location
Four-tier match against student's `preferredCities` and `preferredStates`.

| Match | Score |
|---|---|
| City match | 100 |
| State match only | 85 |
| No preference set | 80 |
| No match | 50 |

#### 4. Ranking
Logarithmic scale using the best `RankingRecord.globalRank` across QS, THE, and ARWU.

```
score = max(0, 100 × (1 - log(rank) / log(1200)))
```

Optional subject rank bonus: +10 if subject rank ≤ 50, +5 if ≤ 100.

| Rank | Score |
|---|---|
| #1 | ~100 |
| #100 | ~73 |
| #500 | ~54 |
| #1000 | ~40 |
| #1200+ | 0 |

#### 5. Employability
Weighted composite from `OutcomeMetric`.

```
score = (employmentRate × 0.5 + salaryNorm × 0.3 + teachingQuality × 0.2) / totalPresentWeight
```

Salary is normalised to 0–100 at AUD $65,000. Missing fields are excluded and weights are renormalised.

#### 6. Scholarship
Blends scholarship count with the highest parsed monetary amount from the `Scholarship` collection.

```
countScore  = min(100, count × 25)
amountScore = min(100, maxAmount / 30000 × 100)
score       = round(countScore × 0.5 + amountScore × 0.5)
```

### Weight Presets

Students can select a priority preset from their profile, which shifts the category weights:

| Preset | Affordability | Ranking | Employability | Admission | Location | Scholarship |
|---|---|---|---|---|---|---|
| Balanced (default) | 25% | 20% | 20% | 15% | 10% | 10% |
| Budget | 45% | 5% | 10% | 15% | 5% | 20% |
| Career | 15% | 20% | 40% | 10% | 5% | 10% |
| Prestige | 10% | 45% | 20% | 10% | 10% | 5% |
| Easy Admission | 20% | 5% | 10% | 40% | 10% | 15% |
| Scholarship | 25% | 10% | 10% | 15% | 5% | 35% |

### Total Score

```
totalScore = Σ (categoryScore × categoryWeight / totalWeight)
```

Result is rounded to the nearest integer (0–100).

**Score colour thresholds:**
- > 80 → green (strong match)
- > 50 → amber (moderate match)
- ≤ 50 → red (poor match)

---

## Visual Charts

The comparison page includes a **Visual Analytics** section powered by `recharts`. Charts are shown when ≥ 2 items are selected.

| Tab | Chart Type | Data |
|---|---|---|
| Fit Score | RadarChart (programs only) | 6-axis overlay, one polygon per program |
| Cost | BarChart | Annual tuition + total cost per program; avg. tuition for universities |
| Rankings | BarChart (Y-axis reversed) | Global rank — lower bar = better |
| Outcomes | Grouped BarChart | Graduate employment %, teaching quality, student support |

The `/compare/[hash]` detail page also shows:
- A **RadarChart** summary above the table (all programs overlaid)
- A **horizontal BarChart** per program in the Fit Breakdown row (replaces CSS bars)

---

## Data Sources

| Data | Collection | Status filter |
|---|---|---|
| Rankings | `RankingRecord` | `status: 'approved'` |
| Outcomes | `OutcomeMetric` | `status: 'approved'` |
| Scholarships | `Scholarship` | `status: 'approved'` |
| Program details | `Program` | — |
| University details | `University` | — |
| Student preferences | `StudentProfile` | Linked to authenticated user |
