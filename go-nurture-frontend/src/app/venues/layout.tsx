import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GNI Norwich Venue | Access and Travel Information",
  description:
    "Find confirmed venue, accessibility and travel information for Go Nurture Initiative CIC’s Norwich programmes and clinics.",
  alternates: {
    canonical: "/venues",
  },
};

export default function VenuesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}