import time
import random
import asyncio
import aiohttp
import sys

URL = "http://localhost:8000/api/citizen/reports"

EMERGENCIES = [
    "Massive fire breaking out in the industrial sector! People are trapped.",
    "Water levels are rising fast in the slums, 50 families need immediate rescue.",
    "Roads washed out completely, medical supplies running low at the local shelter.",
    "Major building collapsed after the tremor, many injured under the rubble.",
    "Bhookamp aaya hai bhari, log fase hue hain andar emergency!!",
    "We need immediate food drops, we are completely cut off from the main city.",
    "No electricity and oxygen cylinders are empty at the regional clinic."
]

CITIES = [
    {"lat": 28.6139, "lng": 77.2090}, # Delhi
    {"lat": 28.5355, "lng": 77.3910}, # Noida
    {"lat": 28.4595, "lng": 77.0266}, # Gurugram
]

def create_payload():
    return {
        "raw_text": random.choice(EMERGENCIES),
        "image_urls": "",
        "reporter_name": "Chaos Monkey 🐒",
        "reporter_phone": "+91-9999999999",
        "language": "en"
    }

async def generate_chaos(count=20, delay=1.0):
    print(f"🐒 Unleashing Chaos Monkey: Simulating {count} urgent citizen reports...")
    
    async with aiohttp.ClientSession() as session:
        for i in range(count):
            payload = create_payload()
            try:
                print(f"[{i+1}/{count}] Sending stress payload...")
                async with session.post(URL, json=payload) as resp:
                    if resp.status == 200:
                        print(f"  [+] Success (HTTP 200)")
                    else:
                        print(f"  [-] Failed (HTTP {resp.status})")
            except Exception as e:
                print(f"  [!] Connection Error: {e}")
            
            await asyncio.sleep(delay)
            
    print("Chaos generation complete. Check dashboard for telemetry load.")

if __name__ == "__main__":
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 10
    delay = float(sys.argv[2]) if len(sys.argv) > 2 else 0.5
    asyncio.run(generate_chaos(count, delay))
