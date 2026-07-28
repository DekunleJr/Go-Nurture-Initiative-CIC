import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Partner Portal",
    template: "%s | Partner Portal",
  },
};

export default function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div>{children}</div>;
}