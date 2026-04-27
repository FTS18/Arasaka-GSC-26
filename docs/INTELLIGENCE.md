# Janrakshak: Intelligence, Prioritization, and Trust

### The "Operational Brain" of Humanitarian Coordination
Janrakshak utilizes a dual-engine architecture comprising the **Priority Logic (JPM)** for incident triage and the **Trust Economy (DTS)** for volunteer accountability. This document details the algorithmic foundations of the platform.

---

## 1. Google Gemini 2.5 Implementation

The system utilizes the Gemini-2.5-Flash model for all critical operational paths, transforming raw field signals into structured intelligence.

### Automated Field Report Extraction (Multimodal)
1.  **Ingestion**: Photos of paper reports or voice SITREPs are passed to the AI ingestion layer.
2.  **Entity Extraction**: Gemini extracts structured JSON, including:
    -   Need Category (e.g., Medical, Sanitation).
    -   Severity metrics and **Panic/Stress Sentiment**.
    -   Geospatial indicators (Landmarks/Addresses).
3.  **Voice-to-Intel**: AI transcribes and structures dictations into "Field Notes" attached to active missions.

---

## 2. The Janrakshak Priority Metric (JPM)

The JPM is a normalized score (0-100) used to rank incoming requests by objective urgency.

### Calculation Formula:
| Variable | Weight | Description |
| :--- | :--- | :--- |
| **Urgency (U)** | 35% | 1-5 scale (Life-saving = 5, Indirect Support = 1). |
| **Sentiment (S)** | 10% | AI-extracted emotional panic (1.0 - 1.5x multiplier). |
| **Population (P)** | 20% | Number of people affected; higher counts accelerate priority. |
| **Vulnerability (V)** | 20% | Demographic risks (children, elderly, medical). |
| **Time Decay (T)** | 15% | Automatic point increase for pending requests to prevent starvation. |

---

## 3. The "Trust & Impact" Economy (DTS)

The DTS is a dynamic reputation engine (0-100) that ensures the reliability of field operatives based on verifiable results.

### The Mathematics of Impact:
Points awarded upon mission completion:
`Mission_Points = Base_Points + (Need_Urgency * 0.5) + (Need_Severity * 0.3)`
- **Speed Bonus**: Completion within the AI-estimated window provides a 1.2x multiplier.

### Proof-of-Resolution (The Verification Loop):
To ensure actual social impact, every mission closure requires a **Triple-Handshake of Proof**:
1.  **Visual Intelligence**: Photo record of the resolved need linked to the audit trail.
2.  **Geospatial Telemetry**: GPS coordinates captured at the moment of closure and cross-referenced with incident location.
3.  **Citizen Acknowledgment**: Optional confirmation from the original requester for a final trust boost.

---

## 4. Operational Governance & Guardrails

-   **Human-in-the-loop**: AI-extracted requests remain "System Proposed" until confirmed by an Admin.
-   **Penalty Logic**: Mission abandonment or 24h inactivity results in a 5% Trust Score reduction.
-   **Transparency**: Every matching recommendation can be "explained" by the AI to ensure accountability.

---
*Intelligence Specification v2.8.5 - Production Hardened*
*Unifying data. Empowering people. Saving lives.*
