# RBAC Plan: Admin, Volunteer, User

## Summary
Define a strict 3-role RBAC model for Janrakshak with `admin`, `volunteer`, and `user` only.  
Primary goals:
- Remove permission ambiguity in current routes.
- Align backend authorization with operations manual.
- Enforce least privilege while preserving core workflows.

## Role Model and Permissions

### 1. `admin` (full command)
Allowed capabilities:
- Manage needs: create, list, view, update, reprioritize.
- Manage volunteers: create/list/view/update.
- Manage resources: create/list/update/shortages.
- Matching + dispatch: suggest, explain, auto-assign, create missions.
- Mission completion override (can complete/close any mission).
- Citizen report review + conversion to needs.
- Dashboard + analytics + audit log.
- Disaster mode toggle + disaster state view.
- AI insight + AI forecast.
- Seed/demo initialization (non-production only).

Denied capabilities:
- None (except future explicit system-level constraints if added).

### 2. `volunteer` (field response)
Allowed capabilities:
- View own profile and auth/me.
- Create/update own volunteer profile only.
- View needs, volunteers list/leaderboard, resources (read-only), dashboard summaries.
- Use matching suggest/explain (read-only decision support).
- View missions assigned to self.
- Complete mission only if volunteer is assigned to that mission.
- Submit citizen reports if needed by field flow.
- View disaster state.

Denied capabilities:
- Need update/reprioritize.
- Resource create/update.
- Auto-assign and mission creation.
- Citizen report conversion.
- Audit log access.
- Disaster toggle.
- AI forecast admin endpoint.
- Seed/demo.

### 3. `user` (public access)
Allowed capabilities:
- Register/login/auth/me.
- Create needs and citizen reports.
- View own submitted needs/reports and allowed public read endpoints.
- View disaster state.
- Optional: basic dashboard read if currently public.

Denied capabilities:
- Volunteer profile management (unless user upgrades role).
- Mission endpoints.
- Matching/dispatch actions.
- Resource inventory create/update (per chosen policy: needs + reports only).
- Audit/disaster toggle/seed/admin analytics.

## Route Authorization Matrix (Target State)

- **Auth**
  - `POST /api/auth/register`, `POST /api/auth/login`: public
  - `GET /api/auth/me`: any authenticated role

- **Needs**
  - `POST /api/needs`: `user`, `volunteer`, `admin`
  - `GET /api/needs`, `GET /api/needs/{id}`: authenticated (`user|volunteer|admin`)
  - `PATCH /api/needs/{id}`, `POST /api/needs/reprioritize`: `admin` only

- **Volunteers**
  - `POST /api/volunteers`: authenticated; creates volunteer profile for self only
  - `PATCH /api/volunteers/{id}`: self (`volunteer` owner) or `admin`
  - `GET /api/volunteers`, `/leaderboard`: authenticated read

- **Resources**
  - `GET /api/resources`, `/shortages`: authenticated read
  - `POST /api/resources`, `PATCH /api/resources/{id}`: `admin` only

- **Matching + Missions**
  - `POST /api/matching/suggest/{need_id}`, `/explain/{need_id}`: `volunteer|admin`
  - `POST /api/matching/auto-assign/{need_id}`: `admin`
  - `POST /api/missions`: `admin`
  - `GET /api/missions`: `admin` sees all; `volunteer` sees assigned; `user` denied
  - `POST /api/missions/{mid}/complete`: assigned `volunteer` or `admin`

- **Citizen Reports**
  - `POST /api/citizen/reports`: public or authenticated
  - `GET /api/citizen/reports`, `POST /api/citizen/reports/{rid}/convert`: `admin`

- **Ops / Analytics / System**
  - `GET /api/dashboard/*`: authenticated read
  - `GET /api/analytics/overview`: `admin` (or restricted summary to others if explicitly needed)
  - `GET /api/analytics/audit-log`: `admin` only
  - `POST /api/disaster/toggle`: `admin` only
  - `GET /api/disaster/state`: authenticated read
  - `POST /api/ai/insight`: authenticated
  - `POST /api/ai/forecast`: `admin` only
  - `POST /api/seed/demo`: `admin` only, disabled in production

## Implementation Changes (Decision-Complete)

1. **Canonical roles**
- Treat only `admin|volunteer|user` as valid everywhere (models, claims, guards).
- Remove/replace legacy role references (`field_worker`, `analyst`, `donor`) with mapped final behavior:
  - privileged ops -> `admin`
  - donor resource write -> removed from non-admin
  - analyst audit access -> `admin` only

2. **Centralized policy map**
- Create one permission matrix constant keyed by route action.
- Route handlers use a single helper (`require_roles` + ownership checks) to avoid drift.

3. **Ownership enforcement**
- Add explicit ownership checks for:
  - volunteer profile patch (self or admin)
  - mission completion (assigned volunteer or admin)
  - optional self-only reads for user-submitted records

4. **Data/claims consistency**
- On auth/me and token verification, normalize unknown/missing role to `user`.
- Ensure register accepts only canonical 3 roles.
- Keep admin override behavior explicit and audited.

5. **Documentation alignment**
- Update `OPERATIONS_MANUAL.md` and `API_DOCS.md` to match exact route-level permissions.
- Add a compact role-permission table and “denied actions” list per role.

## Test Plan

1. **Authorization matrix tests**
- For each protected endpoint, verify allow/deny for `admin`, `volunteer`, `user`, and unauthenticated.
- Include 401 vs 403 correctness.

2. **Ownership tests**
- Volunteer can patch own profile, cannot patch another volunteer.
- Volunteer can complete assigned mission, cannot complete unassigned mission.

3. **Regression tests**
- Need creation still works for user.
- Admin dispatch flow (suggest -> auto-assign -> mission create -> complete) remains functional.
- Disaster toggle and audit log remain admin-only.

4. **Negative/security tests**
- Token with unknown role defaults to least privilege (`user`).
- Attempted privilege escalation via request body role fields is ignored/blocked.

## Assumptions and Defaults
- Confirmed policy defaults used:
  - `user`: needs + reports only (no resource write).
  - `volunteer`: can complete only own assigned missions.
  - `admin`: only role that can toggle disaster mode and access full audit logs.
- Plan targets backend-enforced RBAC first; frontend visibility will mirror backend permissions.
