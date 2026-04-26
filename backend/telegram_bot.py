import os
import asyncio
import logging
import json
import base64
import uuid
import re
import httpx
from typing import Dict, Any, List
from io import BytesIO
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, CallbackQueryHandler, filters, ContextTypes
from dotenv import load_dotenv

logger = logging.getLogger("janrakshak.telegram")

# 🏛️ Fast-Pass Reference (Fixed Coords)
CITY_CACHE = {
    "mumbai": {"lat": 19.0760, "lng": 72.8777},
    "delhi": {"lat": 28.6139, "lng": 77.2090},
    "chennai": {"lat": 13.0827, "lng": 80.2707},
    "chandigarh": {"lat": 30.7333, "lng": 76.7794}
}

class JanrakshakBot:
    def __init__(self, token: str, db, ai_vision_extract, ai_insight, compute_priority, get_system_state, iso, now_utc):
        self.token = token
        self.db = db
        self.ai_vision_extract = ai_vision_extract
        self.ai_insight = ai_insight
        self.compute_priority = compute_priority
        self.get_system_state = get_system_state
        self.iso = iso
        self.now_utc = now_utc
        self.user_states = {} 
        
        self.cloudinary_preset = os.environ.get("VITE_CLOUDINARY_UPLOAD_PRESET", "janrakshak_unsigned")
        self.cloudinary_cloud = os.environ.get("VITE_CLOUDINARY_CLOUD_NAME", "dxtvq5s2x")

    async def start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        await update.message.reply_text("📡 *Janrakshak Command Interface*\nAuthorized. Tap below to start report.", reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🚨 Dispatch", callback_data='menu_start')]]), parse_mode='Markdown')

    async def handle_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        query = update.callback_query; await query.answer()
        kb = [[InlineKeyboardButton("🤖 AI Mode", callback_data='mode_ai')], [InlineKeyboardButton("📝 Manual Mode", callback_data='mode_manual')]]
        await query.edit_message_text("⚙️ *Select Protocol*\nAI Mode extracts from photos. Manual Mode is a quick form.", reply_markup=InlineKeyboardMarkup(kb), parse_mode='Markdown')
        
    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        chat_id = update.effective_chat.id; text = update.message.text
        if text.startswith("/"): return
        state = self.user_states.get(chat_id, {"mode": "ai", "stage": "input"})
        
        if state.get("stage") == "loc_pending":
             return await self._geodecode_and_finalize(update, text)

        # Handle Manual Stages
        if state.get("mode") == "manual":
            if state.get("stage") == "get_title":
                state["extracted"] = {"short_title": text}; state["stage"] = "get_urgency"
                return await update.message.reply_text("Urgency? (1-5)")
            elif state.get("stage") == "get_urgency":
                state["extracted"]["urgency"] = int(text) if text.isdigit() else 3; state["stage"] = "get_severity"
                return await update.message.reply_text("Severity? (1-5)")
            elif state.get("stage") == "get_severity":
                state["extracted"]["severity"] = int(text) if text.isdigit() else 3; state["stage"] = "loc_pending"
                state["timestamp"] = self.now_utc(); return await update.message.reply_text("📍 Send **City Name** or **Address**.")
        
        # Default text report setup
        self.user_states[chat_id] = {"mode": "ai", "raw_text": text, "timestamp": self.now_utc(), "stage": "loc_pending"}
        await update.message.reply_text("📝 *Report Accepted.*\n📍 Send **City Name** or **Address**.")

    async def _geodecode_and_finalize(self, update: Update, query_text: str):
        chat_id = update.effective_chat.id
        clean = query_text.lower().strip()
        
        # 1. Cache Check
        if clean in CITY_CACHE:
            await update.message.reply_text(f"⚡ *Quick-resolve: {clean.title()}*")
            return await self._finalize_report(update, CITY_CACHE[clean]["lat"], CITY_CACHE[clean]["lng"])
        
        # 2. OpenStreetMap (Nominatim) Global Database
        await update.message.reply_text("🌐 *Consulting Global Database...*")
        try:
            async with httpx.AsyncClient() as client:
                headers = {"User-Agent": "JanrakshakBot/1.0"}
                url = f"https://nominatim.openstreetmap.org/search?q={query_text}&format=json&limit=1"
                r = await client.get(url, headers=headers, timeout=10.0)
                if r.status_code == 200 and len(r.json()) > 0:
                    res = r.json()[0]
                    await update.message.reply_text(f"📍 *Found via OSM: {res['display_name'][:50]}...*")
                    return await self._finalize_report(update, float(res["lat"]), float(res["lon"]))
        except Exception as e:
            logger.error(f"OSM Failed: {e}")

        # 3. AI Fallback (Absolute last resort)
        await update.message.reply_text("🤖 *Deploying AI Intelligence...*")
        ai_res = await self.ai_insight(f"JSON only {{'lat':f, 'lng':f}} for: {query_text}", system="JSON only.")
        try:
            m = re.search(r"\{[\s\S]*\}", ai_res); c = json.loads(m.group(0))
            return await self._finalize_report(update, c["lat"], c["lng"])
        except:
            await update.message.reply_text("⚠️ Mission Failure. Send a **Location Pin**.")

    async def handle_photo(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        chat_id = update.effective_chat.id
        await update.message.reply_text("🔍 *Analyzing Visual Intelligence...*")
        photo_file = await update.message.photo[-1].get_file()
        buf = BytesIO(); await photo_file.download_to_memory(buf)
        img_bytes = buf.getvalue(); b64 = base64.b64encode(img_bytes).decode('utf-8')
        
        res_j = await self.ai_vision_extract(b64)
        if "TOO_MANY_REQUESTS" in res_j:
            await update.message.reply_text("⚠️ *AI Saturated. Switching to Manual Mode.* \n\nWhat is the **Title**?")
            self.user_states[chat_id] = {"mode": "manual", "stage": "get_title", "extracted": {"description": "Vision extraction failed (429)"}}
            return

        try:
            m = re.search(r"\{[\s\S]*\}", res_j); ext = json.loads(m.group(0))
        except:
            ext = {"short_title": "Visual Deployment", "urgency": 3, "severity": 3}
        
        self.user_states[chat_id] = {"mode": "ai", "extracted": ext, "timestamp": self.now_utc(), "stage": "loc_pending"}
        await update.message.reply_text(f"✅ *Extracted: {ext.get('short_title')}*\n📍 Now, send **Location**.")

    async def handle_location(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        loc = update.message.location
        return await self._finalize_report(update, loc.latitude, loc.longitude)

    async def _finalize_report(self, update: Update, lat: float, lng: float):
        chat_id = update.effective_chat.id; state = self.user_states.get(chat_id)
        if not state: return
        
        if state.get("mode") == "ai" and "extracted" not in state:
            res = await self.ai_insight(f"JSON from: {state.get('raw_text')}", system="JSON only.")
            try:
                m = re.search(r"\{[\s\S]*\}", res); state["extracted"] = json.loads(m.group(0))
            except: state["extracted"] = {"short_title": "Telegram Alert", "urgency": 3, "severity": 3}

        ext = state["extracted"]
        score = self.compute_priority({"urgency": int(ext.get("urgency", 3)), "people_affected": 1, "created_at": self.iso(state["timestamp"]), "severity": int(ext.get("severity", 3)), "weather_factor": 1, "vulnerability": ["none"]})
        
        data = {
            "id": str(uuid.uuid4()), "title": ext.get("short_title", "Manual Signal"), "category": "emergency", "description": ext.get("description", state.get("raw_text", "Tactical SITREP.")),
            "location": {"lat": lat, "lng": lng}, "urgency": int(ext.get("urgency", 3)), "severity": int(ext.get("severity", 3)), "status": "pending", "source": "user", "priority_score": round(score, 2), "created_at": self.iso(state["timestamp"])
        }
        await self.db.needs.insert_one(data)
        await update.message.reply_text(f"🚀 *Mission Deployed: {data['priority_score']}*\nCommand Center Alerted.", parse_mode='Markdown')
        if chat_id in self.user_states: del self.user_states[chat_id]

async def run_bot(token, db, ai_vision_extract, ai_insight, compute_priority, get_system_state, iso, now_utc):
    application = ApplicationBuilder().token(token).build()
    bot = JanrakshakBot(token, db, ai_vision_extract, ai_insight, compute_priority, get_system_state, iso, now_utc)
    application.add_handler(CommandHandler("start", bot.start))
    application.add_handler(CallbackQueryHandler(bot.handle_callback))
    application.add_handler(MessageHandler(filters.TEXT & (~filters.COMMAND), bot.handle_message))
    application.add_handler(MessageHandler(filters.PHOTO, bot.handle_photo))
    application.add_handler(MessageHandler(filters.LOCATION, bot.handle_location))
    await application.initialize(); await application.start(); await application.updater.start_polling()
    while True: await asyncio.sleep(5)
