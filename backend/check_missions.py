import asyncio
from server import db

async def check():
    m = await db.missions.find({}).to_list(100)
    print(f"Total Missions: {len(m)}")
    for x in m:
        print(f"Mission ID: {x['id']}, Status: {x['status']}, Vols: {x.get('volunteer_ids')}")

if __name__ == "__main__":
    asyncio.run(check())
