import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transparency and Donations | Go Nurture Initiative CIC",
  description:
    "Read about GNI’s CIC status, funding, use of funds, reporting commitments and donation terms. GNI is a CIC and not a registered charity.",
  alternates: {
    canonical: "/transparency",
  },
};

export default function TransparencyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}