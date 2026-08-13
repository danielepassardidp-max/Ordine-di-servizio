from __future__ import annotations

import os
import json
import asyncio
import logging
from pathlib import Path
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from zoneinfo import ZoneInfo

from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

from scraper import fetch_day

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

PERSONNEL_FILE = ROOT_DIR / "personnel.json"
TZ = ZoneInfo("Europe/Rome")
SYNC_INTERVAL_MIN = int(os.environ.get("SYNC_INTERVAL_MIN", "20"))

# MongoDB
mongo_url = os.environ["MONGO_URL"]
mongo_client = AsyncIOMotorClient(mongo_url)
db = mongo_client[os.environ["DB_NAME"]]

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("ordinediservizio")

app = FastAPI(title="Ordine di Servizio Mirror")
api = APIRouter(prefix="/api")

sync_state: Dict[str, Any] = {
    "last_sync": None,
    "last_error": None,
    "in_progress": False,
    "next_sync": None,
}


def load_personnel() -> Dict[str, Dict[str, str]]:
    with open(PERSONNEL_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("mapping", {})


def save_personnel(mapping: Dict[str, Dict[str, str]]) -> None:
    with open(PERSONNEL_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    data["mapping"] = mapping
    with open(PERSONNEL_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def today_local() -> datetime:
    return datetime.now(TZ)


def date_str(d: datetime) -> str:
    return d.strftime("%d-%m-%Y")


def three_days() -> List[str]:
    now = today_local()
    return [date_str(now + timedelta(days=i)) for i in range(3)]


async def sync_day(day: str) -> Dict[str, Any]:
    data = await fetch_day(day)
    await db.days.update_one(
        {"date": day},
        {"$set": {
            "date": day,
            "date_label": data.get("date_label", ""),
            "sections": data.get("sections", []),
            "absent": data.get("absent", {"assenti": [], "riposo": []}),
            "fetched_at": data.get("fetched_at"),
        }},
        upsert=True,
    )
    return data


async def sync_all() -> Dict[str, Any]:
    if sync_state["in_progress"]:
        return {"status": "already_running"}
    sync_state["in_progress"] = True
    try:
        days = three_days()
        results = []
        for d in days:
            try:
                await sync_day(d)
                results.append({"date": d, "status": "ok"})
            except Exception as e:  # noqa: BLE001
                logger.error("sync failed for %s: %s", d, e)
                results.append({"date": d, "status": "error", "error": str(e)})
        # Cleanup: remove docs older than 7 days
        old_cutoff = today_local() - timedelta(days=7)
        async for doc in db.days.find({}, {"date": 1}):
            try:
                d_val = datetime.strptime(doc["date"], "%d-%m-%Y").replace(tzinfo=TZ)
                if d_val < old_cutoff.replace(hour=0, minute=0, second=0, microsecond=0):
                    await db.days.delete_one({"_id": doc["_id"]})
            except Exception:
                pass
        sync_state["last_sync"] = datetime.now(timezone.utc).isoformat()
        sync_state["last_error"] = None
        sync_state["next_sync"] = (datetime.now(timezone.utc) + timedelta(minutes=SYNC_INTERVAL_MIN)).isoformat()
        return {"status": "ok", "results": results, "last_sync": sync_state["last_sync"]}
    except Exception as e:  # noqa: BLE001
        sync_state["last_error"] = str(e)
        raise
    finally:
        sync_state["in_progress"] = False


async def sync_loop() -> None:
    try:
        await sync_all()
    except Exception as e:  # noqa: BLE001
        logger.exception("initial sync failed: %s", e)
    while True:
        await asyncio.sleep(SYNC_INTERVAL_MIN * 60)
        try:
            await sync_all()
        except Exception as e:  # noqa: BLE001
            logger.exception("periodic sync failed: %s", e)


def enrich_day(doc: Dict[str, Any], mapping: Dict[str, Dict[str, str]]) -> Dict[str, Any]:
    def lookup(code: str) -> Optional[str]:
        entry = mapping.get(code)
        return entry["name"] if entry else None

    result = {
        "date": doc.get("date"),
        "date_label": doc.get("date_label", ""),
        "fetched_at": doc.get("fetched_at"),
        "sections": [],
        "absent": doc.get("absent", {"assenti": [], "riposo": []}),
    }
    for section in doc.get("sections", []):
        zones = []
        for z in section.get("zones", []):
            personnel = [{"code": c, "name": lookup(c)} for c in z.get("personnel", [])]
            zones.append({
                "code": z["code"],
                "description": z.get("description", ""),
                "personnel": personnel,
            })
        result["sections"].append({
            "id": section.get("id"),
            "title": section.get("title"),
            "zones": zones,
        })
    absent = doc.get("absent", {})
    result["absent"] = {
        "assenti": [{"code": c, "name": mapping.get(c, {}).get("name")} for c in absent.get("assenti", [])],
        "riposo": [{"code": c, "name": mapping.get(c, {}).get("name")} for c in absent.get("riposo", [])],
    }
    return result


class PersonnelUpdate(BaseModel):
    code: str
    name: str
    full_code: Optional[str] = None


@api.get("/")
async def root():
    return {"service": "Ordine di Servizio Mirror", "status": "running"}


@api.get("/days")
async def get_days():
    mapping = load_personnel()
    days = three_days()
    labels = ["oggi", "domani", "dopodomani"]
    result = []
    for label, d in zip(labels, days):
        doc = await db.days.find_one({"date": d}, {"_id": 0})
        if doc:
            enriched = enrich_day(doc, mapping)
        else:
            enriched = {
                "date": d,
                "date_label": "",
                "fetched_at": None,
                "sections": [],
                "absent": {"assenti": [], "riposo": []},
            }
        enriched["label"] = label
        result.append(enriched)
    return {
        "days": result,
        "sync": {
            "last_sync": sync_state["last_sync"],
            "next_sync": sync_state["next_sync"],
            "in_progress": sync_state["in_progress"],
            "last_error": sync_state["last_error"],
            "interval_minutes": SYNC_INTERVAL_MIN,
        },
    }


@api.get("/personnel")
async def get_personnel():
    return {"mapping": load_personnel()}


@api.put("/personnel")
async def update_personnel(item: PersonnelUpdate):
    if not item.code or len(item.code) != 3 or not item.code.isdigit():
        raise HTTPException(400, "code must be a 3-digit string")
    mapping = load_personnel()
    mapping[item.code] = {"name": item.name.strip(), "code": item.full_code or item.code}
    save_personnel(mapping)
    return {"status": "ok", "code": item.code, "name": item.name}


@api.delete("/personnel/{code}")
async def delete_personnel(code: str):
    mapping = load_personnel()
    if code in mapping:
        del mapping[code]
        save_personnel(mapping)
    return {"status": "ok"}


@api.post("/sync")
async def force_sync():
    if sync_state["in_progress"]:
        return {"status": "already_running"}
    result = await sync_all()
    return result


@api.get("/sync/status")
async def sync_status():
    return sync_state


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    asyncio.create_task(sync_loop())


@app.on_event("shutdown")
async def on_shutdown():
    mongo_client.close()
