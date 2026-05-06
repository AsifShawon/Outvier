# CRICOS Integration Guide

Outvier integrates with the official Australian Government CRICOS (Commonwealth Register of Institutions and Courses for Overseas Students) dataset via the **data.gov.au CKAN DataStore API**.

## Architecture

1.  **CKAN API Service**: Queries `data.gov.au` for Institutions, Courses, and Locations.
2.  **Raw Models**: Stores the original source records to maintain data integrity and support future re-mapping.
3.  **Mapper Service**: Normalizes CRICOS data (money, levels, durations) and maps it to Outvier's internal schema.
4.  **Staged Changes**: All CRICOS updates are imported as "Staged Changes" for admin review before being published.

## Resource IDs

- **Institutions**: `7f6941f3-5327-4db7-b556-5f16d77f63c1`
- **Courses**: `48cacf69-2082-415e-9595-f17d0c3a4af0`
- **Locations**: `45d29535-1360-4486-8242-3850e61b5524`
- **Course Locations**: `4cd2de02-8ba3-4eb2-bac2-fe272cae3f5f`

## Configuration

Environment variables in `backend/.env`:
- `DATA_GOV_AU_API_TOKEN`: Optional CKAN API token.
- `CRICOS_SYNC_LIMIT`: Max records per page (default 5000).
- `CRICOS_CKAN_BASE_URL`: `https://data.gov.au/data/api/action`

## Admin Workflow

1.  Navigate to **Admin > CRICOS Sync**.
2.  Enter a **CRICOS Provider Code** (e.g., `00008C` for Monash).
3.  Click **Preview** to see how many records will be fetched.
4.  Click **Sync Data** to trigger the import.
5.  Navigate to **Staged Changes** to review and approve the new/updated records.

## Limitations

- CRICOS data is updated periodically by the government; Outvier fetches the latest available on data.gov.au.
- Marketing descriptions and rankings are NOT part of CRICOS and must be managed via other pipelines.
- Confidence score for CRICOS data is set to `0.95`.
