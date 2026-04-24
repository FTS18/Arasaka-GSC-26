# JANRAKSHAK (GSC-26)

### Tactical Humanitarian Command and Resource Allocation Console

Janrakshak is a high-stakes operational platform designed for rapid-response NGOs and field intelligence networks. It transforms chaotic disaster signals into structured, prioritized action.

---

## Core Operational Features

- Telemetry and Geospatial Intelligence: Real-time incident tracking via Leaflet.
- AI-Powered Priority Engine: Automated request triage based on urgency, vulnerability, and environmental factors.
- Dynamic Volunteer Matching: Trust-scored matchmaking by proximity and skill-stack.
- Disaster Mode: Single-toggle operational shift for critical surges (Floods, Heatwaves, Outbreaks).
- Impact Analytics: Immutable audit logs and transparency telemetry.

## Technical Architecture

### Frontend
- React 18 (Vite/CRACO)
- Tailwind CSS (Tactical Brutalist Design System)
- Shadcn UI (Custom structural components)
- Phosphor Icons (Duotone tactical set)
- Recharts (Intelligence telemetry)

### Backend
- FastAPI / Python 3.10
- Firebase Authentication + Firestore
- LLM Integration (AI Extraction and Dispatch Briefings)
- Pytest (Mission-critical validation)

---

## Getting Started

### 1. Requirements
Ensure you have Node.js 18+, Python 3.10+, and a Firebase project configured.

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
# Set environment variables in backend/.env:
# FIREBASE_WEB_API_KEY, FIREBASE_PROJECT_ID,
# FIREBASE_SERVICE_ACCOUNT_FILE (or FIREBASE_SERVICE_ACCOUNT_JSON), AI_API_KEY
python server.py
```

### 3. Frontend Setup
```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

## Security and Access Control
The console supports three distinct operational roles:
- admin (Full Command and Triage)
- user (Public Reporting and Community Access)
- volunteer (Field Response and Mission Completion)

---

**JANRAKSHAK · GSC-26 OPERATIONS CONSOLE**
Propelling field intelligence into decisive action.
