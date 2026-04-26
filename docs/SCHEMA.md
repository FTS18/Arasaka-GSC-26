# Janrakshak: Data Schema Specification

### System of Record: Google Cloud Firestore

Janrakshak utilizes a schemaless, document-oriented database architecture designed for high availability and real-time synchronization. This document defines the primary data models and their relational mappings.

---

## 1. Needs Collection (Incidents)
Represents a specific request for assistance from the community.

-   **id** (string): Unique document identifier (UUID).
-   **user_id** (string): Reference to the creator's identity.
-   **title** (string): Concise summary of the need.
-   **description** (string): Detailed situational context.
-   **category** (string): Enum [Medical, Food, Shelter, Water, Other].
-   **status** (string): Enum [pending, in-progress, completed, cancelled].
-   **urgency** (integer): Scale of 1 (Low) to 5 (Critical).
-   **vulnerability** (integer): Weight assigned for demographic risk (0-10).
-   **priority_score** (float): Calculated JPM metric (0-100).
-   **location** (map):
    -   **lat** (float): Latitude coordinate.
    -   **lng** (float): Longitude coordinate.
    -   **address** (string): Human-readable location.
-   **people_affected** (integer): Estimated number of individuals in focus.
-   **created_at** (timestamp): UTC iso-format record of ingestion.
-   **updated_at** (timestamp): UTC iso-format record of modification.

---

## 2. Missions Collection (Active Operations)
Tracks the fulfillment of needs by volunteers.

-   **id** (string): Unique mission identifier.
-   **need_ids** (array of strings): References to linked Needs being addressed.
-   **volunteer_ids** (array of strings): References to assigned field responders.
-   **status** (string): Enum [assigned, arriving, active, completed].
-   **start_time** (timestamp): Initial assignment record.
-   **end_time** (timestamp): Record of successful resolution.
-   **proof_url** (string): Link to verified resolution evidence (Cloudinary/Firebase Storage).
-   **ai_brief** (string): AI-generated operational summary for responders.

---

## 3. Volunteers Collection (Responder Roster)
Stores specialized responder metadata and performance metrics.

-   **id** (string): Unique responder identifier.
-   **user_id** (string): Foreign key linking to core Identity.
-   **name** (string): Full legal or operational name.
-   **phone** (string): Critical contact number for field dispatch.
-   **skills** (array of strings): Competency stack (e.g., First Aid, Logistics).
-   **base_location** (map): Primary staging area (Lat/Lng).
-   **working_radius_km** (float): Maximum operational distance from base.
-   **trust_score** (integer): Dynamic reliability metric (0-100).
-   **status** (string): Enum [active, inactive, on-mission].
-   **transport** (string): Enum [None, Bike, Car, Truck].

---

## 4. Users Collection (Identity Layer)
Core authentication and role management data.

-   **id** (string): Primary UID (synced with Firebase Auth).
-   **email** (string): Primary identifier.
-   **role** (string): Enum [admin, volunteer, user].
-   **points** (integer): Gamified impact score.
-   **created_at** (timestamp): Record of initial registration.

---
*Data Schema Specification v2.6.4*
*Unifying data. Empowering people. Saving lives.*
