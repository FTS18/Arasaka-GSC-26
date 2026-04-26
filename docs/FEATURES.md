# Janrakshak: Core Product Features

### Consolidated Operational Capability Overview

Janrakshak provides a comprehensive suite of tools designed for rapid humanitarian response, volunteer management, and resource allocation.

---

## 1. Command & Triage Features (Admin)

### Live Situational Awareness Map
-   **Real-time Heatmapping**: Visualizes clusters of high-priority assistance requests.
-   **Responder Tracking**: Shows real-time locations of field volunteers for efficient dispatch.
-   **Interactive Pinpoints**: One-click access to incident details and priority scoring.

### Disaster Surge Mode
-   **Global Toggle**: A one-click tactical shift for the entire platform.
-   **Urgency Re-scaling**: Automatically boosts priority scores for life-saving request categories.
-   **High-Contrast Interface**: Switches the UI to an emergency theme optimized for low visibility.

### Immutable Audit Logs
-   **Transparency Engine**: Every status update, mission completion, and resource movement is logged chronologically for post-mission accountability.
-   **Zero-Read Dashboard Acceleration**: Architectural optimization that delivers O(1) performance for dashboard telemetry using pre-calculated atomic aggregates.
-   **Internal Usage Dashboard**: Real-time visualization of daily Firestore quota consumption vs limits.

---

## 2. Field Response Features (Volunteer)

### Mission Control Dashboard
-   **Task Queue**: Sequential list of assigned missions with status indicators.
-   **Tactical Briefings**: Concise summaries generated for each mission, highlighting critical risks and required resources.
-   **Navigation Integration**: Direct link to Google Maps for optimized field routing.

### Volunteer Leaderboard & Points
-   **Incentivized Impact**: A trust-based system that awards points and badges for mission completion.
-   **Trust Scoring**: Dynamic score that reflects reliability, skills, and community feedback.

### Secure Mobile Profile
-   **Skill Management**: Ability to log and update medical, logistical, or specialized certifications.
-   **Availability Status**: Toggle to signal active presence to the Command Center.
-   **Multi-Stage Bundle Caching**: Intelligent state restoration that prioritizes LocalStorage and cached bundles over expensive network turns.
-   **Hybrid Bot Command Interface**: Full integration with the Telegram bot for reporting and registration, supporting both Long-Polling and Webhook modes.

---

## 3. Community Assistance Features (User)

### Rapid Assistance Requests
-   **Structured Reporting**: Simple forms for medical, food, shelter, and water needs.
-   **Ownership Filtering**: Secure dashboard where users can track the real-time status of their own requests.

### Intelligent Survey Scanning (AI Vision)
-   **Paper to Digital**: Users and field workers can scan physical paper surveys via camera to immediately upload data to the command system.

### Resource Warehouse Transparency
-   **Inventory Tracking**: Transparent view of available resources (water, medicine, dry food) across regional warehouses to manage expectations.

---

## 4. Platform-Wide Efficiency Features

### Skeleton Loading States
-   Ensures a smooth, layout-stable experience by providing immediate visual feedback during data fetching.

### Offline-First Capability (PWA)
-   Assets and critical data are cached locally, allowing field responders to operate during network outages.

### Multi-Language Support
-   Dynamic localization support (English/Hindi) to ensure accessibility for varied community demographics.

---
*Product Features v2.8.0 - Tactical Ready*
