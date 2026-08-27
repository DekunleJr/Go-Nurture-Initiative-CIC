"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  MapPin,
  Navigation,
  Accessibility,
  Landmark,
  CalendarDays,
  Info,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api-client";

const VenueMap = dynamic(() => import("./VenueMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <p className="text-gray-600">Loading map...</p>
    </div>
  ),
});

interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  postcode: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  transport_links: string | null;
  nearby_landmarks: string | null;
  accessibility_info: string | null;
  is_active: boolean | null;
}

type VenuesState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "ready"; venues: Venue[] };

export default function VenuesPage() {
  const { t } = useLanguage();
  const [state, setState] = useState<VenuesState>({ status: "loading" });
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadVenues = async () => {
      try {
        const data = await api.get<Venue[]>("/api/venues/");
        if (cancelled) return;
        // Defence-in-depth: the public endpoint already filters by is_active,
        // but never rely on that alone for publication control.
        const activeVenues = (data || []).filter((v) => v.is_active !== false);
        if (activeVenues.length === 0) {
          setState({ status: "empty" });
        } else {
          setState({ status: "ready", venues: activeVenues });
          setSelectedVenue((current) => current ?? activeVenues[0]);
        }
      } catch (error) {
        console.error("Error fetching venues:", error);
        if (!cancelled) setState({ status: "empty" });
      }
    };

    loadVenues();
    return () => {
      cancelled = true;
    };
  }, []);

  // Listen for marker clicks on the map
  useEffect(() => {
    if (state.status !== "ready") return;
    const handleVenueSelect = (event: Event) => {
      const customEvent = event as CustomEvent<{ id: string }>;
      const venue = state.venues.find((v) => v.id === customEvent.detail.id);
      if (venue) setSelectedVenue(venue);
    };
    document.addEventListener("venue:select", handleVenueSelect);
    return () => document.removeEventListener("venue:select", handleVenueSelect);
  }, [state]);

  const hasVenues = state.status === "ready";
  const introDescKey = hasVenues ? "venues.introDescAfter" : "venues.introDescBefore";

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 lg:pt-80 pb-20 bg-(--color-primary) overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent-light) mb-3">
              {t("venues.introLabel")}
            </p>
            <h1 className="font-heading text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl">
              {t("venues.introTitle")}
            </h1>
            <p className="mt-6 text-lg text-white/80 max-w-2xl">
              {t(introDescKey)}
            </p>
          </div>
        </div>
      </section>

      {state.status === "loading" && (
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-(--color-primary) border-t-transparent" />
          </div>
        </section>
      )}

      {state.status === "empty" && (
        <>
          {/* Venue Information Card — venue not yet confirmed */}
          <section className="py-20 bg-white">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
              <h2 className="mb-8 text-center font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl">
                {t("venues.cardLabel")}
              </h2>
              <div className="rounded-2xl border border-(--color-border) bg-(--color-bg-sage) p-8 shadow-sm">
                <dl className="space-y-6">
                  {[
                    {
                      icon: <MapPin size={20} />,
                      labelKey: "venues.venueName",
                      value: "[To be confirmed before referrals open]",
                    },
                    {
                      icon: <MapPin size={20} />,
                      labelKey: "venues.address",
                      value: "[Full address and postcode will be published once the venue is confirmed]",
                    },
                    {
                      icon: <Navigation size={20} />,
                      labelKey: "venues.gettingHere",
                      value: "[Bus, walking, parking and drop-off information will be published here]",
                    },
                    {
                      icon: <Accessibility size={20} />,
                      labelKey: "venues.accessibility",
                      value:
                        "[Step-free access, toilets, hearing support, lighting, quiet space and other verified accessibility information will be published here]",
                    },
                  ].map((field) => (
                    <div key={field.labelKey} className="flex items-start gap-4">
                      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-(--color-accent)/10 text-(--color-accent)">
                        {field.icon}
                      </span>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-(--color-accent)">
                          {t(field.labelKey)}
                        </dt>
                        <dd className="mt-1 text-sm leading-relaxed text-(--color-text-muted)">
                          {field.value}
                        </dd>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-start gap-4">
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-(--color-accent)/10 text-(--color-accent)">
                      <CalendarDays size={20} />
                    </span>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-(--color-accent)">
                        {t("venues.sessionInfo")}
                      </dt>
                      <dd className="mt-1 text-sm leading-relaxed text-(--color-text-muted)">
                        {t("venues.sessionInfoValue")}
                      </dd>
                    </div>
                  </div>
                </dl>

                {/* Access Needs */}
                <div className="mt-8 flex items-start gap-4 rounded-xl border-l-4 border-(--color-accent) bg-white p-5">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-(--color-accent)/10 text-(--color-accent)">
                    <Info size={20} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-(--color-accent)">
                      {t("venues.accessNeeds")}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-(--color-text-muted)">
                      {t("venues.accessNeedsDesc")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-20 bg-(--color-bg-sage)">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl mb-4">
                {t("venues.ctaTitle")}
              </h2>
              <p className="text-lg text-(--color-text-muted) mb-8">
                {t("venues.ctaDesc")}
              </p>
              <Link href="/contact">
                <Button variant="accent" size="lg" className="group">
                  {t("venues.ctaButton")}
                  <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </section>
        </>
      )}

      {state.status === "ready" && selectedVenue && (
        <>
          {/* Map and Venues List */}
          <section className="py-20 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid gap-8 lg:grid-cols-3">
                {/* Venues List */}
                <div className="space-y-4">
                  <h2 className="font-heading text-2xl font-bold text-(--color-primary)">
                    {t("venues.selectVenue")}
                  </h2>
                  {state.venues.map((venue) => (
                    <button
                      key={venue.id}
                      onClick={() => setSelectedVenue(venue)}
                      aria-pressed={selectedVenue.id === venue.id}
                      className={`w-full text-left rounded-xl p-4 transition-all ${
                        selectedVenue.id === venue.id
                          ? "bg-(--color-bg-sage) border-l-4 border-(--color-accent) shadow-sm"
                          : "bg-white border border-(--color-border) hover:bg-(--color-bg-sage)"
                      }`}
                    >
                      <p className="font-semibold text-(--color-primary)">
                        {venue.name}
                      </p>
                      <p className="text-sm text-(--color-text-muted) mt-1">
                        {venue.address}, {venue.city}
                        {venue.postcode ? `, ${venue.postcode}` : ""}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Map + Details */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="relative h-100 w-full rounded-xl overflow-hidden shadow-lg z-0">
                    <VenueMap venues={state.venues} selectedVenue={selectedVenue} />
                  </div>

                  {/* Venue Details */}
                  <div className="rounded-xl bg-(--color-bg-sage) p-6">
                    <h3 className="font-heading text-2xl font-bold text-(--color-primary) mb-4">
                      {selectedVenue.name}
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="text-(--color-accent) mt-1" size={20} />
                        <div>
                          <p className="font-medium text-foreground">{t("venues.address")}</p>
                          <p className="text-(--color-text-muted)">
                            {selectedVenue.address}
                            <br />
                            {selectedVenue.city}
                            {selectedVenue.postcode ? `, ${selectedVenue.postcode}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Navigation className="text-(--color-accent) mt-1" size={20} />
                        <div>
                          <p className="font-medium text-foreground">{t("venues.gettingHere")}</p>
                          <p className="text-(--color-text-muted)">
                            {selectedVenue.transport_links || t("venues.detailsPending")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Landmark className="text-(--color-accent) mt-1" size={20} />
                        <div>
                          <p className="font-medium text-foreground">{t("venues.landmarks")}</p>
                          <p className="text-(--color-text-muted)">
                            {selectedVenue.nearby_landmarks || t("venues.detailsPending")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Accessibility className="text-(--color-accent) mt-1" size={20} />
                        <div>
                          <p className="font-medium text-foreground">{t("venues.accessibility")}</p>
                          <p className="text-(--color-text-muted)">
                            {selectedVenue.accessibility_info || t("venues.detailsPending")}
                          </p>
                        </div>
                      </div>

                      {selectedVenue.description && (
                        <div className="pt-3 border-t border-(--color-border) flex items-start gap-3">
                          <Check className="text-(--color-accent) mt-1" size={20} />
                          <p className="text-foreground">{selectedVenue.description}</p>
                        </div>
                      )}
                    </div>

                    {/* Access Needs */}
                    <div className="mt-6 flex items-start gap-4 rounded-xl border-l-4 border-(--color-accent) bg-white p-5">
                      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-(--color-accent)/10 text-(--color-accent)">
                        <Info size={20} />
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-(--color-accent)">
                          {t("venues.accessNeeds")}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-(--color-text-muted)">
                          {t("venues.accessNeedsDesc")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-20 bg-(--color-bg-sage)">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl mb-4">
                {t("venues.ctaTitle")}
              </h2>
              <p className="text-lg text-(--color-text-muted) mb-8">
                {t("venues.ctaDesc")}
              </p>
              <Link href="/contact">
                <Button variant="accent" size="lg" className="group">
                  {t("venues.ctaButton")}
                  <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </section>
        </>
      )}
    </>
  );
}
