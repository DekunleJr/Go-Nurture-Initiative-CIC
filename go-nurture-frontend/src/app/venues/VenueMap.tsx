"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  postcode: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string;
  transport_links: string;
  facilities: string;
}

interface VenueMapProps {
  venues: Venue[];
  selectedVenue: Venue;
}

const DEFAULT_CENTER: [number, number] = [52.6309, 1.2974]; // Norwich, Norfolk
const DEFAULT_ZOOM = 12;

function hasValidCoords(venue: Venue | null | undefined): venue is Venue {
  return (
    !!venue &&
    typeof venue.latitude === "number" &&
    typeof venue.longitude === "number" &&
    !Number.isNaN(venue.latitude) &&
    !Number.isNaN(venue.longitude)
  );
}

export default function VenueMap({ venues, selectedVenue }: VenueMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const [mapReady, setMapReady] = useState(false);

  // Initialize map once on mount
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: hasValidCoords(selectedVenue)
        ? [selectedVenue.latitude as number, selectedVenue.longitude as number]
        : DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    setMapReady(true);

    requestAnimationFrame(() => {
      map.invalidateSize();
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Create / update markers when venues change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    Object.keys(markersRef.current).forEach((id) => {
      if (!venues.some((v) => v.id === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    venues.forEach((venue) => {
      if (!hasValidCoords(venue)) return;

      const isSelected = venue.id === selectedVenue.id;

      const icon = L.divIcon({
        className: "venue-marker",
        html: `<div class="venue-marker-pin${isSelected ? " venue-marker-pin--selected" : ""}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 34],
        popupAnchor: [0, -32],
      });

      const marker =
        markersRef.current[venue.id] ??
        L.marker([venue.latitude as number, venue.longitude as number], { icon }).addTo(map);

      marker.setIcon(icon);
      marker.bindPopup(
        `<strong>${venue.name}</strong><br />${venue.address}, ${venue.city}${venue.postcode ? `, ${venue.postcode}` : ""}`,
        { closeButton: false }
      );

      marker.on("click", () => {
        document.dispatchEvent(
          new CustomEvent("venue:select", { detail: { id: venue.id } })
        );
      });

      markersRef.current[venue.id] = marker;

      if (isSelected) {
        marker.openPopup();
      }
    });
  }, [venues, selectedVenue.id, mapReady]);

  // Fly to the selected venue
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    map.flyTo(
      hasValidCoords(selectedVenue)
        ? [selectedVenue.latitude as number, selectedVenue.longitude as number]
        : DEFAULT_CENTER,
      hasValidCoords(selectedVenue) ? 14 : DEFAULT_ZOOM,
      { duration: 1.2 }
    );
  }, [selectedVenue.latitude, selectedVenue.longitude, mapReady]);

  return (
    <div
      ref={mapContainerRef}
      className="h-full w-full"
      aria-label="Map of venues"
    />
  );
}