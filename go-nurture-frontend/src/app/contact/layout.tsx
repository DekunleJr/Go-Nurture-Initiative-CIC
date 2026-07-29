import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Go Nurture Initiative CIC. Whether you are a potential referral partner, supporter, or community member, we'd love to hear from you.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact | Go Nurture Initiative CIC",
    description:
      "Partner enquiries, community questions, and referral partner applications — contact us today.",
    url: "/contact",
  },
};

export default function ContactLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}