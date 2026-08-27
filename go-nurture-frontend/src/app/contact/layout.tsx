import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Go Nurture Initiative CIC | Referrals and Partnerships",
  description:
    "Contact GNI about Norwich referrals, community partnerships, funding, volunteering or general programme information.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}