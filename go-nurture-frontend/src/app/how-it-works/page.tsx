import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants";
import { HowItWorksContent } from "@/components/how-it-works/HowItWorksContent";

export const metadata: Metadata = {
  title: "How It Works",
  description: `Learn how ${SITE_CONFIG.name} supports women in Norfolk through a referral-led, culturally adapted perinatal education model.`,
  alternates: {
    canonical: "/how-it-works",
  },
  openGraph: {
    title: "How It Works | Go Nurture Initiative CIC",
    description: `Learn how ${SITE_CONFIG.name} supports women in Norfolk through a referral-led, culturally adapted perinatal education model.`,
    url: "/how-it-works",
  },
};

export default function HowItWorksPage() {
  return <HowItWorksContent />;
}