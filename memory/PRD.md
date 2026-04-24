# JANRAKSHAK — Humanitarian Operations Command Center

## Original Problem Statement
Build a Smart Resource Allocation platform for NGOs, volunteer groups, and local communities to identify urgent needs, manage resources efficiently, and deploy volunteers where needed most. Centralized need management, AI prioritization, volunteer management with trust scores, smart matching, resource inventory, route optimization, live ops dashboard, geospatial intel with heatmaps, predictive analytics, citizen reporting, multilingual (EN/HI), emergency disaster mode, transparency/audit, analytics, multi-NGO collaboration, notifications, RBAC. Should feel like a real-time command center for humanitarian operations.

## Tech Stack
- **Backend**: FastAPI + MongoDB (motor) + JWT + bcrypt + Claude Sonnet 4.5 via AI API key
- **Frontend**: React 19 + React Router 7 + Leaflet + Recharts + shadcn/ui + Tailwind + Phosphor icons
- **Fonts**: Chivo (heading), Sora (body/data) — Proportional "Tactical Field Report" aesthetic (No Monospace)

## User Personas
- **Admin**: Full operational control, disaster mode toggle, audit log, and mission dispatch.
- **User**: General portal access for filing reports and monitoring community needs.
- **Volunteer**: Registers availability, accepts missions, and uploads proof-of-completion.

## Core Requirements (static)
Need management · AI prioritization · Volunteer matching · Resource inventory · Missions · Citizen reporting · Geospatial map · Analytics · Disaster mode · RBAC · Multilingual (EN/HI) · Audit trail · Proof-of-completion

## What's Been Implemented (v1.0 · 2026-02)
- JWT auth, 6-role RBAC, auto-seed on backend startup
- Weighted priority engine (urgency, vulnerability, waiting time, affected, severity, weather, disaster boost)
- Smart volunteer matching with proximity (Haversine), trust score, transport capability
- AI recommendations (Claude Sonnet 4.5): match explanations, ops briefings, 30-day forecast
- AI NLP extraction on citizen reports → structured JSON → convertible to a Need
- Resource inventory with shortage alerts
- Missions with proof-of-completion photos and trust-score impact
- Leaflet map with priority-colored CircleMarkers + volunteer overlay
- Analytics: people helped, efficiency %, category distribution, 6-month trend, top volunteers, audit log
- Disaster mode: instant re-prioritization + palette swap to dark/red
- EN/HI i18n toggle
- 8 demo needs + 5 demo volunteers + 7 demo resources seeded

## Prioritized Backlog
### P0 (next)
- Route optimization (TSP-lite for grouping nearby needs into one mission)
- Real file upload for evidence/proof (replace URL-input with actual upload via Object Storage)
- Volunteer self-serve mission acceptance flow (currently field_worker assigns)

### P1
- SMS/WhatsApp alerts (Twilio), Email (SendGrid), push notifications
- OCR on handwritten/scanned documents
- Voice note intake for citizen reports (STT)
- Multi-NGO tenancy + cross-org coordination
- Live volunteer GPS tracking

### P2
- Advanced predictive analytics (seasonal, disease outbreak, festival-based demand)
- Public transparency page (donor reports)
- Offline-first mobile PWA for field workers
- Hindi translation of server-side AI output

## Credentials
See `/app/memory/test_credentials.md`
