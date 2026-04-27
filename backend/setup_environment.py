import uuid
import random
import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

def iso(dt=None):
    if not dt: dt = datetime.utcnow()
    return dt.isoformat() + "Z"

CITIES = [
    ("Mumbai", 19.0760, 72.8777), ("Delhi", 28.6139, 77.2090), ("Bangalore", 12.9716, 77.5946),
    ("Hyderabad", 17.3850, 78.4867), ("Ahmedabad", 23.0225, 72.5714), ("Chennai", 13.0827, 80.2707),
    ("Kolkata", 22.5726, 88.3639), ("Surat", 21.1702, 72.8311), ("Pune", 18.5204, 73.8567),
    ("Jaipur", 26.9124, 75.7873), ("Lucknow", 26.8467, 80.9462), ("Kanpur", 26.4499, 80.3319),
    ("Nagpur", 21.1458, 79.0882), ("Indore", 22.7196, 75.8577), ("Thane", 19.2183, 72.9781),
    ("Bhopal", 23.2599, 77.4126), ("Visakhapatnam", 17.6868, 83.2185), ("Patna", 25.5941, 85.1376),
    ("Vadodara", 22.3072, 73.1812), ("Chandigarh", 30.7333, 76.7794)
]

T_PREFIXES = ["Relief Request:", "Urgent:", "Sector Alert:", "Community Need:", "Infrastructure Issue:"]
T_SUFFIXES = ["Medicine Shortage", "Waterlogging", "Structural Damage", "Food Shortage", "Power Outage", "Evacuation Needed", "First Aid Required"]
S_DESCS = [
    "Ground reports suggest rising water levels near the main junction. Immediate team required for assessment.",
    "Community shelter running low on drinking water and dry rations for 50 people.",
    "Localized structural instability reported after heavy tremors. Residents evacuated to nearby park.",
    "Urgent medical supplies including antiseptic and bandages required for transit camp.",
    "Volunteers needed to manage traffic and crowd control near the relief distribution center."
]

NAMES = ["Arjun", "Aditya", "Rohan", "Siddharth", "Ishaan", "Vihaan", "Aarav", "Kabir", "Meera", "Ananya", "Diya", "Sana", "Zoya", "Riya", "Kavya"]
SURNAMES = ["Sharma", "Verma", "Iyer", "Nair", "Dubey", "Khan", "Patel", "Reddy", "Gupta", "Malhotra", "Kapoor", "Singh"]

# Initialize Firebase
service_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
if not service_json: exit(1)

cred_dict = json.loads(service_json)
if not firebase_admin._apps:
    cred = credentials.Certificate(cred_dict)
    firebase_admin.initialize_app(cred)
db = firestore.client()

def main():
    print("🚀 Deploying NGO-Grade Intelligence Grid...")
    
    v_count = 0
    m_count = 0

    # Clean existing for realism
    # Note: In a real app we'd be careful, but for this demo refresh is better
    
    for city_name, lat, lng in CITIES:
        for _ in range(5):
            vid = str(uuid.uuid4())
            name = f"{random.choice(NAMES)} {random.choice(SURNAMES)}"
            v_lat = lat + random.uniform(-0.06, 0.06)
            v_lng = lng + random.uniform(-0.06, 0.06)
            
            # 1. Realistic Volunteer
            vol_data = {
                "id": vid, "user_id": vid, "name": name, 
                "email": f"{name.lower().replace(' ', '.')}@janrakshak-ngo.org",
                "phone": f"+91 {random.randint(7000, 9999)}{random.randint(100000, 999999)}",
                "skills": random.choice([["medical"], ["logistics", "driving"], ["rescue"], ["food"], ["shelter"], ["water"]]),
                "base_location": {"lat": v_lat, "lng": v_lng},
                "city": city_name, # Added for filtering
                "availability": random.choice(["available", "busy", "available", "available"]),
                "trust_score": random.randint(70, 98),
                "completed_missions": random.randint(2, 25),
                "transport": random.choice(["bike", "car", "van", "truck", "none"]),
                "working_radius_km": random.randint(10, 45),
                "geohash": f"gh_{city_name.lower()[:3]}",
                "role": "volunteer", "created_at": iso()
            }
            db.collection("volunteers").document(vid).set(vol_data)
            v_count += 1

            # 2. Mixed State Missions
            for _ in range(random.randint(4, 7)):
                nid = str(uuid.uuid4())
                status = random.choice(["completed", "completed", "completed", "pending", "in_progress"])
                cat = random.choice(["medical", "food", "shelter", "rescue", "water"])
                h_date = datetime.utcnow() - timedelta(days=random.randint(0, 30))
                
                need_data = {
                    "id": nid,
                    "title": f"{random.choice(T_PREFIXES)} {random.choice(T_SUFFIXES)}",
                    "category": cat,
                    "description": random.choice(S_DESCS),
                    "location": {"lat": v_lat + random.uniform(-0.03, 0.03), "lng": v_lng + random.uniform(-0.03, 0.03)},
                    "urgency": random.randint(1, 5),
                    "severity": random.randint(1, 5),
                    "people_affected": random.randint(5, 200), # Fixed naming
                    "weather_factor": random.randint(1, 5), # Fixed naming
                    "status": status,
                    "priority_score": random.randint(20, 99),
                    "assigned_volunteer_ids": [vid] if status != "pending" else [],
                    "created_at": iso(h_date),
                    "source": random.choice(["citizen_report", "telegram_bot", "ngo_dispatch", "iot_sensor"])
                }
                db.collection("needs").document(nid).set(need_data)
                m_count += 1

    print(f"✅ Strategic Deployment Successful. Volunteers: {v_count}, Missions: {m_count}")

if __name__ == "__main__":
    main()
