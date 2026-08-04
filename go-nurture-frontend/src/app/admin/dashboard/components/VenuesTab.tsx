"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Search, MapPin, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "./ConfirmDialog";
import Pagination from "./Pagination";
import type L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  postcode: string | null;
  capacity: number;
  description: string;
  latitude: number | null;
  longitude: number | null;
}

interface VenuesTabProps {
  venues: Venue[];
  onCreateVenue: (venueData: {
    name: string;
    address: string;
    city: string;
    postcode: string;
    capacity: number;
    description: string;
    latitude?: number | null;
    longitude?: number | null;
  }) => Promise<void>;
  onUpdateVenue: (
    venueId: string,
    venueData: {
      name: string;
      address: string;
      city: string;
      postcode: string;
      capacity: number;
      description: string;
      latitude?: number | null;
      longitude?: number | null;
    }
  ) => Promise<void>;
  onDeleteVenue: (venueId: string) => Promise<void>;
  onRefresh: () => void;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <MapPin size={48} className="mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export default function VenuesTab({ venues, onCreateVenue, onUpdateVenue, onDeleteVenue, onRefresh }: VenuesTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [capacity, setCapacity] = useState(30);
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [venueToDelete, setVenueToDelete] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(venues.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visibleVenues = venues.slice(start, start + PAGE_SIZE);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [leafletLib, setLeafletLib] = useState<typeof L | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((mod) => {
      if (!cancelled) setLeafletLib(mod.default as typeof L);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!showForm || !mapContainerRef.current || mapRef.current || !leafletLib) return;
    const map = leafletLib.map(mapContainerRef.current, { center: [52.6309, 1.2974], zoom: 12, scrollWheelZoom: false });
    leafletLib.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    requestAnimationFrame(() => { map.invalidateSize(); });
    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
  }, [showForm, leafletLib]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !leafletLib || latitude == null || longitude == null) return;
    const icon = leafletLib.divIcon({
      className: "venue-marker",
      html: '<div class="venue-marker-pin"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>',
      iconSize: [36, 36], iconAnchor: [18, 34], popupAnchor: [0, -32],
    });
    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
      markerRef.current.setIcon(icon);
    } else {
      markerRef.current = leafletLib.marker([latitude, longitude], { icon }).addTo(map);
    }
    map.flyTo([latitude, longitude], 15, { duration: 0.8 });
  }, [latitude, longitude, leafletLib]);

  const geocodeAddress = async () => {
    if (!address || !city) { toast.error("Please fill in address and city first"); return; }
    setSearching(true);
    try {
      const query = encodeURIComponent([address, city, postcode].filter(Boolean).join(", "));
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`, { headers: { "User-Agent": "GoNurtureInitiativeCIC/1.0" } });
      const data = await res.json();
      if (data && data.length > 0) {
        setLatitude(parseFloat(data[0].lat));
        setLongitude(parseFloat(data[0].lon));
        toast.success("Location found! Pin placed on map.");
      } else { toast.error("Could not find that address. Try a more specific address."); }
    } catch { toast.error("Geocoding failed. Please try again."); }
    finally { setSearching(false); }
  };

  const resetForm = () => {
    setName(""); setAddress(""); setCity(""); setPostcode(""); setCapacity(30); setDescription("");
    setLatitude(null); setLongitude(null); setEditingVenue(null); setShowForm(false);
  };

  const handleEditClick = (venue: Venue) => {
    setEditingVenue(venue); setName(venue.name); setAddress(venue.address); setCity(venue.city);
    setPostcode(venue.postcode ?? ""); setCapacity(venue.capacity); setDescription(venue.description);
    setLatitude(venue.latitude); setLongitude(venue.longitude); setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address || !city) { toast.error("Please fill in all required fields"); return; }
    try {
      const venueData = { name, address, city, postcode, capacity, description, latitude, longitude };
      if (editingVenue) { await onUpdateVenue(editingVenue.id, venueData); toast.success("Venue updated successfully"); }
      else { await onCreateVenue(venueData); toast.success("Venue created successfully"); }
      resetForm(); onRefresh();
    } catch { toast.error((editingVenue ? "Failed to update venue" : "Failed to create venue")); }
  };

  const handleDeleteClick = (venueId: string) => { setVenueToDelete(venueId); setShowDeleteConfirm(true); };
  const handleDeleteConfirm = async () => {
    if (!venueToDelete) return;
    try { await onDeleteVenue(venueToDelete); toast.success("Venue deleted successfully"); onRefresh(); }
    catch { toast.error("Failed to delete venue"); }
    finally { setShowDeleteConfirm(false); setVenueToDelete(null); }
  };
  const handleDeleteCancel = () => { setShowDeleteConfirm(false); setVenueToDelete(null); };

  return (
    <div className="rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-heading text-xl font-bold text-gray-900">Venues ({venues.length})</h3>
        <button onClick={() => { if (showForm) resetForm(); else setShowForm(true); }} className="inline-flex items-center gap-2 rounded-lg bg-(--color-accent) px-4 py-2 text-white hover:bg-(--color-accent)/90">
          <Plus size={18} /> New Venue
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 border-b border-gray-200 bg-gray-50">
          <h4 className="font-heading text-lg font-bold text-gray-900 mb-4">{editingVenue ? "Edit Venue" : "Create New Venue"}</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Community Centre" className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address" className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
              <input type="text" value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="Postcode (optional)" className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <input type="number" value={capacity} onChange={(e) => setCapacity(parseInt(e.target.value))} className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" />
            </div>
          </div>

          <div className="mt-4 flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1"><MapPin size={14} className="inline mr-1" /> Find Location on Map</label>
              <p className="text-xs text-gray-500 mb-2">Search the address to place a pin on the map. The venue will be geocoded automatically if you skip this.</p>
              <button type="button" onClick={geocodeAddress} disabled={searching} className="inline-flex items-center gap-2 rounded-lg bg-(--color-primary) px-4 py-2 text-white hover:bg-(--color-primary)/90 disabled:opacity-50">
                <Search size={16} /> {searching ? "Searching..." : "Search Address"}
              </button>
            </div>
          </div>

          <div className="mt-4">
            <div ref={mapContainerRef} className="h-64 w-full rounded-xl overflow-hidden border border-gray-200" />
            {latitude != null && longitude != null && (<p className="mt-2 text-xs text-gray-600">Pin placed at: {latitude.toFixed(5)}, {longitude.toFixed(5)}</p>)}
          </div>

          <div className="mt-4 flex gap-3">
            <button type="submit" className="rounded-lg bg-(--color-accent) px-4 py-2 text-white hover:bg-(--color-accent)/90">{editingVenue ? "Save Changes" : "Create Venue"}</button>
            <button type="button" onClick={resetForm} className="rounded-lg border border-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Postcode</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Map</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {visibleVenues.length === 0 ? (
              <tr><td colSpan={7} className="px-6"><EmptyState message="No venues yet." /></td></tr>
            ) : (
              visibleVenues.map((venue) => (
                <tr key={venue.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{venue.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{venue.address}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{venue.city}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{venue.postcode}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{venue.capacity}</td>
                  <td className="px-6 py-4 text-sm">
                    {venue.latitude != null && venue.longitude != null ? (<span className="inline-flex items-center gap-1 text-xs font-medium text-green-600"><MapPin size={14} /> Plotted</span>) : (<span className="text-xs text-gray-400">No coords</span>)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEditClick(venue)} className="inline-flex items-center justify-center p-1 text-(--color-accent) hover:bg-(--color-accent)/10 rounded-lg" title="Edit venue"><Pencil size={16} /></button>
                      <button onClick={() => handleDeleteClick(venue.id)} className="inline-flex items-center justify-center p-1 text-red-600 hover:bg-red-50 rounded-lg" title="Delete venue"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {visibleVenues.length > 0 && (<Pagination page={currentPage} pageSize={PAGE_SIZE} total={venues.length} onPageChange={setPage} />)}

      <ConfirmDialog isOpen={showDeleteConfirm} title="Delete Venue" message="Are you sure you want to delete this venue? This action cannot be undone." onConfirm={handleDeleteConfirm} onCancel={handleDeleteCancel} />
    </div>
  );
}