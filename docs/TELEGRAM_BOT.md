# Janrakshak: Telegram Command Interface

### Rapid-Deployment Tactical Bot for Field Operatives
The Janrakshak Telegram Bot is a high-speed, lightweight "thin-client" designed for field users who need to report incidents or check mission status without full web-dashboard access. It serves as a resilient bridge in high-stress, low-bandwidth scenarios.

---

## 1. Core Implementation Strategy

The bot is built using a **Hybrid Intelligence Architecture**, combining deterministic logic for location with LLM-powered extraction for incident data.

### Multimodal Ingestion Protocols:
1.  **AI Visual Intelligence**: Send a photo of a handwritten report or a scene; the bot utilizes the Gemini-2.5-Flash vision pipeline to extract categories, urgency, and severity.
2.  **Guided Manual Triage**: A step-by-step interactive form for users who prefer structured text entry.
3.  **Command Directives**: Execute rapid data-pushes using text SITREPs.

---

## 2. Location Intelligence (3-Tier Resolver)

The bot prioritizes location accuracy through a prioritized resolution stack:

| Tier | Mechanism | Target Use Case |
| :--- | :--- | :--- |
| **Tier 1: Fast-Pass** | **Internal Cache** | Sub-50ms resolution for major cities (Mumbai, Delhi, Chennai, etc.). |
| **Tier 2: Global OSM** | **Nominatim API** | Real-time geocoding of specific street addresses or landmarks via OpenStreetMap. |
| **Tier 3: AI Inference** | **Gemini Reasoning** | Predictive coordinate estimation from situational descriptions (Absolute Fallback). |
| **Tier 4: Native PIN** | **Telegram Location** | Zero-error precision via the device's native GPS pin sharing. |

---

## 3. User Commands & Interactions

| Command | Action | Description |
| :--- | :--- | :--- |
| `/start` | **Initialize** | Authenticates the session and opens the tactical menu. |
| **[Dispatch]** | **Launch Report** | Triggers the selection between AI and Manual reporting modes. |
| **[AI Mode]** | **Visual OCR** | Requests a photo for automated data extraction. |
| **[Manual Mode]** | **Form Entry** | Launches a sequence of questions for Urgency, Severity, and Title. |

---

## 4. The Bot-to-Web Handshake (Deep-Link Protocol)

One of the most advanced features of the Janrakshak bot is the ability to securely hand off a volunteer's session to the high-fidelity web dashboard:
1.  **Context Capture**: When a mission is assigned, the bot generates a "Command Link" containing an encrypted JWT payload.
2.  **State Preservation**: Tapping the link opens the **Web Tactical Modal** with the specific mission details pre-loaded, bypassing the need for manual navigation or redundant login.
3.  **Frictionless Transition**: Ensures operatives can move from the lightweight Telegram chat to the powerful React geospatial dashboard in a single tap.

## 5. Technical Integration

### The Data Bridge
The bot is directly integrated into the Janrakshak telemetry core:
-   **Priority Calculation**: Every report submitted via Telegram is instantly processed by the **Janrakshak Priority Metric (JPM)** engine.
-   **Universal Submission**: Data is injected into the primary Firestore `needs` collection, making it instantly visible on the Admin Command Map.
-   **Media Handling**: Photos are processed in-memory and optionally synced to Cloudinary for permanent evidence storage.

---

## 5. Security & Availability

-   **Stateless Operations**: The bot manages local user states asynchronously, allowing it to handle hundreds of concurrent reporting sessions.
-   **Rate Limiting**: Built-in 429-handling that automatically switches users from AI to Manual mode if backend quotas are strained.
-   **Webhook Support**: Designed to run via high-frequency webhooks for production environments, while supporting Long-Polling for rapid tactical development.

---
*Telegram Interface v2.0.0 - Mission Ready*
*Developed for the 2026 Google Solution Challenge*
