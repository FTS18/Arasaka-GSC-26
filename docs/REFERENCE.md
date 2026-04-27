# Janrakshak: Technical Reference (Schema & API)

### Unified Data Model and REST Specification
This document serves as the primary technical reference for the Janrakshak telemetry core, including the Firestore Data Schema and the FastAPI endpoint specification.

---

## 1. Data Schema (Firestore Models)

Janrakshak utilizes a schemaless, document-oriented architecture optimized for real-time synchronization.

### Needs Collection (Incidents)
-   **id** (string): Unique UUID.
-   **title/description**: Situational context.
-   **category**: Enum [Medical, Food, Shelter, Water, Other].
-   **status**: Enum [pending, in-progress, completed, cancelled].
-   **urgency/severity**: (1-5) scale.
-   **sentiment_score**: AI-extracted panic (1.0 - 1.5).
-   **priority_score**: Normalized JPM metric (0-100).
-   **field_notes**: AI-transcribed voice observations.
-   **location**: Map [lat, lng, address].

### Missions Collection (Active Ops)
-   **id**: Unique mission ID.
-   **need_ids/volunteer_ids**: Relational arrays.
-   **status**: Enum [assigned, arriving, active, completed].
-   **proof_url**: Link to verified evidence.
-   **telemetry_verified**: Result of GPS cross-reference.
-   **handshake_token**: Encrypted JWT for Bot-to-Web transitions.

### Global Stats (Atomic Aggregates)
-   **needs_count/volunteers_online/missions_completed**: Real-time tallies.
-   **category_breakdown**: Map of active counts per category.

---

## 2. API Specification (REST)

### Identity & Auth
-   **`GET /api/auth/me`**: Retrieve active session profile.
-   **`GET /api/volunteers/me`**: Tactical dossier for responders.

### Request Management
-   **`GET /api/needs`**: Aggregated incident list (auto-filtered by role).
-   **`POST /api/needs`**: Initialize a new request (supports raw text for AI triage).
-   **`GET /api/data/bundle`**: O(1) snapshot for offline PWA hydration.

### Mission Operations
-   **`GET /api/missions`**: List active assignments for the current operative.
-   **`POST /api/missions/{mid}/complete`**: Verifies proof and updates DTS ranking.

### Intelligence & Admin
-   **`GET /api/admin/stats`**: Zero-Read telemetry from `global_stats`.
-   **`POST /api/disaster/toggle`**: Engages surge-mode priority weighting.
-   **`POST /api/ai/insight`**: Gemini-powered operational reasoning.

---

## 3. Technical Constraints
-   **RBAC**: Roles (`admin`, `volunteer`, `user`) enforced via FastAPI dependencies.
-   **Parallelization**: Backend utilizes `asyncio.gather` for sub-100ms dashboard aggregation.
-   **Security**: HTTPS/SSL required; Stateless JWT auth.

---
*Technical Reference v2.8.5 - Production Hardened*
*Unifying data. Empowering people. Saving lives.*
