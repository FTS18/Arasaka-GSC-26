"""JANRAKSHAK Backend API Tests - Tactical Resource Management System"""
import os
import pytest
import requests
import time

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://need-dispatch-ai.preview.janrakshakops.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@janrakshakops.com"
ADMIN_PASS = "Admin@12345"
VOL_EMAIL = "ananya.rao@volunteer.org"
VOL_PASS = "Volunteer@1"


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=20)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def volunteer_token():
    r = requests.post(f"{API}/auth/login", json={"email": VOL_EMAIL, "password": VOL_PASS}, timeout=20)
    assert r.status_code == 200, f"Volunteer login failed: {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def citizen_token():
    email = f"TEST_citizen_{int(time.time())}@janrakshakops.com"
    r = requests.post(f"{API}/auth/register", json={
        "name": "TEST Citizen", "email": email, "password": "Cit@123", "role": "citizen"
    }, timeout=20)
    assert r.status_code == 200, r.text
    return r.json()["token"]


def h(tok):
    return {"Authorization": f"Bearer {tok}"}


# ---------- AUTH ----------
class TestAuth:
    def test_root(self):
        r = requests.get(f"{API}/", timeout=15)
        assert r.status_code == 200
        assert "Janrakshak" in r.json().get("service", "")

    def test_login_admin(self, admin_token):
        assert isinstance(admin_token, str) and len(admin_token) > 20

    def test_me(self, admin_token):
        r = requests.get(f"{API}/auth/me", headers=h(admin_token), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"

    def test_login_bad(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_register_volunteer(self):
        email = f"TEST_vol_{int(time.time())}@janrakshakops.com"
        r = requests.post(f"{API}/auth/register", json={
            "name": "TEST Vol", "email": email, "password": "Vol@123", "role": "volunteer"
        }, timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert "token" in data and data["user"]["role"] == "volunteer"


# ---------- NEEDS ----------
class TestNeeds:
    def test_list_needs_sorted(self):
        r = requests.get(f"{API}/needs", timeout=20)
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 5
        # sorted by priority_score desc
        scores = [n["priority_score"] for n in items]
        assert scores == sorted(scores, reverse=True)
        # verify _id not exposed
        assert "_id" not in items[0]

    def test_top_need_is_flood(self):
        r = requests.get(f"{API}/needs", timeout=20)
        items = r.json()
        # Flood need should be in top entries
        titles = [n["title"] for n in items[:3]]
        assert any("Flood" in t for t in titles), f"Expected Flood need in top 3, got {titles}"

    def test_priority_scoring_range(self):
        r = requests.get(f"{API}/needs", timeout=20)
        for n in r.json():
            assert 0 <= n["priority_score"] <= 100

    def test_create_need_returns_priority(self, admin_token):
        body = {
            "title": "TEST_high urgency flood",
            "category": "disaster_relief",
            "description": "test",
            "location": {"lat": 28.6, "lng": 77.2},
            "urgency": 5, "people_affected": 200,
            "vulnerability": ["children", "elderly"],
            "severity": 5, "weather_factor": 4,
        }
        r = requests.post(f"{API}/needs", json=body, headers=h(admin_token), timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["priority_score"] > 50
        assert data["id"]
        # GET to verify persistence
        g = requests.get(f"{API}/needs/{data['id']}", timeout=15)
        assert g.status_code == 200
        assert g.json()["title"] == body["title"]

    def test_priority_higher_for_urgent(self, admin_token):
        low = {"title": "TEST_low", "category": "other", "description": "x",
               "location": {"lat": 28.6, "lng": 77.2}, "urgency": 1, "people_affected": 1,
               "vulnerability": ["none"], "severity": 1, "weather_factor": 1}
        high = {"title": "TEST_high", "category": "disaster_relief", "description": "x",
                "location": {"lat": 28.6, "lng": 77.2}, "urgency": 5, "people_affected": 400,
                "vulnerability": ["children", "elderly", "disabled"], "severity": 5, "weather_factor": 5}
        r1 = requests.post(f"{API}/needs", json=low, headers=h(admin_token), timeout=15)
        r2 = requests.post(f"{API}/needs", json=high, headers=h(admin_token), timeout=15)
        assert r2.json()["priority_score"] > r1.json()["priority_score"]

    def test_create_need_requires_auth(self):
        r = requests.post(f"{API}/needs", json={
            "title": "TEST_x", "category": "food", "description": "x",
            "location": {"lat": 1, "lng": 1}, "urgency": 3
        }, timeout=15)
        assert r.status_code == 401

    def test_patch_need_admin(self, admin_token):
        lst = requests.get(f"{API}/needs", timeout=15).json()
        nid = lst[0]["id"]
        r = requests.patch(f"{API}/needs/{nid}", json={"status": "in_progress"}, headers=h(admin_token), timeout=15)
        assert r.status_code == 200
        assert r.json()["status"] == "in_progress"
        # restore
        requests.patch(f"{API}/needs/{nid}", json={"status": "pending"}, headers=h(admin_token), timeout=15)

    def test_reprioritize(self, admin_token):
        r = requests.post(f"{API}/needs/reprioritize", headers=h(admin_token), timeout=30)
        assert r.status_code == 200
        assert r.json().get("ok") is True


# ---------- VOLUNTEERS ----------
class TestVolunteers:
    def test_list(self):
        r = requests.get(f"{API}/volunteers", timeout=15)
        assert r.status_code == 200
        assert len(r.json()) >= 5

    def test_leaderboard(self):
        r = requests.get(f"{API}/volunteers/leaderboard", timeout=15)
        assert r.status_code == 200
        lst = r.json()
        scores = [v["trust_score"] for v in lst]
        assert scores == sorted(scores, reverse=True)


# ---------- RESOURCES ----------
class TestResources:
    def test_list(self):
        r = requests.get(f"{API}/resources", timeout=15)
        assert r.status_code == 200
        assert len(r.json()) >= 5

    def test_shortages_seeded(self):
        r = requests.get(f"{API}/resources/shortages", timeout=15)
        assert r.status_code == 200
        lst = r.json()
        # Seeded: Blankets (75/100) and Oxygen Cylinders (8/15)
        assert len(lst) >= 2
        for res in lst:
            assert res["quantity"] <= res["min_threshold"]

    def test_create_resource_donor_role_blocked_citizen(self, citizen_token):
        r = requests.post(f"{API}/resources", json={
            "name": "TEST_res", "category": "food", "quantity": 10,
            "location": {"lat": 1, "lng": 1}
        }, headers=h(citizen_token), timeout=15)
        assert r.status_code == 403

    def test_create_resource_admin(self, admin_token):
        r = requests.post(f"{API}/resources", json={
            "name": "TEST_resource_item", "category": "food", "quantity": 100,
            "min_threshold": 10, "location": {"lat": 28.6, "lng": 77.2}
        }, headers=h(admin_token), timeout=15)
        assert r.status_code == 200
        assert r.json()["name"] == "TEST_resource_item"


# ---------- MATCHING ----------
class TestMatching:
    def test_suggest(self, admin_token):
        needs = requests.get(f"{API}/needs", params={"status": "pending"}, timeout=15).json()
        nid = needs[0]["id"]
        r = requests.post(f"{API}/matching/suggest/{nid}", headers=h(admin_token), timeout=20)
        assert r.status_code == 200
        matches = r.json()
        if len(matches) >= 2:
            assert matches[0]["match_score"] >= matches[1]["match_score"]

    def test_auto_assign(self, admin_token):
        # create a fresh need to auto-assign
        body = {"title": "TEST_assign_flow", "category": "medical", "description": "test",
                "location": {"lat": 28.6139, "lng": 77.2090}, "urgency": 4,
                "people_affected": 10, "vulnerability": ["elderly"], "severity": 4}
        nid = requests.post(f"{API}/needs", json=body, headers=h(admin_token), timeout=15).json()["id"]
        r = requests.post(f"{API}/matching/auto-assign/{nid}", headers=h(admin_token), timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "assigned_to" in data
        # verify need status + volunteer busy
        n = requests.get(f"{API}/needs/{nid}", timeout=15).json()
        assert n["status"] == "assigned"
        vid = data["assigned_to"]["id"]
        vols = requests.get(f"{API}/volunteers", timeout=15).json()
        match = next((v for v in vols if v["id"] == vid), None)
        assert match and match["availability"] == "busy"

    def test_explain_ai(self, admin_token):
        needs = requests.get(f"{API}/needs", timeout=15).json()
        nid = needs[0]["id"]
        r = requests.post(f"{API}/matching/explain/{nid}", headers=h(admin_token), timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "recommendation" in data
        assert isinstance(data["recommendation"], str) and len(data["recommendation"]) > 0


# ---------- MISSIONS ----------
class TestMissions:
    def test_mission_flow(self, admin_token):
        # Create need
        body = {"title": "TEST_mission_need", "category": "food", "description": "x",
                "location": {"lat": 28.6, "lng": 77.2}, "urgency": 3, "people_affected": 5,
                "vulnerability": ["none"], "severity": 3}
        nid = requests.post(f"{API}/needs", json=body, headers=h(admin_token), timeout=15).json()["id"]
        # Get an available volunteer
        vols = requests.get(f"{API}/volunteers", params={"availability": "available"}, timeout=15).json()
        if not vols:
            pytest.skip("No available volunteers")
        vid = vols[0]["id"]
        # Create mission
        mr = requests.post(f"{API}/missions", json={"need_ids": [nid], "volunteer_ids": [vid]},
                           headers=h(admin_token), timeout=15)
        assert mr.status_code == 200
        mid = mr.json()["id"]

        # pre-trust for comparison
        v_pre = next(v for v in requests.get(f"{API}/volunteers", timeout=15).json() if v["id"] == vid)
        pre_trust = v_pre["trust_score"]
        pre_completed = v_pre["completed_missions"]

        # Complete
        cr = requests.post(f"{API}/missions/{mid}/complete",
                           json={"proof_urls": ["http://x.com/p.jpg"], "completion_notes": "done"},
                           headers=h(admin_token), timeout=20)
        assert cr.status_code == 200
        # Verify need completed
        n = requests.get(f"{API}/needs/{nid}", timeout=15).json()
        assert n["status"] == "completed"
        # Verify trust updated
        v_post = next(v for v in requests.get(f"{API}/volunteers", timeout=15).json() if v["id"] == vid)
        assert v_post["completed_missions"] == pre_completed + 1
        assert abs(v_post["trust_score"] - min(100, pre_trust + 1.5)) < 0.01


# ---------- CITIZEN REPORTS ----------
class TestCitizenReports:
    def test_submit_public(self):
        r = requests.post(f"{API}/citizen/reports", json={
            "raw_text": "TEST 12 families stranded in Yamuna area need food and water urgently.",
            "reporter_name": "TEST Reporter", "language": "en"
        }, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["id"]
        # extracted should be a dict (AI result, may be raw)
        assert isinstance(data.get("extracted"), dict)

    def test_list_reports_admin(self, admin_token):
        r = requests.get(f"{API}/citizen/reports", headers=h(admin_token), timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_list_reports_forbidden_citizen(self, citizen_token):
        r = requests.get(f"{API}/citizen/reports", headers=h(citizen_token), timeout=15)
        assert r.status_code == 403


# ---------- DASHBOARD & ANALYTICS ----------
class TestDashboard:
    def test_stats(self):
        r = requests.get(f"{API}/dashboard/stats", timeout=15)
        assert r.status_code == 200
        data = r.json()
        for k in ("active_needs", "volunteers_total", "resource_shortages", "disaster_mode"):
            assert k in data

    def test_heatmap(self):
        r = requests.get(f"{API}/dashboard/heatmap", timeout=15)
        assert r.status_code == 200
        arr = r.json()
        if arr:
            assert "location" in arr[0] and "priority_score" in arr[0]

    def test_analytics_overview(self):
        r = requests.get(f"{API}/analytics/overview", timeout=15)
        assert r.status_code == 200
        data = r.json()
        for k in ("by_category", "by_status", "monthly_trend", "people_helped"):
            assert k in data

    def test_audit_log_admin(self, admin_token):
        r = requests.get(f"{API}/analytics/audit-log", headers=h(admin_token), timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_audit_log_forbidden_citizen(self, citizen_token):
        r = requests.get(f"{API}/analytics/audit-log", headers=h(citizen_token), timeout=15)
        assert r.status_code == 403


# ---------- DISASTER MODE ----------
class TestDisaster:
    def test_toggle_and_reprioritize(self, admin_token):
        # snapshot scores
        before = {n["id"]: n["priority_score"] for n in requests.get(f"{API}/needs", timeout=15).json()}
        # enable
        r = requests.post(f"{API}/disaster/toggle", json={"enabled": True, "reason": "TEST flood"},
                          headers=h(admin_token), timeout=30)
        assert r.status_code == 200
        assert r.json()["disaster_mode"] is True
        after = {n["id"]: n["priority_score"] for n in requests.get(f"{API}/needs", timeout=15).json()}
        # at least one boosted-category need should have increased
        boosted_increased = False
        for n in requests.get(f"{API}/needs", timeout=15).json():
            if n["category"] in ("disaster_relief", "medical", "emergency_transport", "shelter"):
                if n["id"] in before and after[n["id"]] > before[n["id"]]:
                    boosted_increased = True
                    break
        assert boosted_increased, "Expected at least one boosted need score to increase"
        # disable
        r2 = requests.post(f"{API}/disaster/toggle", json={"enabled": False},
                           headers=h(admin_token), timeout=30)
        assert r2.status_code == 200
        assert r2.json()["disaster_mode"] is False

    def test_disaster_toggle_forbidden_citizen(self, citizen_token):
        r = requests.post(f"{API}/disaster/toggle", json={"enabled": True},
                          headers=h(citizen_token), timeout=15)
        assert r.status_code == 403


# ---------- AI ----------
class TestAI:
    def test_ai_insight(self, admin_token):
        r = requests.post(f"{API}/ai/insight", json={"query": "Where should we send resources next?"},
                          headers=h(admin_token), timeout=60)
        assert r.status_code == 200
        assert isinstance(r.json().get("response"), str)
        assert len(r.json()["response"]) > 0

    def test_ai_insight_requires_auth(self):
        r = requests.post(f"{API}/ai/insight", json={"query": "x"}, timeout=20)
        assert r.status_code == 401

    def test_ai_forecast_admin(self, admin_token):
        r = requests.post(f"{API}/ai/forecast", headers=h(admin_token), timeout=60)
        assert r.status_code == 200
        assert isinstance(r.json().get("forecast"), str)

    def test_ai_forecast_forbidden_citizen(self, citizen_token):
        r = requests.post(f"{API}/ai/forecast", headers=h(citizen_token), timeout=15)
        assert r.status_code == 403


# ---------- RBAC Extra ----------
class TestRBAC:
    def test_citizen_cannot_reprioritize(self, citizen_token):
        r = requests.post(f"{API}/needs/reprioritize", headers=h(citizen_token), timeout=15)
        assert r.status_code == 403

    def test_citizen_cannot_patch_need(self, citizen_token):
        lst = requests.get(f"{API}/needs", timeout=15).json()
        nid = lst[0]["id"]
        r = requests.patch(f"{API}/needs/{nid}", json={"status": "cancelled"}, headers=h(citizen_token), timeout=15)
        assert r.status_code == 403
