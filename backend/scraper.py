"""
Scraper module for the Ordine di Servizio site.
Fetches and parses the mobile HTML view, returning structured data.
"""
from __future__ import annotations

import re
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

BASE_URL = "https://service.funiviecampiglio.it/ordinediservizio/mobile/index.php"
USER_AGENT = "Mozilla/5.0 (compatible; OrdineServizioMirror/1.0)"


def _split_numbers(raw: str) -> List[str]:
    """Split concatenated 3-digit personnel codes.

    Handles special cases where the site may occasionally include separators.
    """
    if not raw:
        return []
    # Keep only digits
    digits = re.sub(r"\D", "", raw)
    if not digits:
        return []
    # Split into 3-digit chunks. If not divisible by 3, chunk from the left.
    chunks: List[str] = []
    i = 0
    while i < len(digits):
        chunk = digits[i:i + 3]
        if len(chunk) == 3:
            # Strip leading zeros (039 -> "39", 007 -> "7"). Keep at least "0".
            normalized = chunk.lstrip("0") or "0"
            chunks.append(normalized)
        i += 3
    return chunks


def _clean_text(txt: Optional[str]) -> str:
    if not txt:
        return ""
    return re.sub(r"\s+", " ", txt).strip()


def parse_html(html: str) -> Dict[str, Any]:
    """Parse the HTML of the Ordine di Servizio mobile page.

    Returns:
        {
            "date_label": "Ven 14-08-2026",
            "sections": [
                {
                    "id": "A",
                    "title": "Direzione A Zona Spinale-Groste",
                    "zones": [
                        {"code": "A01", "description": "TC Spinale", "personnel": ["011","023","079"]},
                        ...
                    ]
                },
                ...
            ],
            "absent": {
                "assenti": ["004","005",...],
                "riposo": ["006","021",...]
            }
        }
    """
    soup = BeautifulSoup(html, "lxml")
    result: Dict[str, Any] = {
        "date_label": "",
        "sections": [],
        "absent": {"assenti": [], "riposo": []},
    }

    # Try to detect the date label (e.g., "Ven 14-08-2026")
    date_match = re.search(r"(Lun|Mar|Mer|Gio|Ven|Sab|Dom)\s+(\d{2}-\d{2}-\d{4})", soup.get_text(" ", strip=True))
    if date_match:
        result["date_label"] = f"{date_match.group(1)} {date_match.group(2)}"

    current_section: Optional[Dict[str, Any]] = None

    # Iterate all rows across all tables
    for row in soup.find_all("tr"):
        cells = row.find_all(["td", "th"])
        if not cells:
            continue
        texts = [_clean_text(c.get_text(" ", strip=True)) for c in cells]
        # Skip empty rows
        if not any(texts):
            continue
        # Ignore navigation rows containing '<<' or '>>'
        joined = " ".join(texts)
        if "<<" in joined or ">>" in joined:
            continue

        # Detect section header rows (Direzione ... or Varie or Assenti)
        first = texts[0]
        is_section_header = False
        if first.lower().startswith("direzione"):
            is_section_header = True
            # Extract letter id if possible (e.g. "Direzione A ...")
            m = re.match(r"direzione\s+([A-Za-z])\b", first, re.IGNORECASE)
            sec_id = (m.group(1).upper() if m else first[:1].upper())
            current_section = {"id": sec_id, "title": first, "zones": []}
            result["sections"].append(current_section)
            continue
        if first.lower() == "assenti" and len(texts) == 1:
            # Header row for absent section - no data on this row
            current_section = None
            continue

        # Absent detail rows: "Assenti" | (empty or "per riposo") | numbers
        if first.lower() == "assenti":
            # Determine bucket
            second = texts[1] if len(texts) > 1 else ""
            numbers_raw = texts[-1] if len(texts) >= 2 else ""
            nums = _split_numbers(numbers_raw)
            if "riposo" in second.lower():
                result["absent"]["riposo"].extend(nums)
            else:
                result["absent"]["assenti"].extend(nums)
            continue

        # Zone data row: expected 3 cells => code, description, numbers
        if current_section is not None and len(texts) >= 2:
            code = texts[0]
            # Zone codes look like A01, B12, Z07 etc.
            if not re.match(r"^[A-Z]\d{2}$", code):
                continue
            description = texts[1] if len(texts) > 1 else ""
            numbers_raw = texts[2] if len(texts) > 2 else ""
            zone = {
                "code": code,
                "description": description,
                "personnel": _split_numbers(numbers_raw),
            }
            current_section["zones"].append(zone)

    return result


async def fetch_day(date_str: str, timeout: float = 15.0) -> Dict[str, Any]:
    """Fetch and parse a single day.

    Args:
        date_str: format DD-MM-YYYY (matches the source site)
    """
    params = {"giorno": date_str}
    async with httpx.AsyncClient(timeout=timeout, headers={"User-Agent": USER_AGENT}, follow_redirects=True) as client:
        last_err: Optional[Exception] = None
        # simple retry
        for attempt in range(3):
            try:
                r = await client.get(BASE_URL, params=params)
                r.raise_for_status()
                # Site uses windows-1252 or utf-8; try both
                content = r.content
                try:
                    html = content.decode("utf-8")
                except UnicodeDecodeError:
                    html = content.decode("iso-8859-1", errors="replace")
                data = parse_html(html)
                data["date"] = date_str
                data["fetched_at"] = datetime.now(timezone.utc).isoformat()
                return data
            except Exception as e:  # noqa: BLE001
                last_err = e
                logger.warning("fetch_day attempt %d failed for %s: %s", attempt + 1, date_str, e)
        raise RuntimeError(f"fetch_day failed for {date_str}: {last_err}")
