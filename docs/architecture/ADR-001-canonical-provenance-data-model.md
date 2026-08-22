# ADR-001: Canonical, Provenance-Aware University & Program Data Architecture

## Status
**Accepted** — 2026-08-22

## Context & Motivation
Outvier aggregates university, program, intake, fee, scholarship, ranking, and outcome metrics from multiple disparate sources, including:
1. Australian Government CRICOS CKAN datasets (data.gov.au)
2. TEQSA National Register
3. University official website scrapers and structured LLM extraction
4. Commercial and public ranking publishers (QS, Times Higher Education, ARWU)
5. Quality Indicators for Learning and Teaching (QILT) graduate outcome surveys

Over successive iterations, legacy field names and overlapping modern schemas accumulated across the codebase:
- **Tuition fees**: dual representations (`tuitionFeeLocal`, `tuitionFeeInternational`, `annualTuition`, `tuitionFeeAud`, `tuitionDetails.annualTuitionFee`, `estimatedTotalCourseCostAud`) with ambiguous fee basis (annual vs total vs per unit).
- **Field of study**: duplicate keys (`field` vs `fieldOfStudy` vs `discipline` vs ASCED broad/narrow/detailed fields).
- **Intakes and Deadlines**: arbitrary unstructured strings (e.g. `"February, July"`, `"31 Jan"`) lacking typed ISO timestamps, calendar years, and timezones.
- **Campuses and Locations**: string arrays (`campuses: string[]`) alongside embedded `campusDetails` and separate `Campus` / `ProgramLocation` collections.
- **Rankings and Outcomes**: legacy scalar properties (`ranking: number`) colliding with discrete historical observations (`RankingRecord`, `OutcomeMetric`).
- **Analytics guesswork**: controllers and aggregations were forced to execute fallback chains such as `$ifNull: ['$fieldOfStudy', '$field']` and `$ifNull: ['$annualTuition', '$tuitionFeeInternational']`.

## Decision
We adopt a **Canonical, Provenance-Aware Domain Architecture** with an **Expand–Migrate–Contract** transition strategy.

---

## 1. Canonical Entities & Boundaries

```
 ┌───────────────────────────────────────────────────────────────────────────┐
 │                            Provider / University                          │
 │  - Canonical institutional identity, legal codes (CRICOS/TEQSA), profile  │
 └──────┬─────────────────────────────┬───────────────────────────────┬──────┘
        │ 1:N                         │ 1:N                           │ 1:N
        ▼                             ▼                               ▼
 ┌─────────────┐               ┌─────────────┐                 ┌─────────────┐
 │   Campus    │               │   Program   │                 │   Ranking   │
 │             │               │ (Academic   │                 │ Observation │
 └──────┬──────┘               │ Credential) │                 └─────────────┘
        │                      └──────┬──────┘
        │                             │
        └──────────────┬──────────────┘
                       │ 1:N
                       ▼
        ┌─────────────────────────────┐
        │       ProgramOffering       │
        │  (Delivery & Registration)  │
        └──────┬──────────────┬───────┘
               │ 1:N          │ 1:N
               ▼              ▼
        ┌─────────────┐ ┌─────────────┐
        │   Intake    │ │     Fee     │
        │ (Typed Date)│ │ Observation │
        └─────────────┘ └─────────────┘
```

The 14 canonical domain entities are:

1. **`Provider / University` (`University.model.ts`)**: Represents the higher education institution or provider. Owns institutional identity, official domains, provider codes, state/country, and accreditation.
2. **`Campus` (`Campus.model.ts`)**: Physical or virtual operating campus. Owns street address, postal code, geographical coordinates, and location codes.
3. **`Program` (`Program.model.ts`)**: The abstract academic curriculum and credential (e.g., *Bachelor of Computer Science*). Owns degree level, field of study, curriculum structure, credit points, and career pathways.
4. **`ProgramOffering` (`ProgramOffering.model.ts`)**: The concrete manifestation of a program delivered at a specific campus, via a study mode (on-campus, online, hybrid), with distinct CRICOS registration and intake availability.
5. **`Intake` (`Intake.model.ts`)**: Academic intake term with typed ISO start dates, census dates, and domestic/international application deadlines with IANA time zones.
6. **`FeeObservation` (`FeeObservation.model.ts`)**: Time-bound, currency-typed financial observation specifying amount, fee basis (annual, total_course, per_unit), audience (domestic, international), and effective date ranges.
7. **`EntryRequirement` (`EntryRequirement.model.ts`)**: Academic prerequisites, minimum GPA, ATAR thresholds, work experience, portfolio, and country-specific qualification rules.
8. **`EnglishRequirement` (`EnglishRequirement.model.ts`)**: Standardized language test minimums (IELTS overall/bands, TOEFL, PTE, Cambridge, Duolingo) and waiver conditions.
9. **`Scholarship` (`Scholarship.model.ts`)**: Financial aid, grants, and bursaries with structured funding periods, citizenship constraints, and typed deadlines.
10. **`RankingObservation` (`RankingObservation.model.ts`)**: Published institutional and subject ranking with publisher, edition year, rank/band, licensed source reference, and verification dates.
11. **`OutcomeMetric` (`OutcomeMetric.model.ts`)**: Graduate outcome surveys (QILT/ComparED) with survey year, metric type, unit, and verification timestamps.
12. **`SourceSnapshot` (`SourceSnapshot.model.ts`)**: Immutable raw ingestion payload with SHA-256 hash, URL, MIME type, parser version, and timestamp.
13. **`FieldEvidence` (`FieldEvidence.model.ts` / subdocument)**: Field-level provenance tracking source URL, source type, confidence score, parser version, and raw snippet.
14. **`ChangeReview` (`ChangeReview.model.ts`)**: Audit and review entity for human-in-the-loop validation of crawled and ingested changes.

---

## 2. Field Ownership Matrix

| Field Category | Canonical Entity | Rationale / Ownership Boundary |
| :--- | :--- | :--- |
| Institutional Name, Slug, Logo, TEQSA ID, CRICOS Provider Code, Official Website, State | `Provider / University` | Provider metadata is invariant across all programs and locations. |
| Campus Name, Address, City, State, Postcode, Lat/Lng | `Campus` | Physical location is owned by the campus, which may host many offerings. |
| Academic Level, Field of Study, ASCED Codes, Curriculum Structure, Credit Points | `Program` | Inherent to the academic credential regardless of delivery mode or location. |
| CRICOS Course Code, Study Mode (on-campus/online), Attendance (full/part-time), Availability | `ProgramOffering` | A program may have multiple CRICOS codes (e.g. for different campuses/modes). |
| Start Date, Application Deadline, Census Date, Timezone | `Intake` | Intakes vary by semester, campus offering, and academic year. |
| Tuition Amount, Currency, Fee Basis, Audience (Domestic/Intl), Effective Dates | `FeeObservation` | Fees change annually and depend on domestic/international residency and fee basis. |
| IELTS / PTE / TOEFL Scores, Minimum Sub-bands, Language Waivers | `EnglishRequirement` | Language prerequisites can apply at program level or offering level. |
| GPA, ATAR, Prerequisite Units, Portfolio, Country Qualifications | `EntryRequirement` | Admission standards for prospective applicants. |
| Publisher, Edition Year, Rank, Rank Band, Licensed Source Ref | `RankingObservation` | Published ranking tables released annually by external authorities. |
| Graduate Employment Rate, Median Salary, Student Satisfaction | `OutcomeMetric` | Annual survey metrics evaluated at institution or discipline level. |

---

## 3. Derived Fields & Denormalization Rules

To optimize high-throughput public search, filtering, and comparison queries without multi-level MongoDB `$lookup` joins on every HTTP request, specific derived fields are denormalized with strict synchronization rules:

| Derived Field | Target Model | Source of Truth | Synchronization Trigger |
| :--- | :--- | :--- | :--- |
| `primaryFeeAnnualAud` | `Program` | `FeeObservation` (Audience: `international`, Basis: `annual`) | Recomputed on `FeeObservation` upsert/delete |
| `primaryFeeTotalAud` | `Program` | `FeeObservation` or `durationYears * annualFee` | Recomputed on `FeeObservation` upsert/delete |
| `programCount` | `University` | Count of active `Program` documents | Recomputed on Program status transition |
| `offeringCount` | `University` | Count of active `ProgramOffering` documents | Recomputed on Offering lifecycle event |
| `availableStudyModes` | `Program` | Set of `studyMode` in active `ProgramOffering` | Recomputed on Offering create/update/delete |
| `availableCampusCities` | `Program` | Set of `city` from linked `Campus` documents | Recomputed on Offering create/update/delete |
| `primaryRank` | `University` | Latest `QS` or `THE` overall rank from `RankingObservation` | Recomputed on Ranking sync |

### Denormalization Consistency Guarantees:
- **Write-path transactional or queued update**: Whenever a canonical child entity (`FeeObservation`, `ProgramOffering`, `RankingObservation`) is created or modified, the parent entity's derived fields are recalculated immediately or dispatched to a background synchronization job.
- **Migration & Reconciler script**: An idempotent reconciler verifies and corrects any denormalized drift.

---

## 4. Field-Level Provenance & Source Evidence

Every critical published attribute incorporates a structured `FieldEvidence` provenance sub-document:
```typescript
interface IFieldEvidence {
  fieldName?: string;
  value: any;
  sourceUrl: string;
  sourceType: 'CRICOS' | 'TEQSA' | 'UNIVERSITY_OFFICIAL' | 'FEE_SCHEDULE' | 'RANKING_PUBLISHER' | 'QILT_GOVERNMENT' | 'MANUAL' | 'SECONDARY';
  confidence: number; // 0.0 to 1.0 (or 0 to 100 normalized)
  fetchedAt: Date;
  lastVerifiedAt: Date;
  parserVersion: string;
  rawSnippet?: string;
}
```

---

## 5. Expand–Migrate–Contract Strategy

```
  Phase 1: EXPAND (Current)
  ├── Introduce Canonical Collections & Typed Subdocuments
  ├── Keep Legacy Fields on University & Program
  ├── Add Bidirectional Compatibility Read Adapters
  └── Update New API Serializers for Clean Frontend Output
          │
          ▼
  Phase 2: MIGRATE
  ├── Run Idempotent Migration Script with `--dry-run`
  ├── Populate ProgramOffering, FeeObservation, Intake, Requirements, Rankings
  ├── Detect & Output Conflict Report (JSON & Markdown)
  └── Direct Analytics Aggregations to Canonical Fields
          │
          ▼
  Phase 3: CONTRACT (Future Milestone)
  ├── Deprecate Legacy Write Paths
  ├── Remove Fallback Fields after Frontend Complete Cutover
  └── Drop Unused Legacy Columns from MongoDB
```

### Deprecation Schedule:
- **Phase 1 (Expand)**: Both legacy and canonical fields coexist in DB models. Read adapters guarantee zero breakage for legacy consumers.
- **Phase 2 (Migrate)**: All historical data is migrated to canonical entities. Analytics queries exclusively use canonical fields (`fieldOfStudy`, `FeeObservation`).
- **Phase 3 (Contract)**: Legacy properties (`field`, `tuitionFeeInternational`, `campuses: string[]`) will be pruned after client verification.

---

## Consequences

### Positive:
- **Deterministic Analytics**: Aggregations no longer guess between legacy fields.
- **Auditability & Provenance**: Every fee, ranking, and requirement links to verified source evidence with confidence ratings and parser versioning.
- **Typed Scheduling**: Intakes and application deadlines have precise ISO timestamps with IANA timezone awareness.
- **Zero Downtime Migration**: Existing API routes, frontend components, and URLs remain 100% operational throughout the transition.

### Considerations:
- Slightly increased storage footprint during Phase 1 & 2 due to legacy dual-field coexistence and denormalized search fields. Pruned in Phase 3.
