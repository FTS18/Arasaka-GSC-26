# JANRAKSHAK GSC-26 API SPECIFICATION

This document outlines the primary REST API endpoints for the Janrakshak Tactical Console.

## Authentication
All requests (except public reporting and login) require a JSON Web Token (JWT) in the Authorization header.

**Header Format**: `Authorization: bearer <token>`

---

## 1. Authentication Endpoints

### POST `/api/auth/register`
Create a new operator, volunteer, or user account.
- **Payload**: `email, password, name, role, phone, skills, transport, working_radius_km`

### POST `/api/auth/token`
Authenticate and receive an access token.
- **Payload**: `username (email), password`
- **Response**: `access_token, token_type`

---

## 2. Need Management (Incidents)

### GET `/api/needs`
Retrieve a list of active requests. Supports filtering by status and category.
- **Query Params**: `status, category, urgency_min, limit`

### POST `/api/needs`
Submit a new request for assistance. Used by users and administrators.
- **Payload**: `title, description, raw_text (for AI extraction), location, urgency, people_affected, category, vulnerability`

### GET `/api/needs/{id}`
Retrieve full details of a specific incident, including AI-prioritization scores.

### PATCH `/api/needs/{id}`
Update status or metadata. Authorized for admin account only.

---

## 3. Intelligence and Matching

### POST `/api/matching/suggest/{need_id}`
Retrieve a list of the top candidates for a specific incident based on the Janrakshak Matching Algorithm.
- **Logic**: Geospatial proximity + Skill match + Trust score.

### POST `/api/matching/explain/{need_id}`
Generate an AI-driven rationale for why specific volunteers were prioritized for this mission.

### POST `/api/matching/auto-assign/{need_id}`
Automatically assign the highest-scoring candidate to the request.

---

## 4. Resource Logistics

### GET `/api/resources`
Retrieve inventory status across all warehouses.

### POST `/api/resources`
Log new resource arrival or delivery.

---

## 5. Analytics and Audit

### GET `/api/analytics/overview`
Aggregated impact metrics: People helped, efficiency scores, and trend distribution.

### GET `/api/analytics/audit-log`
A chronological, immutable record of all operational actions.

---

## 6. System Operations

### POST `/api/disaster/toggle`
Global switch to activate Crisis Protocols.
- **Effect**: Increases priority scores for all pending requests and triggers dark-mode UI surge. Authorized for admin.

### POST `/api/seed/demo`
Initialize the database with a standard operational set (Admin, Volunteers, and Sample Incidents).
