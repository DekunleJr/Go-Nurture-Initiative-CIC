import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Programmes",
  description:
    "Free, culturally adapted perinatal education and support programmes for vulnerable, Minority Ethnic, migrant, refugee, and displaced women in Norfolk. Three annual cohorts with multilingual delivery.",
  alternates: {
    canonical: "/programmes",
  },
  openGraph: {
    title: "Our Programmes | Go Nurture Initiative CIC",
    description:
      "Culturally adapted perinatal education, birth preparation, and postnatal support — free, referral-led, and multilingual.",
    url: "/programmes",
  },
};

export default function ProgrammesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}