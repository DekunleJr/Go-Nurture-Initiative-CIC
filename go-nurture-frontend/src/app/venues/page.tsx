"use client";

import { useState, useEffect } from "react";
import { MapPin, Navigation } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  postcode: string;
  latitude: number;
  longitude: number;
  description: string;
  transport_links: string;
  facilities: string;
}

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);


  useEffect(() => {
    const loadVenues = async () => {
      try {
        const res = await fetch(`${API_URL}/api/venues/`);
        if (res.ok) {
          const data = await res.json();
          setVenues(data);
          if (data.length > 0 && !selectedVenue) {
            setSelectedVenue(data[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching venues:", error);
      } finally {
        setLoading(false);
      }
    };
    loadVenues();
    }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative pt-32 lg:pt-80 pb-20 bg-(--color-primary) overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent-light) mb-3">
              Our Locations
            </p>
            <h1 className="font-heading text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl">
              Where Our Cohorts Meet
            </h1>
            <p className="mt-6 text-lg text-white/80 max-w-2xl">
              Our community perinatal programmes are delivered at accessible venues across Norfolk. 
              Each venue is carefully selected to ensure a safe, welcoming, and culturally appropriate environment.
            </p>
          </div>
        </div>
      </section>

      {/* Map and Venues List */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Venues List */}
            <div className="space-y-4">
              <h2 className="font-heading text-2xl font-bold text-(--color-primary)">
                All Venues ({venues.length})
              </h2>
              {loading ? (
                <p className="text-gray-600">Loading venues...</p>
              ) : (
                <div className="space-y-3 max-h-150 overflow-y-auto">
                  {venues.map((venue) => (
                    <button
                      key={venue.id}
                      onClick={() => setSelectedVenue(venue)}
                      className={`w-full text-left rounded-xl p-4 transition-all ${
                        selectedVenue?.id === venue.id
                          ? "bg-(--color-accent) text-white shadow-lg"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <MapPin
                          size={20}
                          className={selectedVenue?.id === venue.id ? "text-white" : "text-(--color-accent)"}
                        />
                        <div>
                          <h3 className="font-semibold">{venue.name}</h3>
                          <p className={`text-sm mt-1 ${selectedVenue?.id === venue.id ? "text-white/80" : "text-gray-600"}`}>
                            {venue.address}, {venue.city}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Map */}
            <div className="lg:col-span-2">
              {selectedVenue ? (
                <div className="space-y-6">
                  {/* Google Maps Embed */}
                  <div className="relative h-100 w-full rounded-xl overflow-hidden shadow-lg">
                    <iframe
                      title="Venue Map"
                      src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${selectedVenue.latitude},${selectedVenue.longitude}&zoom=15`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>

                  {/* Venue Details */}
                  <div className="rounded-xl bg-gray-50 p-6">
                    <h3 className="font-heading text-2xl font-bold text-(--color-primary) mb-4">
                      {selectedVenue.name}
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <MapPin className="text-(--color-accent) mt-1" size={20} />
                        <div>
                          <p className="font-medium text-gray-900">Address</p>
                          <p className="text-gray-600">
                            {selectedVenue.address}<br />
                            {selectedVenue.city}, {selectedVenue.postcode}
                          </p>
                        </div>
                      </div>

                      {selectedVenue.transport_links && (
                        <div className="flex items-start gap-3">
                          <Navigation className="text-(--color-accent) mt-1" size={20} />
                          <div>
                            <p className="font-medium text-gray-900">Transport Links</p>
                            <p className="text-gray-600">{selectedVenue.transport_links}</p>
                          </div>
                        </div>
                      )}

                      {selectedVenue.facilities && (
                        <div className="flex items-start gap-3">
                          <div className="text-(--color-accent) mt-1">🏢</div>
                          <div>
                            <p className="font-medium text-gray-900">Facilities</p>
                            <p className="text-gray-600">{selectedVenue.facilities}</p>
                          </div>
                        </div>
                      )}

                      {selectedVenue.description && (
                        <div className="pt-3 border-t border-gray-200">
                          <p className="text-gray-700">{selectedVenue.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-100 bg-gray-100 rounded-xl">
                  <p className="text-gray-600">Select a venue to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}