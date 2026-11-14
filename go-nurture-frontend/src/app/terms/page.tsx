import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants";
import { PageShell, H2, MailLink } from "@/components/ui/PageShell";

export const metadata: Metadata = {
  title: "Website Terms | Go Nurture Initiative CIC",
  description: "Terms of use for the Go Nurture Initiative CIC website.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <PageShell label="LEGAL" title="Website Terms">
      <H2>About this website</H2>
      <p>
        This website is operated by Go Nurture Initiative CIC, a community interest company
        registered in England and Wales under company number {SITE_CONFIG.companyNumber}. It
        explains our mission, planned programmes and ways to contact or support us.
      </p>
      <H2>Use of information</H2>
      <p>
        Information on this site is provided for general education and awareness. It does not
        create a professional-client relationship, constitute a diagnosis or replace care from your
        own healthcare professionals. You should not rely on website content as a substitute for
        individual clinical advice.
      </p>
      <H2>Programme availability</H2>
      <p>
        Our free community programmes are referral-led. Programme descriptions are not a promise of
        immediate availability or an offer to enrol without eligibility review. Places, dates,
        venues, staffing and support arrangements depend on confirmed resources and appropriate
        agreements. GNI may revise its planned activities and will communicate material changes
        when relevant.
      </p>
      <H2>ParentConnect and sponsorship</H2>
      <p>
        ParentConnect information is introductory. Availability, service scope, eligibility, fees
        and terms are provided privately to interested employers and confirmed only through a
        separate written agreement. Information about supporting or sponsoring GNI is an invitation
        to enquire; a donation or expression of interest does not create a service entitlement or
        grant control over programme places.
      </p>
      <H2>Copyright and links</H2>
      <p>
        Unless stated otherwise, written and visual materials on this website are owned by GNI or
        used with permission. Please request permission before reproducing substantial content for
        commercial use. External links are offered for convenience; we do not control external
        websites or endorse all their content.
      </p>
      <H2>Website availability and changes</H2>
      <p>
        We aim to provide a reliable, accurate and accessible site, but cannot guarantee
        uninterrupted access or that every page is free of error. We may update content and these
        terms. Nothing in these terms removes rights that cannot lawfully be excluded.
      </p>
      <H2>Contact</H2>
      <p>
        For questions about this website, email <MailLink email={SITE_CONFIG.email} /> or telephone{" "}
        {SITE_CONFIG.phone}.
      </p>
    </PageShell>
  );
}
