"""
Seed Firebase Auth + Firestore with demo data used by the frontend.

Usage:
    python scripts/seed_firestore.py
"""

from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

from dotenv import load_dotenv
import firebase_admin
from firebase_admin import auth, credentials, firestore


ROOT_DIR = Path(__file__).resolve().parents[1]
load_dotenv(ROOT_DIR / ".env")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def build_firebase_credentials():
    sa_file = os.environ.get("FIREBASE_SERVICE_ACCOUNT_FILE")
    sa_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
    if sa_file:
        return credentials.Certificate(sa_file)
    if sa_json:
        return credentials.Certificate(json.loads(sa_json))
    return credentials.ApplicationDefault()


def init_firebase():
    if firebase_admin._apps:
        return
    project_id = os.environ.get("FIREBASE_PROJECT_ID")
    opts = {"projectId": project_id} if project_id else None
    firebase_admin.initialize_app(build_firebase_credentials(), opts)


def ensure_auth_user(email: str, password: str, display_name: str, role: str) -> str:
    try:
        rec = auth.get_user_by_email(email)
        auth.update_user(rec.uid, password=password, display_name=display_name, disabled=False)
        uid = rec.uid
    except auth.UserNotFoundError:
        rec = auth.create_user(email=email, password=password, display_name=display_name)
        uid = rec.uid

    auth.set_custom_user_claims(uid, {"role": role})
    return uid


PUBLIC_ORG = "public"


def upsert_user(users_col, uid: str, name: str, email: str, role: str, language: str = "en"):
    users_col.document(uid).set(
        {
            "id": uid,
            "name": name,
            "email": email,
            "role": role,
            "org_id": PUBLIC_ORG,
            "phone": None,
            "language": language,
            "onboarded": True,
            "created_at": now_iso(),
        },
        merge=True,
    )


def seed_system(db):
    db.collection("system").document("state").set(
        {
            "id": "state",
            "disaster_mode": False,
            "disaster_reason": None,
            "updated_at": now_iso(),
        },
        merge=True,
    )


def seed_resources(db):
    resources = [
        {"name": "Food Packets (ready-to-eat)", "category": "food", "quantity": 450, "min_threshold": 100, "lat": 28.6139, "lng": 77.2090, "warehouse": "Delhi Central Depot"},
        {"name": "Water Bottles (1L)", "category": "water", "quantity": 820, "min_threshold": 200, "lat": 28.6139, "lng": 77.2090, "warehouse": "Delhi Central Depot"},
        {"name": "Blankets", "category": "blanket", "quantity": 75, "min_threshold": 100, "lat": 28.5355, "lng": 77.3910, "warehouse": "East Delhi Hub"},
        {"name": "Oxygen Cylinders", "category": "oxygen_cylinder", "quantity": 8, "min_threshold": 15, "lat": 28.6139, "lng": 77.2090, "warehouse": "Delhi Central Depot"},
        {"name": "Hygiene Kits", "category": "hygiene_kit", "quantity": 140, "min_threshold": 50, "lat": 28.7041, "lng": 77.1025, "warehouse": "North Sub-Depot"},
        {"name": "Medicine Kit (basic)", "category": "medicine", "quantity": 60, "min_threshold": 40, "lat": 28.6139, "lng": 77.2090, "warehouse": "Delhi Central Depot"},
        {"name": "Relief Vans", "category": "vehicle", "quantity": 4, "min_threshold": 3, "lat": 28.6139, "lng": 77.2090, "warehouse": "Delhi Central Depot"},
    ]

    col = db.collection("resources")
    for item in resources:
        doc_id = item["name"].lower().replace(" ", "_").replace("(", "").replace(")", "").replace("-", "_")
        col.document(doc_id).set(
            {
                "id": doc_id,
                "name": item["name"],
                "category": item["category"],
                "quantity": item["quantity"],
                "unit": "units",
                "min_threshold": item["min_threshold"],
                "warehouse": item["warehouse"],
                "org_id": PUBLIC_ORG,
                "location": {"lat": item["lat"], "lng": item["lng"], "address": None},
                "updated_at": now_iso(),
            },
            merge=True,
        )


def seed_needs(db):
    needs = [
        {"title": "Flood relief - 40 families stranded", "category": "disaster_relief", "description": "Families stuck on rooftops in East Delhi after heavy rainfall. Need boats, food, medical.", "lat": 28.6508, "lng": 77.3152, "urgency": 5, "ppl": 160, "vuln": ["children", "elderly"], "severity": 5},
        {"title": "Medicine shortage at shelter", "category": "medical", "description": "Insulin and ORS running low at community shelter.", "lat": 28.5355, "lng": 77.3910, "urgency": 4, "ppl": 45, "vuln": ["elderly"], "severity": 4},
        {"title": "Food packets for street children", "category": "food", "description": "Night shelter requesting daily meal kits for 30 kids.", "lat": 28.6139, "lng": 77.2090, "urgency": 3, "ppl": 30, "vuln": ["children"], "severity": 3},
        {"title": "Blood - O-negative urgent", "category": "blood_donation", "description": "Accident victim at AIIMS needs O- donors within 4 hours.", "lat": 28.5672, "lng": 77.2100, "urgency": 5, "ppl": 1, "vuln": ["none"], "severity": 5},
        {"title": "Classroom tutor volunteers", "category": "education", "description": "Slum school needs math tutors for evening classes.", "lat": 28.7041, "lng": 77.1025, "urgency": 2, "ppl": 60, "vuln": ["children"], "severity": 2},
        {"title": "Sanitation drive request", "category": "sanitation", "description": "Residents request cleanup after market waste pileup.", "lat": 28.4595, "lng": 77.0266, "urgency": 2, "ppl": 200, "vuln": ["none"], "severity": 2},
        {"title": "Emergency transport - pregnant woman", "category": "emergency_transport", "description": "Pregnant woman in labor needs transport to hospital.", "lat": 28.6304, "lng": 77.2177, "urgency": 5, "ppl": 1, "vuln": ["pregnant"], "severity": 5},
        {"title": "Shelter for displaced", "category": "shelter", "description": "12 families evicted, need temporary shelter tonight.", "lat": 28.6500, "lng": 77.2500, "urgency": 4, "ppl": 48, "vuln": ["children", "elderly"], "severity": 4},
    ]

    col = db.collection("needs")
    for item in needs:
        doc_id = item["title"].lower().replace(" ", "_").replace("-", "_")
        col.document(doc_id).set(
            {
                "id": doc_id,
                "title": item["title"],
                "category": item["category"],
                "description": item["description"],
                "location": {"lat": item["lat"], "lng": item["lng"], "address": None},
                "urgency": item["urgency"],
                "people_affected": item["ppl"],
                "vulnerability": item["vuln"],
                "severity": item["severity"],
                "weather_factor": 1,
                "source": "admin",
                "evidence_urls": [],
                "org_id": PUBLIC_ORG,
                "status": "pending",
                "priority_score": float(item["urgency"]) * 20.0,
                "created_by": None,
                "assigned_volunteer_ids": [],
                "mission_id": None,
                "created_at": now_iso(),
                "updated_at": now_iso(),
            },
            merge=True,
        )


def seed_auth_and_profiles(db) -> List[Dict[str, str]]:
    # These credentials are the same defaults shown in frontend/src/pages/Login.jsx.
    demo_credentials = [
        {"role": "admin", "name": "Command Admin", "email": "admin@janrakshakops.com", "password": "Admin@12345", "language": "en"},
        {"role": "user", "name": "Relief User", "email": "user@janrakshakops.com", "password": "User@12345", "language": "en"},
        {"role": "volunteer", "name": "Field Volunteer", "email": "volunteer@janrakshakops.com", "password": "Volunteer@12345", "language": "en"},
    ]

    users_col = db.collection("users")
    volunteers_col = db.collection("volunteers")
    seeded_users: Dict[str, str] = {}
    for cred in demo_credentials:
        uid = ensure_auth_user(
            email=cred["email"],
            password=cred["password"],
            display_name=cred["name"],
            role=cred["role"],
        )
        seeded_users[cred["email"]] = uid
        upsert_user(users_col, uid, cred["name"], cred["email"], cred["role"], cred["language"])

    volunteer_uid = seeded_users["volunteer@janrakshakops.com"]
    volunteers_col.document(volunteer_uid).set(
        {
            "id": volunteer_uid,
            "user_id": volunteer_uid,
            "name": "Field Volunteer",
            "org_id": PUBLIC_ORG,
            "skills": ["first_aid", "logistics", "hindi"],
            "languages": ["en", "hi"],
            "availability": "available",
            "working_radius_km": 10,
            "transport": "bike",
            "certifications": [],
            "base_location": {"lat": 28.6139, "lng": 77.2090, "address": None},
            "trust_score": 90.0,
            "completed_missions": 5,
            "response_speed_min": 30,
            "created_at": now_iso(),
        },
        merge=True,
    )

    extra_volunteers = [
        {"name": "Ananya Rao", "skills": ["first_aid", "hindi", "driving"], "transport": "car", "trust": 94, "lat": 28.6139, "lng": 77.2090},
        {"name": "Rajesh Kumar", "skills": ["logistics", "hindi", "english"], "transport": "van", "trust": 88, "lat": 28.5355, "lng": 77.3910},
        {"name": "Priya Sharma", "skills": ["medical", "english"], "transport": "bike", "trust": 91, "lat": 28.7041, "lng": 77.1025},
        {"name": "Mohammed Khan", "skills": ["translator", "cooking"], "transport": "none", "trust": 76, "lat": 28.4595, "lng": 77.0266},
        {"name": "Lakshmi Iyer", "skills": ["counseling", "tamil", "english"], "transport": "car", "trust": 85, "lat": 28.6304, "lng": 77.2177},
    ]

    for v in extra_volunteers:
        email = f"{v['name'].lower().replace(' ', '.')}@volunteer.org"
        uid = ensure_auth_user(email=email, password="Volunteer@1", display_name=v["name"], role="volunteer")
        upsert_user(users_col, uid, v["name"], email, "volunteer")
        volunteers_col.document(uid).set(
            {
                "id": uid,
                "user_id": uid,
                "name": v["name"],
                "org_id": PUBLIC_ORG,
                "skills": v["skills"],
                "languages": ["en", "hi"],
                "availability": "available",
                "working_radius_km": 10,
                "transport": v["transport"],
                "certifications": [],
                "base_location": {"lat": v["lat"], "lng": v["lng"], "address": None},
                "trust_score": float(v["trust"]),
                "completed_missions": int(v["trust"] / 10),
                "response_speed_min": 30,
                "created_at": now_iso(),
            },
            merge=True,
        )

    return demo_credentials


def seed_missions(db, seeded_users: dict):
    """
    Seed 3 realistic demo missions that reference seeded need IDs.
    Statuses: active (judges see it live), planned, completed.
    """
    volunteer_uid = seeded_users.get("volunteer@janrakshakops.com", "")

    missions = [
        {
            "id": "mission_flood_response_alpha",
            "need_ids": ["flood_relief___40_families_stranded", "shelter_for_displaced"],
            "volunteer_ids": [volunteer_uid] if volunteer_uid else [],
            "org_id": PUBLIC_ORG,
            "status": "active",
            "route": [
                {"lat": 28.6508, "lng": 77.3152, "address": "East Delhi Flood Zone"},
                {"lat": 28.6500, "lng": 77.2500, "address": "Displaced Families Camp"},
            ],
            "resource_allocations": [
                {"resource_id": "food_packets_ready_to_eat_", "quantity": 80},
                {"resource_id": "blankets", "quantity": 30},
            ],
            "proof_urls": [],
            "completion_notes": None,
            "created_at": now_iso(),
            "completed_at": None,
        },
        {
            "id": "mission_medical_supply_bravo",
            "need_ids": ["medicine_shortage_at_shelter", "blood___o_negative_urgent"],
            "volunteer_ids": [],
            "org_id": PUBLIC_ORG,
            "status": "planned",
            "route": [
                {"lat": 28.5355, "lng": 77.3910, "address": "Community Shelter"},
                {"lat": 28.5672, "lng": 77.2100, "address": "AIIMS Blood Bank"},
            ],
            "resource_allocations": [
                {"resource_id": "medicine_kit_basic_", "quantity": 15},
                {"resource_id": "oxygen_cylinders", "quantity": 2},
            ],
            "proof_urls": [],
            "completion_notes": None,
            "created_at": now_iso(),
            "completed_at": None,
        },
        {
            "id": "mission_food_distribution_charlie",
            "need_ids": ["food_packets_for_street_children"],
            "volunteer_ids": [],
            "org_id": PUBLIC_ORG,
            "status": "completed",
            "route": [
                {"lat": 28.6139, "lng": 77.2090, "address": "Delhi Central Depot"},
                {"lat": 28.6139, "lng": 77.2090, "address": "Night Shelter — Connaught Place"},
            ],
            "resource_allocations": [
                {"resource_id": "food_packets_ready_to_eat_", "quantity": 30},
            ],
            "proof_urls": [],
            "completion_notes": "30 meal kits distributed to night shelter. All 30 children fed. Mission closed 22:15 IST.",
            "created_at": now_iso(),
            "completed_at": now_iso(),
        },
    ]

    col = db.collection("missions")
    for m in missions:
        col.document(m["id"]).set(m, merge=True)
    print(f"  ✓ {len(missions)} missions seeded.")


def main():
    init_firebase()
    db = firestore.client()

    seed_system(db)
    credentials_seeded = seed_auth_and_profiles(db)
    seed_needs(db)
    seed_resources(db)

    # Build a uid lookup for missions
    seeded_uids = {}
    for cred in credentials_seeded:
        try:
            from firebase_admin import auth as fb_auth
            rec = fb_auth.get_user_by_email(cred["email"])
            seeded_uids[cred["email"]] = rec.uid
        except Exception:
            pass
    seed_missions(db, seeded_uids)

    print("Seed completed.")
    print("Frontend login credentials:")
    for cred in credentials_seeded:
        print(f"- {cred['role']}: {cred['email']} / {cred['password']}")


if __name__ == "__main__":
    main()
