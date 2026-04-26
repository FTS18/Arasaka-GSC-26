# Janrakshak: Security Architecture and Data Ethics

### Principles of Resilience, Privacy, and Accountability

Janrakshak handles sensitive humanitarian data. This document outlines the technical safeguards and ethical frameworks implemented to ensure the integrity of the platform and the safety of the community.

---

## 1. Authentication and Authorization

### JWT Stateless Security
The platform utilizes JSON Web Tokens (JWT) for secure, stateless authentication:
-   **Password Hashing**: Bcrypt is used for all stored credentials (simulated via Firebase Identity Platform).
-   **Bearer Token Protocol**: All restricted API endpoints require a valid JWT or Firebase ID Token in the Authorization header.
-   **Hybrid Identity Sync**: Automatic identity resolution between Firebase-issued tokens and backend-generated Tactical JWTs.

### Role-Based Access Control (RBAC)
Access logic is enforced at the API dependency level (FastAPI Dependencies):
-   **Dependencies**: `require_roles("admin")`, `require_roles("volunteer")`.
-   **Data Ownership Bypass**: Only the `admin` role can bypass the ownership filter. Users are programmatically restricted to their own data scope using database query injections.
-   **Infrastructure-Level Trusted Access**: Critical infrastructure admins (@janrakshak.site) are automatically granted high-confidence "Onboarded" status during the initial Google Auth handshake to prevent bottleneck delay during crisis surges.

---

## 2. Infrastructure Security

### Firebase Security Rules
Production-grade rules are deployed to Cloud Firestore to prevent unauthorized data exfiltration:
-   **Read Restrictions**: Only authenticated responders can query active needs.
-   **Write Protections**: Users can only modify their own requests. Public-facing fields are read-only.
-   **Geospatial Validation**: Verification that coordinates are within valid global ranges.

### Disaster-Aware Rate Limiting
Traffic is programmatically managed based on system-wide load signals:
-   **Context-Aware Throttling**: Higher limits for local command dashboards and authenticated responders.
-   **Emergency Surge Priority**: In "Disaster Mode," non-essential public endpoints are strictly throttled to protect database quotas for life-saving telemetry.

---

## 3. Humanitarian Data Ethics

Janrakshak adheres to the following principles of data protection in humanitarian action:

### Data Minimization
The system only collects the minimum data required for effective resource allocation. Indirect identifiers are minimized to protect the privacy of those in need.

### Data Masking and Privacy
-   **Volunteer Anonymity**: User contact information is only shared with assigned volunteers after a mission is active.
-   **Requestor Privacy**: Broad heatmaps are used for public situational awareness, while precise location data is restricted to authorized responders.
-   **Strategic Location Fuzzing**: For non-authorized viewers, coordinates are programmatically fuzzed to a 500m radius to prevent targeted exploitation of displaced persons.

### Algorithmic Transparency
The **Janrakshak Priority Metric (JPM)** logic is transparent and can be explained to stakeholders via the "AI Reasoning" endpoint. We avoid "Black Box" prioritization to ensure fairness across disadvantaged communities.
-   **Algorithmic Bias Mitigation**: The system utilizes "Sector-Stabilization" checks to ensure aid distribution isn't skewed toward high-connectivity neighborhoods at the expense of marginalized aid deserts.

---

## 4. Immutable Audit Trail

Every operational action is recorded in a chronological, immutable log:
-   **Audit Scope**: Registration, Mission Assignment, Resource Disbursement, and Status Updates.
-   **Accountability**: Logs include user identifiers and timestamps, providing a clear path for post-operation auditing and transparency.

---
*Security and Ethics Specification v2.8.0 - Tactical Ready*
*Unifying data. Empowering people. Saving lives.*
