import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Go Nurture Initiative CIC | Our Mission, Values and Team",
  description:
    "Learn about GNI’s mission, values, governance, Norwich delivery plan and culturally responsive approach to perinatal education and infant-feeding support.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}