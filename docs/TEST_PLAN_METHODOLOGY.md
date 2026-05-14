# Test Plan | Methodology

This document outlines the testing strategy, methodology, and resources required to ensure the quality and reliability of the Outvier platform.

---

## 1. Introduction

Outvier is a complex full-stack application involving real-time data synchronization, algorithmic recommendation engines, and AI-powered interactions. Ensuring the integrity of educational data and the fluidity of the user experience is paramount.

### 1.2 Scope
The testing scope covers all layers of the monorepo:
- **Frontend (Next.js)**: UI components, navigation flows, state management, and responsive design.
- **Backend API (Express)**: RESTful endpoints, authentication/authorization, and core business logic.
- **Background Workers (BullMQ)**: CRICOS sync pipelines, data normalization, and AI enrichment jobs.
- **Infrastructure**: MongoDB persistence, Redis queue stability, and Metabase dashboard embedding.

### 1.3 Quality Objective
- **Data Integrity**: Ensure 100% accuracy in mapping CRICOS source data to the production database.
- **Performance**: Maintain sub-second response times for Fit Score calculations and search queries.
- **Usability**: Achieve a "Zero-Grip" UX for the Kanban tracker and AI chat interface.
- **Robustness**: Graceful handling of external API failures (e.g., data.gov.au or AI provider downtime).

### 1.4 Roles and Responsibilities
- **Development Team**: Implementation of Unit and Integration tests.
- **Product Owner**: Defining acceptance criteria and performing User Acceptance Testing (UAT).
- **Automation Suite**: Continuous monitoring of background workers and API health.

---

## 2. Test Methodology

### 2.1 Overview
Outvier employs a multi-tiered testing methodology that combines automated safety nets with manual exploratory testing. We follow an **Agile Testing** approach, where testing is integrated into every sprint.

### 2.2 Test Levels
1.  **Unit Testing**: Isolated testing of business logic, such as the Fit Score algorithm, date mappers, and utility functions using **Jest**.
2.  **Integration Testing**: Verifying interactions between the API and the data layer (MongoDB/Redis) to ensure correct state persistence.
3.  **System Testing**: Validating the end-to-end flow of data from the CRICOS API through the staging process to the frontend display.
4.  **User Acceptance Testing (UAT)**: Manual validation of administrative workflows, specifically the "Staged Changes" review and approval process.

### 2.3 Test Completeness
Testing is considered complete when:
- 100% of critical path scenarios (Registration -> Search -> Comparison -> Application) are validated.
- All high-severity bugs are resolved and verified.
- The platform passes cross-browser and mobile responsiveness audits.

---

## 3. Test Deliverables

### 3.1 Overview
Deliverables are generated throughout the development lifecycle to provide transparency and ensure compliance with quality standards.

### 3.2 Test Cases
Critical test scenarios include:
- **Fit Score Validation**: Testing match percentages against various student profile weights.
- **Kanban Resilience**: Verifying that drag-and-drop actions persist correctly even under high latency.
- **Sync Auditing**: Ensuring every CRICOS sync run generates a detailed audit log and staged changes.
- **AI Contextualization**: Validating that the Sudokkho AI correctly references the student's current program comparison list.

---

## 4. Resources and Environment Needs

### 4.1 Testing Tools
- **Jest / Vitest**: Primary runner for unit and service-level tests.
- **Supertest**: Library for testing HTTP endpoints without starting the server.
- **Playwright**: Automated end-to-end browser testing for the student journey.
- **Postman**: Manual API testing and documentation.

### 4.2 Environment Needs
- **Local (Development)**: Individual developer environments with isolated Docker containers for MongoDB and Redis.
- **Staging**: A stable environment mirroring production used for UAT and final quality sign-off.
- **Production**: The live environment, monitored by automated health checks and error tracking.

---

## 5. References
- [Outvier Specification & Design](file:///c:/Users/User/Documents/Fuad/ICT801/docs/SPECIFICATION_AND_DESIGN.md)
- [Outvier System Overview](file:///c:/Users/User/Documents/Fuad/ICT801/docs/SYSTEM_OVERVIEW.md)
- [Official CRICOS DataStore API](https://data.gov.au)
