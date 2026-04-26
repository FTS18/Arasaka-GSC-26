# Janrakshak: AI Intelligence and Prioritization Engine

### Google Gemini 2.0 Implementation and Priority Logic

Janrakshak utilizes advanced Large Language Models (LLMs) and computer vision to transform raw information into structured humanitarian intelligence. This document explains the implementation of Google Gemini 2.0 and the mathematical logic of the prioritization scoring system.

---

## 1. Gemini Integration Strategy

The system utilizes the Gemini-2.5-Flash model for all critical operational paths:

### Automated Field Report Extraction (OCR and Triage)
When field workers upload paper reports or raw text communications:
1.  **Ingestion**: Images or text are passed to the `/api/needs/ocr` endpoint.
2.  **Multimodal Vision**: Gemini analyzes the visual structure for handwritten or typed data.
3.  **Entity Extraction**: Structured JSON is retrieved including:
    -   Need Category (e.g., Medical, Sanitation).
    -   Severity metrics from descriptions.
    -   Geospatial indicators (e.g., Landmarks, Addresses).

### Operational Rationale Generation
To ensure human commanders trust the AI recommendations:
-   **Assignment Logic**: Gemini explains why a specific volunteer was matched to a mission (based on proximity, skill-match, and trust score).
-   **Briefing Generation**: Synthesizes multiple assistant requests into a single "Mission Briefing" for field responder clarity.

---

## 2. The Janrakshak Priority Metric (JPM)

The JPM is a normalized score (0-100) used to rank requests by objective urgency.

### Calculation Formula
The priority score is calculated dynamically based on the following weighted variables:

| Variable | Weight | Description |
| :--- | :--- | :--- |
| **Urgency (U)** | 40% | Derived from a 1-5 scale (Life-saving = 5, Indirect Support = 1). |
| **Population (P)** | 25% | Number of people affected; higher counts accelerate priority. |
| **Vulnerability (V)** | 20% | Demographic risks (presence of children, elderly, or medical emergencies). |
| **Time Decay (T)** | 15% | Automatic point increase for pending requests to prevent starvation. |

### Logic Workflow:
```python
priority_score = (U * 8) + (P_weighted) + (V * 2) + (T_decay_factor)
```

---

## 3. Reliability and Guardrails

To prevent AI error or "Hallucination" in humanitarian contexts, Janrakshak implements the following guardrails:
-   **Human-in-the-loop**: All AI-extracted requests are flagged as "System Proposed" until confirmed by an Administrator.
-   **Structured Decoding**: We utilize JSON schema-masking on Gemini responses to ensure every API interaction returns valid, parseable telemetry data.
-   **Coordinate Validation**: All extracted geospatial data is validated against Google Maps Geocoding API before ingestion.

---
*AI Engine Documentation v2.6.4*
*Unifying data. Empowering people. Saving lives.*
