# Janrakshak: Technical Architecture Specification

### System Overview
Janrakshak is architected as a high-performance, real-time humanitarian coordination platform. The system utilizes a distributed cloud-native architecture to bridge the gap between field data (often offline or paper-based) and centralized command intelligence.

---

## 1. High-Level System Workflow
The operational flow of Janrakshak follows a four-stage tactical pipeline:
1.  **Ingestion**: Capture of data via structured web forms, AI-powered OCR of physical surveys, or Voice SITREPs.
2.  **Intel Processing**: Asynchronous prioritization and categorization using the Janrakshak Priority Metric (JPM) and Gemini 2.5 Flash.
3.  **Command & Dispatch**: Visual triage via the India-Wide Live Map and automated matching based on proximity and skill-stack.
4.  **Field Resolution**: Mobile-optimized mission execution for volunteers with real-time status telemetry back to the dashboard.

---

## 2. Infrastructure Layer

### Data Persistence (Google Firestore)
-   **Distributed Document Store**: Highly available, low-latency document database.
-   **Real-time Synchronization**: Field operatives receive updates instantly via Firestore listeners.
-   **Projection Optimization**: The API implements field-limited projections to ensure sub-100ms response times on restricted humanitarian networks.
-   **Zero-Read Strategy (Atomic Aggregates)**: A synchronization engine that maintains a single `global_stats` document containing pre-calculated tallies for all incident categories. This allows the high-traffic Admin Dashboard to refresh in $O(1)$ time without performing expensive collection-wide counts, ensuring 100% quota resilience.
-   **Tactical Fallback (Hybrid Persistence)**: Integrated a local JSON persistence layer (`tactical_fallback_db.json`) that automates data restoration if cloud quotas are exhausted.
-   **Handshake Protocol (Deep-Links)**: A cross-platform state-transfer mechanism that allows users to transition from the Telegram Bot to the Web Tactical Modal with an encrypted JWT payload, preserving their session context.

### Identity Management (Firebase Auth)
-   **JWT Stateless Authentication**: Secure token-based access for all operational nodes.
-   **Role-Based Access Control (RBAC)**: Implementation of three tier permissions (Admin, Volunteer, User) enforced at the API dependency level.
-   **Hybrid Identity Architecture**: Support for both Firebase ID Tokens and high-speed Custom JWTs for local session persistence and rapid tactical re-authentication.
-   **Zero-Friction Onboarding**: Automatic profile bypassing for authenticated "Infrastructure Admins" (@janrakshak.site) to ensure immediate command access.

---

## 3. Backend Architecture (FastAPI & Asyncio)

The backend is built for extreme throughput and low latency:
-   **Parallel Telemetry Pipeline**: Utilizing Python's `asyncio.gather` for concurrent database aggregation, enabling massive dashboard updates in single network turns.
-   **In-Memory Ranking Layer**: To bypass database indexing limitations during high-velocity crisis surges, the system implements a tactical in-memory sort and filter layer.
-   **Resource Efficiency**: The API is optimized to return only necessary fields (Projection), minimizing payload size for mobile deployment.
-   **Operational Usage Sentinel**: A real-time monitoring thread tracks system-wide Firestore consumption (Reads/Writes/Deletes), resetting counters daily and syncing metrics to a persistent metadata collection.
-   **Sentiment-Aware Triage Engine**: Integration of Gemini NLP to analyze report emotionality (Stress/Panic) and factor it into the priority metric weights.

---

## 4. Frontend Layer (React & PWA)

The interface is designed for high-stakes operational use:
-   **Progressive Web Application (PWA)**: Hardened with Service Workers and manifest-based caching to ensure situational awareness even in low-connectivity zones.
-   **Professional "Bone" Palette Design**: A refined, minimal UI component library optimized for legibility under physical strain and varying light conditions.
-   **Zero-CLS Skeleton Pattern**: High-fidelity skeleton loading states that resolve layout shifts, providing a stable, premium experience during heavy data hydration.
-   **Aggregated India-Wide View**: Optimized geospatial logic that clusters and renders markers at scale, supporting thousands of incident points across the national map.
-   **Multi-Stage Bundle Fetching**: Frontend logic that checks LocalStorage before hitting the API, ensuring rapid state restoration and zero unnecessary network turns.
-   **Eventual Consistency Protocol**: A service-worker-led synchronization model that queues offline actions (Mission Completion/Reporting) and executes them atomically when connectivity is restored.

---

## 5. Intelligent Services Layer (Gemini 2.0)

-   **Vision Integration**: Specialized OCR pipeline that converts raw images of paper surveys into structured JSON records for internal triage.
-   **Operational Reasoning**: AI-generated "Mission Briefs" that synthesize complex incident data into actionable summaries for field responders.
-   **Telegram Hybrid Command Logic**: A dynamic bot architecture supporting both "Long Polling" for development/low-traffic scenarios and "Webhooks" for high-scale, event-driven production surges.

---

## 6. Security Protocols

-   **Data Ownership Enforcement**: Non-administrative entities are strictly restricted to their own data scope.
-   **Immutable Audit Trail**: Chronological logging of all status changes and resource movements.
-   **HTTPS/SSL Hardware**: Ensuring all telemetry remains encrypted between field nodes and the command center.

---
*Technical Architecture v2.8.5 - Production Hardened*
