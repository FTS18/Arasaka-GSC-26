# Janrakshak: Smart Resource Allocation & Volunteer Coordination

### High-Performance Command Console for Scalable Social Impact
**Submission for Google Solution Challenge 2026**

Janrakshak is an enterprise-grade humanitarian command system built to solve the fragmentation of community data. By synthesizing scattered field reports, paper surveys, and real-time incident signals, Janrakshak empowers NGOs and local social groups with decisive intelligence to match resources and volunteers to critical needs with sub-second latency.

---

## Project Vision & Problem Statement

Local NGOs often operate blindly, with vital information trapped in paper surveys and unorganized reports. This "Information Lag" costs lives during crises. Janrakshak bridges this gap by:
1.  **Digitizing Chaos**: Using Google Gemini AI to transform physical paper surveys into actionable geospatial data.
2.  **Optimizing Response**: A proprietary AI-driven priority scoring engine (0-100) that factors in vulnerability, population density, and time-decay.
3.  **Intelligent Matching**: Eliminating matching friction by connecting verified volunteers to missions based on proximity, trust score, and expertise.

---

## Detailed Project Documentation

To ensure complete transparency and technical clarity, the documentation is segmented into the following modules:

-   **[Product Features](docs/FEATURES.md)**: Role-specific capability maps for Admins, Volunteers, and Users.
-   **[Technical Architecture](docs/ARCHITECTURE.md)**: Deep-dive into parallel telemetry, PWA resilience, and system flows.
-   **[API Specification](docs/API_DOCS.md)**: Technical reference for REST endpoints and operational tooling.
-   **[AI Intelligence Engine](docs/AI_ENGINE.md)**: Explanation of Gemini 2.0 integration and the Janrakshak Priority Metric (JPM) algorithm.
-   **[Data Schema](docs/SCHEMA.md)**: Comprehensive Firestore collection models and relational mappings.
-   **[Security & Data Ethics](docs/SECURITY.md)**: RBAC logic, JWT implementation, and humanitarian privacy standards.
-   **[Deployment Guide](docs/DEPLOYMENT.md)**: Infrastructure specifications for Google Cloud Run and Firebase Hosting.
-   **[Operations Manual](docs/OPERATIONS_MANUAL.md)**: Standard Operating Procedures (SOPs) for field commanders and responders.
-   **[Impact Roadmap](docs/ROADMAP.md)**: Vision for Predictive AI, IoT integration, and long-term sustainability.

---

## Google Stack Integration

Janrakshak leverages the full power of the Google ecosystem to ensure performance, security, and scalability:

### 1. Google Cloud Platform & Firebase
-   **Cloud Firestore**: Distributed, high-availability database providing real-time synchronization for field operatives. We implemented custom geospatial indexing logic to handle high-density incident maps.
-   **Firebase Authentication**: Secure, enterprise-grade identity management with role-based access control (Admin, Volunteer, User).
-   **Cloud Functions**: Serverless triggers for automated mission audits and point-accrual tracking.

### 2. Google AI (Gemini 2.0)
-   **AI Vision & OCR**: Integrated within the "Requests" portal to allow field workers to scan paper surveys via mobile cameras. Gemini extracts structured data (Location, Category, Population) from raw images.
-   **Strategic Reasoning**: Gemini acts as a "Mission Briefing" engine, generating human-readable rationales for volunteer assignments and providing situational summaries for command staff.

### 3. Google Maps Platform
-   **JavaScript Maps API**: A real-time Situational Awareness map showing heatmaps of critical needs and active responders.
-   **Distance Matrix API**: Precision geospatial calculations for matching volunteers within their operational radius.

---

## Technical Architecture & Innovation

### High-Performance Backend (FastAPI + Asyncio)
-   **Parallel Telemetry**: Utilizing asyncio.gather for parallel database aggregation, reducing dashboard load times by up to 500%.
-   **In-Memory Ranking Engine**: We developed a specialized in-memory sorting layer that bypasses traditional database indexing bottlenecks, enabling sub-second triage of thousands of live requests.
-   **Role-Based Security Layer**: Custom dependency-injection middleware that strictly enforces data ownership (Users only see their requests, Admins see the Sector).
-   **Key File**: [backend/server.py](backend/server.py) (Core API and Orchestration).

### Resilient Frontend (React + PWA)
-   **Offline-First Resilience**: A hardened Service Worker implementation allows humanitarian workers to operate in low-connectivity disaster zones.
-   **Tactical Design System**: A "Brutalist" high-contrast interface designed for maximum legibility in harsh field conditions.
-   **Skeleton UI & Zero-CLS**: Optimized for perceived performance, ensuring zero Layout Shift during data acquisition on restricted humanitarian networks.
-   **Key File**: [frontend/src/App.js](frontend/src/App.js) (Navigation Architecture) and [frontend/src/pages/Dashboard.jsx](frontend/src/pages/Dashboard.jsx).

---

## Getting Started

### Backend Setup
```bash
cd backend
python -m venv venv
# Source the venv environment
# Define Environment: FIREBASE_WEB_API_KEY, FIREBASE_PROJECT_ID, GOOGLE_APPLICATION_CREDENTIALS
python server.py
```

### Frontend Deployment
```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

---

**Developed for the 2026 Google Solution Challenge**
*Unifying data. Empowering people. Saving lives.*
