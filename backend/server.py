"""
Smart Resource Allocation - Humanitarian Command Center
FastAPI backend with Firebase Auth + Firestore, RBAC, need prioritization,
volunteer matching, resource inventory, citizen reporting, disaster mode, and AI insights.
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
import math
import asyncio
import json
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import requests
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth, firestore

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ---------- Config ----------
FIREBASE_WEB_API_KEY = os.environ.get("FIREBASE_WEB_API_KEY")
FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID")
FIREBASE_SERVICE_ACCOUNT_FILE = os.environ.get("FIREBASE_SERVICE_ACCOUNT_FILE")
FIREBASE_SERVICE_ACCOUNT_JSON = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
AI_API_KEY = os.environ.get('AI_API_KEY')

if not FIREBASE_WEB_API_KEY:
    raise RuntimeError("Missing FIREBASE_WEB_API_KEY for Firebase Authentication.")


def _build_firebase_credentials():
    if FIREBASE_SERVICE_ACCOUNT_FILE:
        return credentials.Certificate(FIREBASE_SERVICE_ACCOUNT_FILE)
    if FIREBASE_SERVICE_ACCOUNT_JSON:
        return credentials.Certificate(json.loads(FIREBASE_SERVICE_ACCOUNT_JSON))
    return credentials.ApplicationDefault()


if not firebase_admin._apps:
    firebase_admin.initialize_app(_build_firebase_credentials(), {"projectId": FIREBASE_PROJECT_ID} if FIREBASE_PROJECT_ID else None)


def _get_nested_value(doc: Dict[str, Any], key: str):
    value = doc
    for part in key.split('.'):
        if not isinstance(value, dict):
            return None
        value = value.get(part)
    return value


def _matches_filter(doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
    if not query:
        return True
    for key, expected in query.items():
        actual = _get_nested_value(doc, key)
        if isinstance(expected, dict):
            for op, op_val in expected.items():
                if op == "$in" and actual not in op_val:
                    return False
                if op == "$gte" and not (actual is not None and actual >= op_val):
                    return False
                if op == "$gt" and not (actual is not None and actual > op_val):
                    return False
                if op == "$lte" and not (actual is not None and actual <= op_val):
                    return False
                if op == "$lt" and not (actual is not None and actual < op_val):
                    return False
        else:
            if actual != expected:
                return False
    return True


def _apply_projection(doc: Dict[str, Any], projection: Optional[Dict[str, int]]) -> Dict[str, Any]:
    if not projection:
        return dict(doc)

    includes = [k for k, v in projection.items() if v and k != "_id"]
    excludes = [k for k, v in projection.items() if not v]

    if includes:
        return {k: doc.get(k) for k in includes if k in doc}

    out = dict(doc)
    for k in excludes:
        out.pop(k, None)
    return out


def _apply_update(doc: Dict[str, Any], update_doc: Dict[str, Any]) -> Dict[str, Any]:
    out = dict(doc)
    for k, v in update_doc.get("$set", {}).items():
        out[k] = v
    for k, v in update_doc.get("$inc", {}).items():
        out[k] = out.get(k, 0) + v
    return out


class FirestoreCursor:
    def __init__(self, collection: "FirestoreCollection", query: Dict[str, Any], projection: Optional[Dict[str, int]] = None):
        self.collection = collection
        self.query = query or {}
        self.projection = projection
        self._sort_key = None
        self._sort_dir = 1
        self._limit = None

    def sort(self, key: str, direction: int):
        self._sort_key = key
        self._sort_dir = direction
        return self

    def limit(self, n: int):
        self._limit = n
        return self

    async def to_list(self, length: int = 0):
        docs = await self.collection._all_documents()
        filtered = [_apply_projection(d, self.projection) for d in docs if _matches_filter(d, self.query)]

        if self._sort_key:
            reverse = self._sort_dir == -1
            filtered.sort(key=lambda d: (_get_nested_value(d, self._sort_key) is None, _get_nested_value(d, self._sort_key)), reverse=reverse)

        max_items = self._limit if self._limit is not None else length
        if max_items and max_items > 0:
            return filtered[:max_items]
        return filtered


class FirestoreAggregateCursor:
    def __init__(self, rows: List[Dict[str, Any]]):
        self.rows = rows

    async def to_list(self, length: int = 0):
        if length and length > 0:
            return self.rows[:length]
        return self.rows


class FirestoreCollection:
    def __init__(self, client: firestore.Client, name: str):
        self._collection = client.collection(name)

    async def _all_documents(self) -> List[Dict[str, Any]]:
        docs = await asyncio.to_thread(lambda: list(self._collection.stream()))
        return [d.to_dict() for d in docs if d.exists]

    def find(self, query: Optional[Dict[str, Any]] = None, projection: Optional[Dict[str, int]] = None):
        return FirestoreCursor(self, query or {}, projection)

    async def find_one(self, query: Dict[str, Any], projection: Optional[Dict[str, int]] = None):
        docs = await self.find(query, projection).limit(1).to_list(length=1)
        return docs[0] if docs else None

    async def insert_one(self, doc: Dict[str, Any]):
        data = dict(doc)
        doc_id = data.get("id") or str(uuid.uuid4())
        data["id"] = doc_id
        await asyncio.to_thread(lambda: self._collection.document(doc_id).set(data))

    async def update_one(self, query: Dict[str, Any], update_doc: Dict[str, Any], upsert: bool = False):
        current = await self.find_one(query)
        if current:
            merged = _apply_update(current, update_doc)
            await asyncio.to_thread(lambda: self._collection.document(merged["id"]).set(merged))
            return
        if upsert:
            base = {k: v for k, v in query.items() if not isinstance(v, dict)}
            merged = _apply_update(base, update_doc)
            await self.insert_one(merged)

    async def update_many(self, query: Dict[str, Any], update_doc: Dict[str, Any]):
        rows = await self.find(query).to_list(length=100000)
        for row in rows:
            merged = _apply_update(row, update_doc)
            await asyncio.to_thread(lambda r=merged: self._collection.document(r["id"]).set(r))

    async def count_documents(self, query: Dict[str, Any]):
        rows = await self.find(query).to_list(length=100000)
        return len(rows)

    async def aggregate(self, pipeline: List[Dict[str, Any]]):
        rows = await self.find({}).to_list(length=100000)
        out = rows
        for stage in pipeline:
            if "$group" in stage:
                g = stage["$group"]
                group_field = str(g.get("_id", "")).lstrip("$")
                grouped: Dict[Any, int] = {}
                for r in out:
                    key = _get_nested_value(r, group_field)
                    grouped[key] = grouped.get(key, 0) + 1
                out = [{"_id": k, "count": v} for k, v in grouped.items()]
            if "$sort" in stage:
                sort_field, sort_dir = next(iter(stage["$sort"].items()))
                reverse = sort_dir == -1
                out.sort(key=lambda d: d.get(sort_field), reverse=reverse)
        return FirestoreAggregateCursor(out)


class FirestoreDatabase:
    def __init__(self, client: firestore.Client):
        self.client = client

    def __getattr__(self, item: str):
        return FirestoreCollection(self.client, item)


firestore_client = firestore.client()
db = FirestoreDatabase(firestore_client)

app = FastAPI(title="Humanitarian Command Center API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("janrakshak")

# ---------- Roles ----------
Role = Literal["admin", "user", "volunteer"]

# ---------- Models ----------
def now_utc() -> datetime:
    return datetime.now(timezone.utc)

def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat()


class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    role: Role = "user"
    phone: Optional[str] = None
    language: str = "en"
    created_at: str = Field(default_factory=lambda: iso(now_utc()))


class RegisterBody(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Role = "user"
    phone: Optional[str] = None
    language: str = "en"


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class GeoPoint(BaseModel):
    lat: float
    lng: float
    address: Optional[str] = None


class NeedRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    category: Literal[
        "food", "medical", "shelter", "education", "sanitation",
        "blood_donation", "disaster_relief", "emergency_transport", "other"
    ]
    description: str
    location: GeoPoint
    urgency: int = Field(ge=1, le=5)  # 1 low - 5 critical
    people_affected: int = 1
    vulnerability: List[Literal["children", "elderly", "disabled", "pregnant", "none"]] = ["none"]
    severity: int = Field(default=3, ge=1, le=5)
    weather_factor: int = Field(default=1, ge=1, le=5)
    source: Literal["user", "admin", "sms", "survey"] = "user"
    evidence_urls: List[str] = []
    status: Literal["pending", "assigned", "in_progress", "completed", "cancelled"] = "pending"
    priority_score: float = 0
    created_by: Optional[str] = None
    assigned_volunteer_ids: List[str] = []
    mission_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: iso(now_utc()))
    updated_at: str = Field(default_factory=lambda: iso(now_utc()))


class NeedCreate(BaseModel):
    title: str
    category: str
    description: str
    location: GeoPoint
    urgency: int = 3
    people_affected: int = 1
    vulnerability: List[str] = ["none"]
    severity: int = 3
    weather_factor: int = 1
    source: str = "citizen"
    evidence_urls: List[str] = []


class Volunteer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    skills: List[str] = []
    languages: List[str] = ["en"]
    availability: Literal["available", "busy", "off_duty"] = "available"
    working_radius_km: float = 10
    transport: Literal["none", "bike", "car", "van", "truck"] = "none"
    certifications: List[str] = []
    base_location: GeoPoint
    trust_score: float = 80.0
    completed_missions: int = 0
    response_speed_min: float = 30
    created_at: str = Field(default_factory=lambda: iso(now_utc()))


class VolunteerCreate(BaseModel):
    name: str
    skills: List[str] = []
    languages: List[str] = ["en"]
    working_radius_km: float = 10
    transport: str = "none"
    certifications: List[str] = []
    base_location: GeoPoint


class Resource(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: Literal[
        "food", "medicine", "water", "blanket", "hygiene_kit",
        "vehicle", "fuel", "bed", "oxygen_cylinder", "donation", "other"
    ]
    quantity: int
    unit: str = "units"
    min_threshold: int = 10
    location: GeoPoint
    warehouse: str = "Main Depot"
    updated_at: str = Field(default_factory=lambda: iso(now_utc()))


class ResourceCreate(BaseModel):
    name: str
    category: str
    quantity: int
    unit: str = "units"
    min_threshold: int = 10
    location: GeoPoint
    warehouse: str = "Main Depot"


class Mission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    need_ids: List[str]
    volunteer_ids: List[str]
    resource_allocations: List[Dict[str, Any]] = []
    status: Literal["planned", "in_progress", "completed", "cancelled"] = "planned"
    route: List[GeoPoint] = []
    proof_urls: List[str] = []
    completion_notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: iso(now_utc()))
    completed_at: Optional[str] = None


class MissionCreate(BaseModel):
    need_ids: List[str]
    volunteer_ids: List[str]
    resource_allocations: List[Dict[str, Any]] = []


class CitizenReport(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    raw_text: str
    image_urls: List[str] = []
    reporter_name: Optional[str] = None
    reporter_phone: Optional[str] = None
    language: str = "en"
    extracted: Optional[Dict[str, Any]] = None
    converted_need_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: iso(now_utc()))


class CitizenReportCreate(BaseModel):
    raw_text: str
    image_urls: List[str] = []
    reporter_name: Optional[str] = None
    reporter_phone: Optional[str] = None
    language: str = "en"


class SystemState(BaseModel):
    disaster_mode: bool = False
    disaster_reason: Optional[str] = None
    updated_at: str = Field(default_factory=lambda: iso(now_utc()))


# ---------- Helpers ----------
def _firebase_error_detail(resp: requests.Response, fallback_status: int = 400) -> HTTPException:
    try:
        payload = resp.json()
        code = payload.get("error", {}).get("message", "FIREBASE_AUTH_ERROR")
    except Exception:
        code = "FIREBASE_AUTH_ERROR"

    message_map = {
        "EMAIL_EXISTS": "Email already registered",
        "INVALID_PASSWORD": "Invalid credentials",
        "EMAIL_NOT_FOUND": "Invalid credentials",
        "USER_DISABLED": "Account disabled",
    }
    detail = message_map.get(code, code.replace("_", " ").title())
    return HTTPException(status_code=fallback_status, detail=detail)


async def _firebase_rest_auth(path: str, payload: Dict[str, Any], status_code: int = 400) -> Dict[str, Any]:
    url = f"https://identitytoolkit.googleapis.com/v1/{path}?key={FIREBASE_WEB_API_KEY}"
    resp = await asyncio.to_thread(requests.post, url, json=payload, timeout=25)
    if not resp.ok:
        raise _firebase_error_detail(resp, fallback_status=status_code)
    return resp.json()


async def ensure_firebase_user(email: str, password: str, display_name: str, role: str) -> str:
    try:
        user_record = await asyncio.to_thread(firebase_auth.get_user_by_email, email)
        await asyncio.to_thread(
            firebase_auth.update_user,
            user_record.uid,
            password=password,
            display_name=display_name,
            disabled=False,
        )
        uid = user_record.uid
    except firebase_auth.UserNotFoundError:
        user_record = await asyncio.to_thread(
            firebase_auth.create_user,
            email=email,
            password=password,
            display_name=display_name,
        )
        uid = user_record.uid

    await asyncio.to_thread(firebase_auth.set_custom_user_claims, uid, {"role": role})
    return uid


async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1]
    try:
        payload = await asyncio.to_thread(firebase_auth.verify_id_token, token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    uid = payload.get("uid")
    role = payload.get("role") or payload.get("claims", {}).get("role") or "user"
    user = await db.users.find_one({"id": uid}, {"_id": 0})

    if not user:
        try:
            fb_user = await asyncio.to_thread(firebase_auth.get_user, uid)
            user = User(
                id=uid,
                name=fb_user.display_name or (fb_user.email.split("@")[0] if fb_user.email else "User"),
                email=fb_user.email,
                role=role,
            ).model_dump()
            await db.users.insert_one(user)
        except Exception:
            user = None

    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_roles(*roles: str):
    async def _dep(user: Dict[str, Any] = Depends(get_current_user)):
        if user["role"] not in roles and user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Insufficient role")
        return user
    return _dep


def haversine_km(a: GeoPoint, b: GeoPoint) -> float:
    R = 6371
    la1, la2 = math.radians(a.lat), math.radians(b.lat)
    dlat = math.radians(b.lat - a.lat)
    dlng = math.radians(b.lng - a.lng)
    h = math.sin(dlat/2)**2 + math.cos(la1)*math.cos(la2)*math.sin(dlng/2)**2
    return 2 * R * math.asin(math.sqrt(h))


def compute_priority(need: Dict[str, Any], disaster: bool = False) -> float:
    """Multi-factor weighted score 0-100."""
    urgency = need.get("urgency", 3)
    affected = min(need.get("people_affected", 1), 500)
    severity = need.get("severity", 3)
    weather = need.get("weather_factor", 1)
    vuln = need.get("vulnerability", ["none"])
    vuln_score = 0
    for v in vuln:
        if v in ("children", "elderly", "disabled", "pregnant"):
            vuln_score += 1
    vuln_score = min(vuln_score, 4)

    try:
        created = datetime.fromisoformat(need.get("created_at"))
    except Exception:
        created = now_utc()
    wait_hours = max((now_utc() - created).total_seconds() / 3600, 0)

    score = (
        (urgency / 5) * 30 +
        (affected / 500) * 20 +
        (severity / 5) * 15 +
        (vuln_score / 4) * 15 +
        min(wait_hours / 48, 1) * 15 +
        (weather / 5) * 5
    )
    if disaster:
        # Boost disaster-relief category and high urgency during disaster mode
        if need.get("category") in ("disaster_relief", "medical", "emergency_transport", "shelter"):
            score += 15
        if urgency >= 4:
            score += 10
    return round(min(score, 100), 2)


async def get_system_state() -> Dict[str, Any]:
    s = await db.system.find_one({"_id": "state"})
    if not s:
        s = {"_id": "state", "disaster_mode": False, "disaster_reason": None}
        await db.system.insert_one(s)
    return {"disaster_mode": s.get("disaster_mode", False), "disaster_reason": s.get("disaster_reason")}


async def reprioritize_all():
    state = await get_system_state()
    dmode = state["disaster_mode"]
    needs = await db.needs.find({"status": {"$in": ["pending", "assigned", "in_progress"]}}, {"_id": 0}).to_list(length=5000)
    for n in needs:
        score = compute_priority(n, dmode)
        await db.needs.update_one({"id": n["id"]}, {"$set": {"priority_score": score, "updated_at": iso(now_utc())}})


async def log_audit(actor: Dict[str, Any], action: str, target: str, meta: Dict[str, Any] | None = None):
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "actor_id": actor.get("id"),
        "actor_name": actor.get("name"),
        "actor_role": actor.get("role"),
        "action": action,
        "target": target,
        "meta": meta or {},
        "timestamp": iso(now_utc()),
    })

# ---------- AI (Claude Sonnet 4.5) ----------
async def ai_insight(prompt: str, system: str = "You are a humanitarian operations advisor. Be concise, field-ready, 3-5 bullet points max.") -> str:
    if not AI_API_KEY:
        return "AI offline: configure AI_API_KEY."
    # AI integration temporarily disabled for platform cleanup
    return "AI insights are active but the connector is being updated. Contact support."


# ---------- AUTH ROUTES ----------
@api_router.post("/auth/register")
async def register(body: RegisterBody):
    if await db.users.find_one({"email": body.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    sign_up = await _firebase_rest_auth(
        "accounts:signUp",
        {"email": body.email, "password": body.password, "returnSecureToken": True},
        status_code=400,
    )
    uid = sign_up["localId"]
    await asyncio.to_thread(firebase_auth.update_user, uid, display_name=body.name)
    await asyncio.to_thread(firebase_auth.set_custom_user_claims, uid, {"role": body.role})

    user = User(id=uid, name=body.name, email=body.email, role=body.role, phone=body.phone, language=body.language)
    await db.users.insert_one(user.model_dump())

    # If volunteer role, auto-create volunteer stub
    if body.role == "volunteer":
        existing_vol = await db.volunteers.find_one({"user_id": user.id}, {"_id": 0})
        if not existing_vol:
            vol = Volunteer(user_id=user.id, name=body.name, base_location=GeoPoint(lat=28.6139, lng=77.2090))
            await db.volunteers.insert_one(vol.model_dump())

    token = sign_up.get("idToken")
    return {"token": token, "user": user.model_dump()}


@api_router.post("/auth/login")
async def login(body: LoginBody):
    sign_in = await _firebase_rest_auth(
        "accounts:signInWithPassword",
        {"email": body.email, "password": body.password, "returnSecureToken": True},
        status_code=401,
    )

    uid = sign_in["localId"]
    u = await db.users.find_one({"id": uid}, {"_id": 0})
    if not u:
        fb_user = await asyncio.to_thread(firebase_auth.get_user, uid)
        role = "user"
        try:
            role = (await asyncio.to_thread(firebase_auth.get_user, uid)).custom_claims.get("role", "user") if fb_user.custom_claims else "user"
        except Exception:
            role = "user"
        u = User(
            id=uid,
            name=fb_user.display_name or (fb_user.email.split("@")[0] if fb_user.email else "User"),
            email=fb_user.email,
            role=role,
        ).model_dump()
        await db.users.insert_one(u)

    return {"token": sign_in.get("idToken"), "user": u}


@api_router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user


# ---------- NEED REQUEST ROUTES ----------
@api_router.post("/needs", response_model=NeedRequest)
async def create_need(body: NeedCreate, user=Depends(get_current_user)):
    n = NeedRequest(**body.model_dump(), created_by=user["id"])
    state = await get_system_state()
    n.priority_score = compute_priority(n.model_dump(), state["disaster_mode"])
    await db.needs.insert_one(n.model_dump())
    await log_audit(user, "need_created", n.id, {"title": n.title, "urgency": n.urgency})
    return n


@api_router.get("/needs")
async def list_needs(status: Optional[str] = None, category: Optional[str] = None, limit: int = 200):
    q: Dict[str, Any] = {}
    if status:
        q["status"] = status
    if category:
        q["category"] = category
    cursor = db.needs.find(q, {"_id": 0}).sort("priority_score", -1).limit(limit)
    return await cursor.to_list(length=limit)


@api_router.get("/needs/{need_id}")
async def get_need(need_id: str):
    n = await db.needs.find_one({"id": need_id}, {"_id": 0})
    if not n:
        raise HTTPException(404, "Need not found")
    return n


@api_router.patch("/needs/{need_id}")
async def update_need(need_id: str, patch: Dict[str, Any], user=Depends(require_roles("admin", "field_worker", "analyst"))):
    patch["updated_at"] = iso(now_utc())
    await db.needs.update_one({"id": need_id}, {"$set": patch})
    await log_audit(user, "need_updated", need_id, patch)
    return await db.needs.find_one({"id": need_id}, {"_id": 0})


@api_router.post("/needs/reprioritize")
async def reprioritize(user=Depends(require_roles("admin", "field_worker", "analyst"))):
    await reprioritize_all()
    await log_audit(user, "reprioritize_all", "needs")
    return {"ok": True}


# ---------- VOLUNTEER ROUTES ----------
@api_router.post("/volunteers", response_model=Volunteer)
async def create_volunteer(body: VolunteerCreate, user=Depends(get_current_user)):
    existing = await db.volunteers.find_one({"user_id": user["id"]}, {"_id": 0})
    if existing:
        raise HTTPException(400, "Volunteer profile already exists")
    v = Volunteer(user_id=user["id"], **body.model_dump())
    await db.volunteers.insert_one(v.model_dump())
    return v


@api_router.get("/volunteers")
async def list_volunteers(availability: Optional[str] = None):
    q: Dict[str, Any] = {}
    if availability:
        q["availability"] = availability
    vols = await db.volunteers.find(q, {"_id": 0}).sort("trust_score", -1).to_list(length=500)
    return vols


@api_router.get("/volunteers/leaderboard")
async def leaderboard():
    vols = await db.volunteers.find({}, {"_id": 0}).sort([("trust_score", -1), ("completed_missions", -1)]).limit(20).to_list(length=20)
    return vols


@api_router.patch("/volunteers/{vol_id}")
async def update_volunteer(vol_id: str, patch: Dict[str, Any], user=Depends(get_current_user)):
    await db.volunteers.update_one({"id": vol_id}, {"$set": patch})
    return await db.volunteers.find_one({"id": vol_id}, {"_id": 0})


# ---------- RESOURCES ----------
@api_router.post("/resources", response_model=Resource)
async def create_resource(body: ResourceCreate, user=Depends(require_roles("admin", "field_worker", "donor"))):
    r = Resource(**body.model_dump())
    await db.resources.insert_one(r.model_dump())
    await log_audit(user, "resource_created", r.id, {"name": r.name, "qty": r.quantity})
    return r


@api_router.get("/resources")
async def list_resources():
    return await db.resources.find({}, {"_id": 0}).to_list(length=500)


@api_router.get("/resources/shortages")
async def shortages():
    all_res = await db.resources.find({}, {"_id": 0}).to_list(length=500)
    return [r for r in all_res if r["quantity"] <= r["min_threshold"]]


@api_router.patch("/resources/{rid}")
async def update_resource(rid: str, patch: Dict[str, Any], user=Depends(require_roles("admin", "field_worker", "donor"))):
    patch["updated_at"] = iso(now_utc())
    await db.resources.update_one({"id": rid}, {"$set": patch})
    return await db.resources.find_one({"id": rid}, {"_id": 0})


# ---------- MATCHING ENGINE ----------
@api_router.post("/matching/suggest/{need_id}")
async def suggest_matches(need_id: str, user=Depends(get_current_user)):
    need = await db.needs.find_one({"id": need_id}, {"_id": 0})
    if not need:
        raise HTTPException(404, "Need not found")
    vols = await db.volunteers.find({"availability": "available"}, {"_id": 0}).to_list(length=500)
    scored = []
    n_loc = GeoPoint(**need["location"])
    for v in vols:
        v_loc = GeoPoint(**v["base_location"])
        dist = haversine_km(n_loc, v_loc)
        if dist > v.get("working_radius_km", 10) * 1.5:
            continue
        proximity = max(0, 1 - dist / max(v.get("working_radius_km", 10) * 2, 1))
        trust = v.get("trust_score", 50) / 100
        transport_bonus = {"none": 0, "bike": 0.1, "car": 0.2, "van": 0.3, "truck": 0.4}.get(v.get("transport", "none"), 0)
        match_score = round((proximity * 0.5 + trust * 0.4 + transport_bonus * 0.1) * 100, 2)
        scored.append({**v, "distance_km": round(dist, 2), "match_score": match_score})
    scored.sort(key=lambda x: x["match_score"], reverse=True)
    return scored[:10]


@api_router.post("/matching/auto-assign/{need_id}")
async def auto_assign(need_id: str, user=Depends(require_roles("admin", "field_worker"))):
    matches = await suggest_matches(need_id, user)
    if not matches:
        raise HTTPException(400, "No suitable volunteers available")
    top = matches[0]
    await db.needs.update_one(
        {"id": need_id},
        {"$set": {"status": "assigned", "assigned_volunteer_ids": [top["id"]], "updated_at": iso(now_utc())}}
    )
    await db.volunteers.update_one({"id": top["id"]}, {"$set": {"availability": "busy"}})
    await log_audit(user, "auto_assigned", need_id, {"volunteer_id": top["id"], "match_score": top["match_score"]})
    return {"need_id": need_id, "assigned_to": top}


@api_router.post("/matching/explain/{need_id}")
async def match_explain(need_id: str, user=Depends(get_current_user)):
    need = await db.needs.find_one({"id": need_id}, {"_id": 0})
    if not need:
        raise HTTPException(404, "Need not found")
    matches = await suggest_matches(need_id, user)
    top3 = matches[:3]
    prompt = (
        f"Request: {need['title']} — category {need['category']}, urgency {need['urgency']}/5, "
        f"{need['people_affected']} affected.\n\nTop candidates:\n" +
        "\n".join(f"- {v['name']} | trust {v['trust_score']} | {v['distance_km']}km | transport {v.get('transport','none')} | match {v['match_score']}" for v in top3) +
        "\n\nRecommend the best volunteer and explain why in 3 bullet points."
    )
    reply = await ai_insight(prompt)
    return {"recommendation": reply, "candidates": top3}


# ---------- MISSIONS ----------
@api_router.post("/missions", response_model=Mission)
async def create_mission(body: MissionCreate, user=Depends(require_roles("admin", "field_worker"))):
    m = Mission(**body.model_dump())
    await db.missions.insert_one(m.model_dump())
    await db.needs.update_many(
        {"id": {"$in": body.need_ids}},
        {"$set": {"status": "assigned", "mission_id": m.id, "assigned_volunteer_ids": body.volunteer_ids, "updated_at": iso(now_utc())}}
    )
    for vid in body.volunteer_ids:
        await db.volunteers.update_one({"id": vid}, {"$set": {"availability": "busy"}})
    await log_audit(user, "mission_created", m.id)
    return m


@api_router.get("/missions")
async def list_missions():
    return await db.missions.find({}, {"_id": 0}).sort("created_at", -1).to_list(length=200)


@api_router.post("/missions/{mid}/complete")
async def complete_mission(mid: str, body: Dict[str, Any], user=Depends(require_roles("admin", "volunteer"))):
    proof_urls = body.get("proof_urls", [])
    notes = body.get("completion_notes", "")
    m = await db.missions.find_one({"id": mid}, {"_id": 0})
    if not m:
        raise HTTPException(404, "Mission not found")
    await db.missions.update_one(
        {"id": mid},
        {"$set": {"status": "completed", "proof_urls": proof_urls, "completion_notes": notes, "completed_at": iso(now_utc())}}
    )
    await db.needs.update_many({"id": {"$in": m["need_ids"]}}, {"$set": {"status": "completed", "updated_at": iso(now_utc())}})
    for vid in m["volunteer_ids"]:
        await db.volunteers.update_one(
            {"id": vid},
            {"$set": {"availability": "available"}, "$inc": {"completed_missions": 1}}
        )
        v = await db.volunteers.find_one({"id": vid}, {"_id": 0})
        if v:
            new_trust = min(100, v["trust_score"] + 1.5)
            await db.volunteers.update_one({"id": vid}, {"$set": {"trust_score": new_trust}})
    await log_audit(user, "mission_completed", mid, {"proof_count": len(proof_urls)})
    return await db.missions.find_one({"id": mid}, {"_id": 0})


# ---------- CITIZEN REPORTS ----------
@api_router.post("/citizen/reports")
async def submit_citizen_report(body: CitizenReportCreate):
    report = CitizenReport(**body.model_dump())
    # AI NLP extraction (runs async, non-blocking)
    extraction_prompt = (
        f"Extract structured fields from this citizen report in JSON only (no prose). "
        f"Fields: category (food|medical|shelter|education|sanitation|blood_donation|disaster_relief|emergency_transport|other), "
        f"urgency (1-5), people_affected (integer), vulnerability (list from children,elderly,disabled,pregnant,none), "
        f"short_title (string). Language may be Hindi or English.\n\nReport: {body.raw_text}"
    )
    extracted_text = await ai_insight(extraction_prompt, system="You are a field intake analyst. Return ONLY valid JSON.")
    import json as _json
    import re as _re
    try:
        match = _re.search(r"\{[\s\S]*\}", extracted_text)
        report.extracted = _json.loads(match.group(0)) if match else {"raw": extracted_text}
    except Exception:
        report.extracted = {"raw": extracted_text}
    await db.citizen_reports.insert_one(report.model_dump())
    return report


@api_router.get("/citizen/reports")
async def list_citizen_reports(user=Depends(require_roles("admin", "field_worker", "analyst"))):
    return await db.citizen_reports.find({}, {"_id": 0}).sort("created_at", -1).to_list(length=200)


@api_router.post("/citizen/reports/{rid}/convert")
async def convert_report(rid: str, body: Dict[str, Any], user=Depends(require_roles("admin", "field_worker"))):
    r = await db.citizen_reports.find_one({"id": rid}, {"_id": 0})
    if not r:
        raise HTTPException(404, "Report not found")
    loc = GeoPoint(**body.get("location", {"lat": 28.6139, "lng": 77.2090}))
    extracted = r.get("extracted", {}) or {}
    need = NeedRequest(
        title=extracted.get("short_title") or r["raw_text"][:80],
        category=body.get("category") or extracted.get("category", "other"),
        description=r["raw_text"],
        location=loc,
        urgency=int(body.get("urgency") or extracted.get("urgency", 3)),
        people_affected=int(body.get("people_affected") or extracted.get("people_affected", 1)),
        vulnerability=body.get("vulnerability") or extracted.get("vulnerability", ["none"]),
        source="citizen",
        evidence_urls=r.get("image_urls", []),
        created_by=user["id"],
    )
    state = await get_system_state()
    need.priority_score = compute_priority(need.model_dump(), state["disaster_mode"])
    await db.needs.insert_one(need.model_dump())
    await db.citizen_reports.update_one({"id": rid}, {"$set": {"converted_need_id": need.id}})
    await log_audit(user, "report_converted", rid, {"need_id": need.id})
    return need


# ---------- DASHBOARD & ANALYTICS ----------
@api_router.get("/dashboard/stats")
async def dashboard_stats():
    active = await db.needs.count_documents({"status": {"$in": ["pending", "assigned", "in_progress"]}})
    resolved = await db.needs.count_documents({"status": "completed"})
    critical = await db.needs.count_documents({"status": {"$in": ["pending", "assigned"]}, "urgency": {"$gte": 4}})
    volunteers = await db.volunteers.count_documents({})
    available_vols = await db.volunteers.count_documents({"availability": "available"})
    missions_active = await db.missions.count_documents({"status": {"$in": ["planned", "in_progress"]}})
    missions_done = await db.missions.count_documents({"status": "completed"})
    resources = await db.resources.find({}, {"_id": 0}).to_list(length=500)
    shortage_count = sum(1 for r in resources if r["quantity"] <= r["min_threshold"])
    state = await get_system_state()

    # Avg response time (simple: completed mission time vs first need created)
    completed_missions = await db.missions.find({"status": "completed"}, {"_id": 0}).to_list(length=100)
    response_times = []
    for m in completed_missions:
        if m.get("completed_at") and m.get("created_at"):
            try:
                delta = datetime.fromisoformat(m["completed_at"]) - datetime.fromisoformat(m["created_at"])
                response_times.append(delta.total_seconds() / 3600)
            except Exception:
                pass
    avg_response_hrs = round(sum(response_times) / len(response_times), 2) if response_times else 0

    return {
        "active_needs": active,
        "resolved_needs": resolved,
        "critical_needs": critical,
        "volunteers_total": volunteers,
        "volunteers_available": available_vols,
        "missions_active": missions_active,
        "missions_completed": missions_done,
        "resource_shortages": shortage_count,
        "avg_response_hours": avg_response_hrs,
        "disaster_mode": state["disaster_mode"],
        "disaster_reason": state["disaster_reason"],
    }


@api_router.get("/dashboard/heatmap")
async def heatmap():
    needs = await db.needs.find(
        {"status": {"$in": ["pending", "assigned", "in_progress"]}},
        {"_id": 0, "location": 1, "priority_score": 1, "category": 1, "urgency": 1, "id": 1, "title": 1}
    ).to_list(length=500)
    return needs


@api_router.get("/analytics/overview")
async def analytics_overview():
    pipeline_cat = [{"$group": {"_id": "$category", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}]
    cats = await db.needs.aggregate(pipeline_cat).to_list(length=50)
    cats_clean = [{"category": c["_id"], "count": c["count"]} for c in cats]

    pipeline_status = [{"$group": {"_id": "$status", "count": {"$sum": 1}}}]
    stats = await db.needs.aggregate(pipeline_status).to_list(length=20)
    status_clean = [{"status": s["_id"], "count": s["count"]} for s in stats]

    # Monthly trend (last 6 months)
    trend = []
    for i in range(5, -1, -1):
        start = now_utc().replace(day=1, hour=0, minute=0, second=0, microsecond=0) - timedelta(days=30*i)
        end = start + timedelta(days=30)
        cnt = await db.needs.count_documents({
            "created_at": {"$gte": iso(start), "$lt": iso(end)}
        })
        trend.append({"month": start.strftime("%b"), "count": cnt})

    # People helped
    completed = await db.needs.find({"status": "completed"}, {"_id": 0, "people_affected": 1}).to_list(length=1000)
    people_helped = sum(n.get("people_affected", 0) for n in completed)

    # Top volunteers
    top_vols = await db.volunteers.find({}, {"_id": 0}).sort("completed_missions", -1).limit(5).to_list(length=5)

    # NGO efficiency score (heuristic)
    total_needs = await db.needs.count_documents({})
    resolved = await db.needs.count_documents({"status": "completed"})
    efficiency = round((resolved / total_needs) * 100, 1) if total_needs > 0 else 0

    return {
        "by_category": cats_clean,
        "by_status": status_clean,
        "monthly_trend": trend,
        "people_helped": people_helped,
        "top_volunteers": top_vols,
        "efficiency_score": efficiency,
    }


@api_router.get("/analytics/audit-log")
async def audit_log(user=Depends(require_roles("admin", "analyst"))):
    logs = await db.audit_logs.find({}, {"_id": 0}).sort("timestamp", -1).limit(100).to_list(length=100)
    return logs


# ---------- DISASTER MODE ----------
@api_router.post("/disaster/toggle")
async def toggle_disaster(body: Dict[str, Any], user=Depends(require_roles("admin", "field_worker"))):
    enabled = bool(body.get("enabled", False))
    reason = body.get("reason")
    await db.system.update_one(
        {"_id": "state"},
        {"$set": {"disaster_mode": enabled, "disaster_reason": reason, "updated_at": iso(now_utc())}},
        upsert=True,
    )
    await reprioritize_all()
    await log_audit(user, "disaster_mode_toggle", "system", {"enabled": enabled, "reason": reason})
    return {"disaster_mode": enabled, "disaster_reason": reason}


@api_router.get("/disaster/state")
async def disaster_state():
    return await get_system_state()


# ---------- AI INSIGHTS ----------
@api_router.post("/ai/insight")
async def ai_insight_route(body: Dict[str, Any], user=Depends(get_current_user)):
    q = body.get("query", "Summarize current operational status.")
    stats = await dashboard_stats()
    prompt = f"Context (ops dashboard): {stats}\n\nUser query: {q}\n\nAdvise in 4 concise bullets."
    text = await ai_insight(prompt)
    return {"response": text}


@api_router.post("/ai/forecast")
async def ai_forecast(user=Depends(require_roles("admin"))):
    analytics = await analytics_overview()
    prompt = (
        f"Historical ops data: {analytics}.\n\n"
        "Predict the top 3 demand categories for next 30 days and recommend pre-positioned resources. "
        "Include one disaster preparedness tip. Format as bullets."
    )
    text = await ai_insight(prompt)
    return {"forecast": text}


# ---------- SEED ----------
@api_router.post("/seed/demo")
async def seed_demo():
    # idempotent seed
    demo_credentials = [
        {
            "role": "admin",
            "name": "Command Admin",
            "email": "admin@janrakshakops.com",
            "password": "Admin@12345",
            "language": "en",
        },
        {
            "role": "user",
            "name": "Relief User",
            "email": "user@janrakshakops.com",
            "password": "User@12345",
            "language": "en",
        },
        {
            "role": "volunteer",
            "name": "Field Volunteer",
            "email": "volunteer@janrakshakops.com",
            "password": "Volunteer@12345",
            "language": "en",
        },
    ]

    user_by_email: Dict[str, Dict[str, Any]] = {}
    for cred in demo_credentials:
        uid = await ensure_firebase_user(
            email=cred["email"],
            password=cred["password"],
            display_name=cred["name"],
            role=cred["role"],
        )
        existing = await db.users.find_one({"id": uid}, {"_id": 0})
        if existing:
            await db.users.update_one(
                {"id": uid},
                {"$set": {
                    "name": cred["name"],
                    "email": cred["email"],
                    "role": cred["role"],
                    "language": cred["language"],
                }}
            )
            existing["name"] = cred["name"]
            existing["email"] = cred["email"]
            existing["role"] = cred["role"]
            user_by_email[cred["email"]] = existing
        else:
            user = User(id=uid, name=cred["name"], email=cred["email"], role=cred["role"], language=cred["language"])
            doc = user.model_dump()
            await db.users.insert_one(doc)
            user_by_email[cred["email"]] = doc

    volunteer_user = user_by_email.get("volunteer@janrakshakops.com")
    if volunteer_user and not await db.volunteers.find_one({"user_id": volunteer_user["id"]}):
        volunteer_profile = Volunteer(
            user_id=volunteer_user["id"],
            name=volunteer_user["name"],
            skills=["first_aid", "logistics", "hindi"],
            transport="bike",
            trust_score=90,
            base_location=GeoPoint(lat=28.6139, lng=77.2090),
            completed_missions=5,
            languages=["en", "hi"],
        )
        await db.volunteers.insert_one(volunteer_profile.model_dump())

    if await db.volunteers.count_documents({}) == 0:
        demo_vols = [
            {"name": "Ananya Rao", "skills": ["first_aid", "hindi", "driving"], "transport": "car", "trust": 94, "lat": 28.6139, "lng": 77.2090},
            {"name": "Rajesh Kumar", "skills": ["logistics", "hindi", "english"], "transport": "van", "trust": 88, "lat": 28.5355, "lng": 77.3910},
            {"name": "Priya Sharma", "skills": ["medical", "english"], "transport": "bike", "trust": 91, "lat": 28.7041, "lng": 77.1025},
            {"name": "Mohammed Khan", "skills": ["translator", "cooking"], "transport": "none", "trust": 76, "lat": 28.4595, "lng": 77.0266},
            {"name": "Lakshmi Iyer", "skills": ["counseling", "tamil", "english"], "transport": "car", "trust": 85, "lat": 28.6304, "lng": 77.2177},
        ]
        for d in demo_vols:
            # create user
            demo_email = f"{d['name'].lower().replace(' ','.')}@volunteer.org"
            uid = await ensure_firebase_user(
                email=demo_email,
                password="Volunteer@1",
                display_name=d["name"],
                role="volunteer",
            )
            await db.users.insert_one({
                "id": uid, "name": d["name"], "email": demo_email,
                "role": "volunteer", "phone": None, "language": "en", "created_at": iso(now_utc()),
            })
            v = Volunteer(
                user_id=uid, name=d["name"], skills=d["skills"], transport=d["transport"],
                trust_score=d["trust"], base_location=GeoPoint(lat=d["lat"], lng=d["lng"]),
                completed_missions=int(d["trust"]/10), languages=["en", "hi"]
            )
            await db.volunteers.insert_one(v.model_dump())

    if await db.needs.count_documents({}) == 0:
        demo_needs = [
            {"title": "Flood relief — 40 families stranded", "category": "disaster_relief", "description": "Families stuck on rooftops in East Delhi after heavy rainfall. Need boats, food, medical.", "lat": 28.6508, "lng": 77.3152, "urgency": 5, "ppl": 160, "vuln": ["children", "elderly"], "severity": 5},
            {"title": "Medicine shortage at shelter", "category": "medical", "description": "Insulin and ORS running low at community shelter.", "lat": 28.5355, "lng": 77.3910, "urgency": 4, "ppl": 45, "vuln": ["elderly"], "severity": 4},
            {"title": "Food packets for street children", "category": "food", "description": "Night shelter requesting daily meal kits for 30 kids.", "lat": 28.6139, "lng": 77.2090, "urgency": 3, "ppl": 30, "vuln": ["children"], "severity": 3},
            {"title": "Blood — O-negative urgent", "category": "blood_donation", "description": "Accident victim at AIIMS needs O- donors within 4 hours.", "lat": 28.5672, "lng": 77.2100, "urgency": 5, "ppl": 1, "vuln": ["none"], "severity": 5},
            {"title": "Classroom tutor volunteers", "category": "education", "description": "Slum school needs math tutors for evening classes.", "lat": 28.7041, "lng": 77.1025, "urgency": 2, "ppl": 60, "vuln": ["children"], "severity": 2},
            {"title": "Sanitation drive request", "category": "sanitation", "description": "Residents request cleanup after market waste pileup.", "lat": 28.4595, "lng": 77.0266, "urgency": 2, "ppl": 200, "vuln": ["none"], "severity": 2},
            {"title": "Emergency transport — pregnant woman", "category": "emergency_transport", "description": "Pregnant woman in labor needs transport to hospital.", "lat": 28.6304, "lng": 77.2177, "urgency": 5, "ppl": 1, "vuln": ["pregnant"], "severity": 5},
            {"title": "Shelter for displaced", "category": "shelter", "description": "12 families evicted, need temporary shelter tonight.", "lat": 28.6500, "lng": 77.2500, "urgency": 4, "ppl": 48, "vuln": ["children", "elderly"], "severity": 4},
        ]
        state = await get_system_state()
        for d in demo_needs:
            n = NeedRequest(
                title=d["title"], category=d["category"], description=d["description"],
                location=GeoPoint(lat=d["lat"], lng=d["lng"]),
                urgency=d["urgency"], people_affected=d["ppl"],
                vulnerability=d["vuln"], severity=d["severity"], source="admin",
            )
            n.priority_score = compute_priority(n.model_dump(), state["disaster_mode"])
            await db.needs.insert_one(n.model_dump())

    if await db.resources.count_documents({}) == 0:
        demo_res = [
            {"name": "Food Packets (ready-to-eat)", "category": "food", "quantity": 450, "min_threshold": 100, "lat": 28.6139, "lng": 77.2090, "warehouse": "Delhi Central Depot"},
            {"name": "Water Bottles (1L)", "category": "water", "quantity": 820, "min_threshold": 200, "lat": 28.6139, "lng": 77.2090, "warehouse": "Delhi Central Depot"},
            {"name": "Blankets", "category": "blanket", "quantity": 75, "min_threshold": 100, "lat": 28.5355, "lng": 77.3910, "warehouse": "East Delhi Hub"},
            {"name": "Oxygen Cylinders", "category": "oxygen_cylinder", "quantity": 8, "min_threshold": 15, "lat": 28.6139, "lng": 77.2090, "warehouse": "Delhi Central Depot"},
            {"name": "Hygiene Kits", "category": "hygiene_kit", "quantity": 140, "min_threshold": 50, "lat": 28.7041, "lng": 77.1025, "warehouse": "North Sub-Depot"},
            {"name": "Medicine Kit (basic)", "category": "medicine", "quantity": 60, "min_threshold": 40, "lat": 28.6139, "lng": 77.2090, "warehouse": "Delhi Central Depot"},
            {"name": "Relief Vans", "category": "vehicle", "quantity": 4, "min_threshold": 3, "lat": 28.6139, "lng": 77.2090, "warehouse": "Delhi Central Depot"},
        ]
        for d in demo_res:
            r = Resource(
                name=d["name"], category=d["category"], quantity=d["quantity"],
                min_threshold=d["min_threshold"], warehouse=d["warehouse"],
                location=GeoPoint(lat=d["lat"], lng=d["lng"]),
            )
            await db.resources.insert_one(r.model_dump())

    return {
        "ok": True,
        "message": "Demo data seeded",
        "credentials": [{
            "role": c["role"],
            "email": c["email"],
            "password": c["password"],
            "name": c["name"],
        } for c in demo_credentials],
        "admin_email": "admin@janrakshakops.com",
        "admin_password": "Admin@12345",
    }


@api_router.get("/")
async def root():
    return {"service": "Janrakshak GSC-26 Operations API", "status": "online"}


# Include router & CORS
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    # Auto-seed on first boot
    try:
        await seed_demo()
        logger.info("Demo data ready.")
    except Exception as e:
        logger.exception(f"Seed failed: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    return
