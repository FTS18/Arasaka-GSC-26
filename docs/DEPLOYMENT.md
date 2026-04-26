# Janrakshak: Deployment and Cloud Architecture Guide

### Engineering Specifications for Production Readiness

This guide outlines the infrastructure requirements and deployment procedures for scaling Janrakshak using Google Cloud Platform (GCP).

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

## 2. Backend Deployment (Cloud Run)

### Prerequisites:
-   Docker installed.
-   Google Cloud SDK (gcloud) configured.

### Deployment Workflow:
1.  **Containerization**: Build the Docker image in the `backend/` directory.
    ```bash
    docker build -t gcr.io/[PROJECT_ID]/janrakshak-backend .
    ```
2.  **Push to Container Registry**:
    ```bash
    docker push gcr.io/[PROJECT_ID]/janrakshak-backend
    ```
3.  **Deploy to Cloud Run**:
    ```bash
    gcloud run deploy janrakshak-backend \
      --image gcr.io/[PROJECT_ID]/janrakshak-backend \
      --platform managed \
      --allow-unauthenticated \
      --set-env-vars FIREBASE_PROJECT_ID=[ID],FIREBASE_WEB_API_KEY=[KEY]
    ```

---

## 3. Frontend Deployment (Firebase Hosting)

1.  **Build Process**: In the `frontend/` directory:
    ```bash
    npm run build
    ```
2.  **Initialization**:
    ```bash
    firebase init hosting
    ```
3.  **Deployment**:
    ```bash
    firebase deploy --only hosting
    ```

---

## 4. Scaling during Disaster Surges

Janrakshak is optimized for rapid scaling:
-   **Cold Starts**: Cloud Run is configured with a minimum of 1 instance during "Alert Levels" to eliminate initial latency.
-   **Database Throughput**: Firestore scales automatically to handle millions of concurrent connections during high-impact crisis events.
-   **Concurrency**: The FastAPI backend is configured to handle multiple asynchronous requests per container instance, maximizing cost-efficiency.

---

## 5. Security Hardening

In production environments, ensure:
-   **CORS Policies**: Restricted only to the verified Firebase Hosting domain.
-   **Environment Variables**: `FIREBASE_SERVICE_ACCOUNT_JSON` should be injected from GCP Secret Manager, not hardcoded in `.env`.
-   **Firestore Rules**: Validate that public-write permissions are disabled.

---
*Deployment Specification v2.6.4*
*Unifying data. Empowering people. Saving lives.*
