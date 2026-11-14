import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Programmes | Go Nurture Initiative CIC",
  description:
    "Free antenatal education and infant-feeding support for women and families facing barriers to access across Norwich and Norfolk, offered through approved referral partners.",
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
