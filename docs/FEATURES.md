# Janrakshak: Core Product Features

### Consolidated Operational Capability Overview

Janrakshak provides a comprehensive suite of tools designed for rapid humanitarian response, volunteer management, and resource allocation.

---

## 1. Command & Triage Features (Admin)

### Live Situational Awareness (India-Wide)
-   **National Command View**: Multi-scale mapping engine visualizing incident clusters across India.
-   **Resource Analytics Explorer**: High-density charts and metrics for real-time aid inventory tracking.
-   **Responder Distribution**: Real-time heatmaps of volunteer concentration vs. demand hotspots.

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

### Mission Control & Field Intelligence
-   **Task Queue**: Sequential list of assigned missions with status indicators.
-   **Multimodal Field Notes**: Voice-to-text SITREP system for dictating field observations instantly.
-   **Tactical AI Briefings**: AI-synthesized summaries of mission objectives and critical risk factors.
-   **Full-Screen Tactical Modal**: Distraction-free interface for mission-critical interactions.

### [Volunteer Leaderboard & Trust System](TRUST_SYSTEM.md)
-   **Incentivized Impact**: A trust-based system that awards points and badges for mission completion.
-   **Verification Loop**: Multi-stage proof submission (Photo + GPS) required for mission closure.
-   **Dynamic Trust Scoring**: Reflects reliability, speed, and mission-urgency weighting.

### Secure Mobile Profile
-   **Skill Management**: Ability to log and update medical, logistical, or specialized certifications.
-   **Availability Status**: Toggle to signal active presence to the Command Center.
-   **Multi-Stage Bundle Caching**: Intelligent state restoration that prioritizes LocalStorage and cached bundles over expensive network turns.
-   **[Hybrid Bot Command Interface](TELEGRAM_BOT.md)**: Full integration with the Telegram bot for reporting and registration, supporting both Long-Polling and Webhook modes.

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

### High-Fidelity Skeleton Loaders
-   **Zero-CLS Architecture**: Eliminates layout shifts during data hydration using precision-weighted skeletal placeholders.
-   **Premium "Bone" Design System**: A professional, minimal UI language that prioritizes clarity and speed.

### Offline-First Capability (PWA)
-   Assets and critical data are cached locally, allowing field responders to operate during network outages.

### Multi-Language Support
-   Dynamic localization support (English/Hindi) to ensure accessibility for varied community demographics.

---
*Product Features v2.8.0 - Tactical Ready*
