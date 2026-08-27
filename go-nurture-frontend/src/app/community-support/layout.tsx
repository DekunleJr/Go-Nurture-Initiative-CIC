import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Partnerships | Go Nurture Initiative CIC",
  description:
    "Learn how GNI works with maternity, primary-care, local-authority, voluntary, faith and community partners to support referral pathways in Norwich.",
  alternates: {
    canonical: "/community-support",
  },
};

export default function CommunitySupportLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}