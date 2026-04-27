# Janrakshak: Deployment and Operational Testing Guide

### Engineering Specifications for Production Readiness
This guide outlines the infrastructure requirements, deployment procedures, and stress-testing protocols for scaling Janrakshak using Google Cloud Platform (GCP).

---

## 1. Cloud Infrastructure Overview

Janrakshak is designed as a cloud-native, horizontally scalable system.

### Recommended GCP Stack:
-   **Backend**: Google Cloud Run (Fully managed serverless container scaling).
-   **Frontend**: Firebase Hosting (CDN-edge delivery for the React PWA).
-   **Database**: Cloud Firestore (Regional/Global configuration).
-   **Secret Management**: GCP Secret Manager (For API keys and Firebase credentials).
-   **Monitoring**: Google Cloud Operations Suite (Logging and Diagnostics).

---

## 2. Technical Setup & Deployment

### Backend Deployment (Cloud Run)
1.  **Containerization**: Build the Docker image in the `backend/` directory.
    ```bash
    docker build -t gcr.io/[PROJECT_ID]/janrakshak-backend .
    ```
2.  **Push and Deploy**:
    ```bash
    docker push gcr.io/[PROJECT_ID]/janrakshak-backend
    gcloud run deploy janrakshak-backend \
      --image gcr.io/[PROJECT_ID]/janrakshak-backend \
      --set-env-vars FIREBASE_PROJECT_ID=[ID],FIREBASE_WEB_API_KEY=[KEY],TELEGRAM_BOT_TOKEN=[TOKEN]
    ```

### Frontend Deployment (Firebase Hosting)
1.  **Build and Deploy**:
    ```bash
    cd frontend && npm run build
    firebase deploy --only hosting
    ```

---

## 3. Telegram Bot Configuration

The Janrakshak Bot can operate in two distinct modes:
- **Polling Mode (Dev)**: Set `BOT_MODE=polling` in `.env`.
- **Webhook Mode (Prod)**: Set `BOT_MODE=webhook` and configure the `/api/telegram/webhook` endpoint.

---

## 4. Crisis Simulation (The "Chaos Monkey")

To ensure the platform is resilient during "Disaster Pulses," use the simulation engine to stress-test the triage and priority logic.

### Prerequisites:
-   Backend must be running.
-   `aiohttp` must be installed: `pip install aiohttp`.

### Execution:
The script is located at `backend/scripts/simulate_crisis.py`.
```bash
# Simulate 50 urgent reports with a 0.2s pulse delay
python backend/scripts/simulate_crisis.py 50 0.2
```

### Observation Checkpoints:
- **Atomic Sync**: Verify that the `global_stats` telemetry increments in real-time ($O(1)$ complexity).
- **Priority Triage**: Ensure high-urgency simulated reports (Fires/Floods) immediately surface at the top of the Admin dashboard.
- **AI Processing**: Monitor the Gemini Vision pipeline for stable extraction under concurrent load.

---

## 5. Security & Scaling Guardrails

-   **Surge Scaling**: Cloud Run should be configured with a minimum of 1 instance during "Alert Levels" to eliminate cold-start latency.
-   **Secret Management**: `FIREBASE_SERVICE_ACCOUNT_JSON` must be injected via GCP Secret Manager for production environments.
-   **CORS Hardening**: Restrict API access strictly to the verified Firebase Hosting domain.

---
*Operational Specification v2.8.5 - Production Hardened*
*Unifying data. Empowering people. Saving lives.*
