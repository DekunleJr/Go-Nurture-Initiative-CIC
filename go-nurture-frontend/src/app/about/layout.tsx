import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Go Nurture Initiative CIC is an asset-locked Community Interest Company providing free, referral-led, culturally adapted perinatal education to vulnerable, Minority Ethnic, migrant, refugee, and displaced women across Norfolk.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Us | Go Nurture Initiative CIC",
    description:
      "A Community Interest Company dedicated to every mother — providing free, culturally adapted perinatal support in Norfolk.",
    url: "/about",
  },
};

export default function AboutLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}