import asyncio
import uuid
from server import db, Mission, iso, now_utc

async def manual_seed():
    print("Initiating Manual Tactical Seeding...")
    # Find some volunteers
    vols = await db.volunteers.find({}).to_list(10)
    # Find some needs
    needs = await db.needs.find({"status": "pending"}).to_list(10)
    
    if not vols or not needs:
        print("Safety Abort: Insufficient tactical assets/needs for seeding.")
        return

    # Create a mission
    m = Mission(
        need_ids=[needs[0]['id']],
        volunteer_ids=[vols[0]['user_id']],
        status="in_progress",
        id=str(uuid.uuid4())
    ).model_dump()
    
    await db.missions.insert_one(m)
    # Update need status
    await db.needs.update_one({"id": needs[0]['id']}, {"$set": {"status": "assigned"}})
    
    print(f"Mission {m['id']} deployed. Seeding Complete.")

if __name__ == "__main__":
    asyncio.run(manual_seed())
