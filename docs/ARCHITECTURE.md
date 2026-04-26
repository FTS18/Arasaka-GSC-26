# Janrakshak: Technical Architecture Specification

### System Overview
Janrakshak is architected as a high-performance, real-time humanitarian coordination platform. The system utilizes a distributed cloud-native architecture to bridge the gap between field data (often offline or paper-based) and centralized command intelligence.

---

## 1. High-Level System Workflow
The operational flow of Janrakshak follows a four-stage tactical pipeline:
1.  **Ingestion**: Capture of data via structured web forms or AI-powered OCR of physical surveys.
2.  **Intel Processing**: Asynchronous prioritization and categorization using the Janrakshak Priority Metric (JPM) and Gemini 2.0.
3.  **Command & Dispatch**: Visual triage via the Live Map and automated matching based on proximity and skill-stack.
4.  **Field Resolution**: Mobile-optimized mission execution for volunteers with real-time status telemetry back to the dashboard.

---

## 2. Infrastructure Layer

### Data Persistence (Google Firestore)
-   **Distributed Document Store**: Highly available, low-latency document database.
-   **Real-time Synchronization**: Field operatives receive updates instantly via Firestore listeners.
-   **Projection Optimization**: The API implements field-limited projections to ensure sub-100ms response times on restricted humanitarian networks.

### Identity Management (Firebase Auth)
-   **JWT Stateless Authentication**: Secure token-based access for all operational nodes.
-   **Role-Based Access Control (RBAC)**: Implementation of three tier permissions (Admin, Volunteer, User) enforced at the API dependency level.

---

## 3. Backend Architecture (FastAPI & Asyncio)

The backend is built for extreme throughput and low latency:
-   **Parallel Telemetry Pipeline**: Utilizing Python's `asyncio.gather` for concurrent database aggregation, enabling massive dashboard updates in single network turns.
-   **In-Memory Ranking Layer**: To bypass database indexing limitations during high-velocity crisis surges, the system implements a tactical in-memory sort and filter layer.
-   **Resource Efficiency**: The API is optimized to return only necessary fields (Projection), minimizing payload size for mobile deployment.

---

## 4. Frontend Layer (React & PWA)

The interface is designed for high-stakes operational use:
-   **Progressive Web Application (PWA)**: Hardened with Service Workers and manifest-based caching to ensure situational awareness even in low-connectivity zones.
-   **Tactical Brutalist Design System**: A custom-built, high-contrast UI component library optimized for legibility under physical strain and varying light conditions.
-   **Skeleton UI Pattern**: Consistent use of skeleton loading states to eliminate Layout Shift (CLS) and provide immediate perceived responsiveness.

---

## 5. Intelligent Services Layer (Gemini 2.0)

-   **Vision Integration**: Specialized OCR pipeline that converts raw images of paper surveys into structured JSON records for internal triage.
-   **Operational Reasoning**: AI-generated "Mission Briefs" that synthesize complex incident data into actionable summaries for field responders.

---

## 6. Security Protocols

-   **Data Ownership Enforcement**: Non-administrative entities are strictly restricted to their own data scope.
-   **Immutable Audit Trail**: Chronological logging of all status changes and resource movements.
-   **HTTPS/SSL Hardware**: Ensuring all telemetry remains encrypted between field nodes and the command center.

---
*Technical Architecture v2.6.4*
