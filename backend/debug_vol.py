import asyncio
from server import db

async def check():
    v = await db.volunteers.find_one({})
    print(f"Volunteer: {v}")

if __name__ == "__main__":
    asyncio.run(check())
