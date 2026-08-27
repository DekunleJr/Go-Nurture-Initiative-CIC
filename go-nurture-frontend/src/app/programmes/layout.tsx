import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GNI Programmes | FOBCP and Infant-Feeding Support in Norwich",
  description:
    "Explore GNI’s six-week birth-confidence programme, infant-feeding clinics, postnatal reunion and referral-led accessibility support in Norwich.",
  alternates: {
    canonical: "/programmes",
  },
};

export default function ProgrammesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}