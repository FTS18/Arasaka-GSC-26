# Janrakshak Mobile App

Flutter mobile client for Janrakshak user and volunteer roles.

## Implemented Feature Coverage

- Authentication: login, register, session restore, logout
- Onboarding enforcement and role setup for user and volunteer
- Role-based dashboards:
	- User dashboard with personal need tracking + global stats
	- Volunteer dashboard with missions, trust score, leaderboard, quick claim
- Needs workflows:
	- Needs list with search, status/category filters, pagination
	- Create need request with triage fields (urgency, severity, weather, vulnerability)
	- Need detail with map view, claim, AI explain, AI proof verification, mark complete
- Missions workflows:
	- Missions list
	- Mission completion with notes/proof payload
- Ops workflows (volunteer):
	- Map with layers: needs, volunteers, resources
	- Volunteers roster + detail
	- Resources list + requisition flow
- Profile settings:
	- Profile update
	- Volunteer availability/base location/skills update
	- Role toggle user <-> volunteer
- Resilience and real-time:
	- Offline mutation queue (SQLite) with reconnect sync
	- Connectivity monitoring
	- WebSocket live assignment alert for volunteer matching events

## Run

1. Open terminal in this folder:

```powershell
cd mobile_app
```

2. Get dependencies:

```powershell
flutter pub get
```

3. Run on emulator/device:

```powershell
flutter run
```

## Backend URL Configuration

Default backend URL in app code:

- http://10.0.2.2:8000/api (works for Android emulator if backend runs on host)

Override backend URL at runtime using dart-define:

```powershell
flutter run --dart-define=BACKEND_URL=http://YOUR_HOST:8000/api
```

Examples:

- Android emulator with host backend: http://10.0.2.2:8000/api
- Physical device on same Wi-Fi: http://192.168.x.x:8000/api

## Validation

- flutter analyze: no issues
- flutter test: all tests passed
