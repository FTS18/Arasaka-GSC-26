# Janrakshak GSC-26: API Reference Specification

### Technical Documentation for Developers and External Integrations

The Janrakshak API is built on FastAPI (Python) and utilizes Cloud Firestore as its primary system of record. It follows RESTful principles and serves serialized JSON payloads.

---

## Security Architecture

### Role-Based Access Control (RBAC)
Access to telemetry and operational commands is strictly enforced via roles:
-   `admin`: Full sector command, audit logs, and system configuration.
-   `volunteer`: Mission acquisition, completion reporting, and tactical profile management.
-   `user`: Public assistance requests and limited dashboard telemetry.
-   **Hybrid Auth**: Supports `Bearer <Custom_JWT>` for local session persistence alongside Firebase ID Tokens.

---

## 1. Identity & Profile Operations

### `GET /api/auth/me`
Retrieve the authenticated identity and basic metadata.
-   **Output**: User ID, Email, Name, and Role.

### `GET /api/volunteers/me`
Allows field responders to retrieve their own tactical dossier without administrative roster access.
-   **Security**: Requires volunteer role.
-   **Response**: ID, Base Location, Trust Score, Completed Missions, and Status.

---

## 2. Strategic Request Management

### `GET /api/needs`
Aggregated list of assistance requests.
-   **Privacy Persistence**: For user roles, this endpoint automatically filters for owned requests only.
-   **Performance**: Utilizes in-memory sorting for priority_score ranking to eliminate indexing bottlenecks.
-   **Query Parameters**: category, status, skip, limit.

### `POST /api/needs`
Initialize a new assistance request.
-   **Features**: Supports raw text for AI-automated triage and geospatial tag population.

-   **Logic**: AI-driven extraction of Location, Category, and Urgency.

### `GET /api/data/bundle`
Retrieve high-speed data snapshots for offline caching.
-   **Optimization**: Bundles Resources, Volunteers, and Stats into a single network turn.

---

## 3. Mission Control & Dispatch

### `GET /api/missions`
List active operations.
-   **Logic**: Volunteers only see missions where they are assigned.
-   **Optimization**: Uses array-contains for membership checks and in-memory sort by created_at.

### `POST /api/missions/{mid}/complete`
Signal the successful resolution of an assignment.
-   **Effect**: Increases the volunteer's trust score and triggers audit log confirmation.

---

## 4. System Intelligence & Resource Tracking

-   **Optimization**: Built with asyncio.gather for parallel database calls across Missions, Needs, and Volunteers. Sub-100ms response time.

### `GET /api/admin/stats` (Zero-Read High-Performance)
Highly efficient telemetry for command personnel.
-   **Optimization**: O(1) Reads. Pulling from pre-aggregated `global_stats` document.

-   **Performance**: Uses field-limited projections to return only critical inventory metrics for high-speed dashboard counting.

---

## 5. Tactical Communication & Event Handling

### `POST /api/telegram/webhook`
Mission-Critical incoming event handler.
-   **Input**: Native Telegram Update payload.
-   **Logic**: Handles disaster reporting and volunteer registration via push signals.

---

## 5. Operational Tooling (/backend/scripts)

The following utilities are available for system maintenance and crisis simulation:
-   `setup_environment.py`: Environment restoration with high-fidelity, high-stakes synthetic records.
-   `simulate_crisis.py`: Stress-tests the priority engine with high-volume synthetic requests.
-   `ingest_firestore.py`: Native cloud-direct bulk ingestion system.

---

*Janrakshak API v2.8.0 - Tactical Ready*
*Propelling field intelligence into decisive action.*
