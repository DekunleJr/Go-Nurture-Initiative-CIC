// Free Nominatim (OpenStreetMap) geocoding, same as the old backend.
const URL_BASE = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "GoNurtureInitiativeCIC/1.0 (contact: info@gonurtureinitiative.org.uk)";

export async function geocodeAddress(
  address: string,
  city?: string | null,
  postcode?: string | null,
): Promise<{ lat: number; lon: number } | null> {
  const q = [address, city, postcode].filter(Boolean).join(", ");
  if (!q) return null;
  try {
    const res = await fetch(`${URL_BASE}?${new URLSearchParams({ q, format: "json", limit: "1" })}`, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;
    const lat = Number(data[0].lat);
    const lon = Number(data[0].lon);
    return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
  } catch (e) {
    console.warn(`Geocoding failed for "${q}"`, e);
    return null;
  }
}
