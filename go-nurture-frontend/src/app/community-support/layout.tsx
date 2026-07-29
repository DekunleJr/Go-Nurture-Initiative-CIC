import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Support",
  description:
    "Go Nurture Initiative CIC works with NHS teams, midwives, community organisations, and faith groups across Norfolk to ensure every vulnerable mother receives culturally safe perinatal support.",
  alternates: {
    canonical: "/community-support",
  },
  openGraph: {
    title: "Community Support | Go Nurture Initiative CIC",
    description:
      "Stronger together through partnership — holistic, culturally safe care for vulnerable women in Norfolk.",
    url: "/community-support",
  },
};

export default function CommunitySupportLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}