import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants";
import TransparencyContent from "@/components/transparency/TransparencyContent";

export const metadata: Metadata = {
  title: "Transparency | Go Nurture Initiative CIC",
  description: `See how ${SITE_CONFIG.name} uses funds to support women in Norfolk.`,
  alternates: {
    canonical: "/transparency",
  },
  openGraph: {
    title: "Transparency | Go Nurture Initiative CIC",
    description: `See how ${SITE_CONFIG.name} uses funds to support women in Norfolk.`,
    url: "/transparency",
  },
};

export default function TransparencyPage() {
  return <TransparencyContent />;
}
