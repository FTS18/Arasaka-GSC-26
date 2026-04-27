# Contributing to Janrakshak

### Standards for High-Efficiency Humanitarian Development

Janrakshak is a mission-critical platform. We welcome contributions that improve its reliability, performance, and security. This document outlines the standards for entering our development pipeline.

---

## 1. Code Quality Standards

### Python (Backend)
-   **Style**: Adhere strictly to **PEP 8** guidelines.
-   **Validation**: Every endpoint model must use **Pydantic** for rigorous data validation.
-   **Asynchrony**: Use `async`/`await` for all I/O bound operations to maintain high-speed telemetry.
-   **Auditability**: Every functional change must include appropriate logging for the Audit Trail.

### JavaScript/React (Frontend)
-   **Design**: All components must use the project's **Refined Brutalist "Bone" Palette**. Avoid ad-hoc styling.
-   **Efficiency**: Optimize for **Core Web Vitals**, specifically maintaining the Zero-CLS skeletal hydration strategy.
-   **Accessibility**: Maintain compliance with **WCAG 2.1** standards.

---

## 2. Development Workflow

1.  **Branching Strategy**: Use feature branches (e.g., `feature/ai-integration` or `fix/telemetry-latency`).
2.  **Pull Requests**:
    *   PRs must be concise and focused on a single tactical objective.
    *   Documentation in `REFERENCE.md` or `INTELLIGENCE.md` must be updated in tandem with code changes.
    *   Include verified test results from the `simulate_crisis.py` engine for any logic changes.

---

## 3. Testing Requirements

-   **Unit Tests**: Use `pytest` for backend logic validation.
-   **Simulation**: All mission-matching changes must be stress-tested using the `backend/scripts/simulate_crisis.py` engine to verify scaling stability.
-   **Security**: Any change to authorization logic requires a manual review of `SECURITY.md` and `firestore.rules`.

---

## 4. Operational Ethics

When contributing to Janrakshak, remember that this platform serves vulnerable communities.
-   Never commit hardcoded API keys or sensitive project IDs.
-   Prioritize data privacy and system uptime over cosmetic changes.
-   Ensure all user-facing strings are correctly localized within the `I18nContext`.

---
*Contributor Guidelines v2.8.5 - Production Hardened*
*Unifying data. Empowering people. Saving lives.*
