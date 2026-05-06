# CRICOS Admin Workflow

This document outlines the unified administrative workflow for managing CRICOS data within the Outvier platform.

## Overview

The admin dashboard has been streamlined to focus on CRICOS as the official source of truth for university, program, and location data. All legacy data pipeline concepts (Seed Imports, Data Sources) have been consolidated into a single **CRICOS Sync** menu.

## Navigation Structure

The **CRICOS Sync** menu contains the following tools:

1.  **Overview**: High-level health metrics of the CRICOS integration.
2.  **Provider Sync**: Trigger fresh imports for specific providers using their CRICOS Provider Code.
3.  **Sync Runs**: Audit log of all past and current synchronization jobs.
4.  **Raw Data**: Explorer for official records (Institutions, Courses, Locations, Course-Locations) as they appear in the Government DataStore.
5.  **Field Inspector**: Debugging tool to inspect the schema and sample data for any CRICOS resource.

## Data Lifecycle

1.  **Ingestion**: Data is fetched from the CRICOS API / DataStore via the **Provider Sync** or automated schedules.
2.  **Staging**: Incoming data that differs from the current database is placed in **Staged Changes**.
3.  **Review**: Administrators review staged changes at `/admin/staged-changes`.
4.  **Approval**: Once approved, changes are merged into the main `University`, `Program`, and `ProgramLocation` models.

## AI Enrichment

AI is no longer a separate ingestion pipeline. Instead, AI tools are integrated directly into feature modules:

*   **Rankings**: "AI Enrich Ranking" button for discovering and updating global/national ranks.
*   **Scholarships**: "AI Find Scholarships" button for university-specific financial aid discovery.
*   **Outcomes**: "AI Enrich Outcomes" button for graduate employment and salary metrics.
*   **Entity Summaries**: "Generate Summary" buttons on University and Program edit pages for student-friendly content.

## Troubleshooting

If a sync fails:
1. Check **Sync Runs** for error messages.
2. Use the **Field Inspector** to verify if the Government DataStore schema has changed.
3. Use the **Raw Data** explorer to verify the specific record contents.
