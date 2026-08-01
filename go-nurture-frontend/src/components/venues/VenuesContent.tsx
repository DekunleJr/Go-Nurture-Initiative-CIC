"use client";

import React, { useEffect, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";

interface Venue {
  id: string;
  name: string;
  address: string;
  transport: string;
  facilities: string;
}

export default function VenuesContent() {
  const { t } = useLanguage();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/venues/`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch venues");
        return res.json();
      })
      .then((data: Venue[]) => {
        setVenues(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 lg:pt-80 pb-20 bg-(--color-primary) overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent-light) mb-3">
            {t("venues.introLabel")}
          </p>
          <h1 className="font-heading text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl">
            {t("venues.introTitle")}
          </h1>
          <p className="mt-6 text-lg text-white/80 max-w-2xl">
            {t("venues.introDesc")}
          </p>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl mb-8 text-center">
            {t("venues.mapLabel")}
          </h2>
          <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200">
            <iframe
              title="Norfolk Venues Map"
              src="https://www.openstreetmap.org/export/embed.html?bbox=0.5%2C52.5%2C1.5%2C53.0&layer=mapnik&marker=52.6311%2C1.2996"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
            />
          </div>
          <p className="text-center text-sm text-(--color-text-muted) mt-4">
            Norfolk, United Kingdom
          </p>
        </div>
      </section>

      {/* Venue List */}
      <section className="py-20 bg-(--color-bg-sage)">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl mb-12 text-center">
            {t("venues.listLabel")}
          </h2>

          {loading ? (
            <p className="text-center text-(--color-text-muted)">Loading venues...</p>
          ) : error ? (
            <p className="text-center text-red-500">Error: {error}</p>
          ) : venues.length === 0 ? (
            <p className="text-center text-(--color-text-muted)">No venues available at this time.</p>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {venues.map((venue) => (
                <div
                  key={venue.id}
                  className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
                >
                  <h3 className="font-heading text-xl font-bold text-(--color-primary) mb-4">
                    {venue.name}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-(--color-accent) mb-1">
                        {t("venues.address")}
                      </p>
                      <p className="text-sm text-(--color-text-muted)">
                        {venue.address}
                      </p>
                    </div>
                    {venue.transport && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-(--color-accent) mb-1">
                          {t("venues.transport")}
                        </p>
                        <p className="text-sm text-(--color-text-muted)">
                          {venue.transport}
                        </p>
                      </div>
                    )}
                    {venue.facilities && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-(--color-accent) mb-1">
                          {t("venues.facilities")}
                        </p>
                        <p className="text-sm text-(--color-text-muted)">
                          {venue.facilities}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl mb-4">
            {t("venues.ctaTitle")}
          </h2>
          <p className="text-lg text-(--color-text-muted) mb-8">
            {t("venues.ctaDesc")}
          </p>
          <a href="/contact">
            <button className="inline-flex items-center gap-2 rounded-xl bg-(--color-accent) px-8 py-4 text-base font-semibold text-white shadow-lg shadow-(--color-accent)/30 transition-all hover:bg-(--color-accent-light) hover:shadow-xl hover:shadow-(--color-accent)/40">
              {t("venues.ctaButton")}
            </button>
          </a>
        </div>
      </section>
    </>
  );
}