import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants";
import { PageShell, H2, ButtonLink, MailLink, Notice } from "@/components/ui/PageShell";

export const metadata: Metadata = {
  title: "Support Us | Go Nurture Initiative CIC",
  description:
    "Help women and families overcome barriers to accessible, culturally responsive perinatal education and infant-feeding support.",
  alternates: { canonical: "/support-us" },
};

export default function SupportUsPage() {
  return (
    <PageShell label="SUPPORT US" title="Support our work">
      <p>
        Your support helps women and families overcome barriers to accessible, culturally
        responsive perinatal education and infant-feeding support.
      </p>

      <H2>Make a donation</H2>
      <p>
        Contributions can help provide learning resources, suitable community venues, access
        support and the practical resources required to deliver free programmes.
      </p>
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/transparency">Donate online</ButtonLink>
        <ButtonLink href={`mailto:${SITE_CONFIG.emails.funding}`} variant="outline">
          Support Our Work — {SITE_CONFIG.emails.funding}
        </ButtonLink>
      </div>

      <H2>Sponsor a programme</H2>
      <p>
        Businesses and organisations can help fund antenatal education cohorts, infant-feeding
        clinics, reusable teaching resources and community access costs.
      </p>
      <div>
        <ButtonLink href={`mailto:${SITE_CONFIG.emails.partnerships}`} variant="outline">
          Explore Sponsorship — {SITE_CONFIG.emails.partnerships}
        </ButtonLink>
      </div>

      <H2>Other ways to support GNI</H2>
      <p>
        You can introduce us to community groups, support referral connections, help identify
        accessible venues or share information about our work.
      </p>
      <p>
        Get in touch: <MailLink email={SITE_CONFIG.email} />
      </p>

      <Notice>
        Go Nurture Initiative CIC is a community interest company, not a registered charity.
        Contributions are not eligible for Gift Aid.
      </Notice>
    </PageShell>
  );
}
