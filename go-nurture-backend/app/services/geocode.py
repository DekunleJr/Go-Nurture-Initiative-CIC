"""Address geocoding using the free Nominatim (OpenStreetMap) API."""

import json
import logging
import urllib.parse
import urllib.request
from typing import Optional

logger = logging.getLogger(__name__)

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "GoNurtureInitiativeCIC/1.0 (contact: admin@gonurture.org.uk)"


def geocode_address(
    address: str,
    city: Optional[str] = None,
    postcode: Optional[str] = None,
) -> Optional[dict]:
    """Geocode an address to {lat, lon} using Nominatim."""
    query_parts = [part for part in [address, city, postcode] if part]
    if not query_parts:
        return None

    query = ", ".join(query_parts)
    params = urllib.parse.urlencode({"q": query, "format": "json", "limit": 1})
    url = f"{NOMINATIM_URL}?{params}"

    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception as exc:
        logger.warning("Geocoding failed for %r: %s", query, exc)
        return None

    if not data:
        logger.info("No geocoding results for %r", query)
        return None

    try:
        return {"lat": float(data[0]["lat"]), "lon": float(data[0]["lon"])}
    except (KeyError, ValueError, IndexError) as exc:
        logger.warning("Unexpected geocoding response for %r: %s", query, exc)
        return None