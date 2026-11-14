import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Go Nurture Initiative CIC",
  description:
    "Go Nurture Initiative CIC is an independent community interest company based in Norwich, improving access to pregnancy, birth and early-parenthood education and support across Norfolk.",
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
