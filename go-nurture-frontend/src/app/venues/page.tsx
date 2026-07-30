import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants";
import VenuesContent from "@/components/venues/VenuesContent";

export const metadata: Metadata = {
  title: "Venues | Go Nurture Initiative CIC",
  description: `Find community venues in Norfolk where ${SITE_CONFIG.name} cohorts meet.`,
  alternates: {
    canonical: "/venues",
  },
  openGraph: {
    title: "Venues | Go Nurture Initiative CIC",
    description: `Find community venues in Norfolk where ${SITE_CONFIG.name} cohorts meet.`,
    url: "/venues",
  },
};

export default function VenuesPage() {
  return <VenuesContent />;
}
