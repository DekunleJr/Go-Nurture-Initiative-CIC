import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants";
import { PageShell, H2, ButtonLink, Notice } from "@/components/ui/PageShell";

export const metadata: Metadata = {
  title: "Referrals | Go Nurture Initiative CIC",
  description:
    "How approved community, faith, voluntary and healthcare organisations can refer women to GNI's free antenatal education and infant-feeding support.",
  alternates: { canonical: "/referrals" },
};

export default function ReferralsPage() {
  return (
    <PageShell label="REFERRALS" title="Helping women access free support">
      <p>
        Our community programmes are offered through trusted referrals from approved community,
        faith, voluntary and healthcare organisations. Referral partners help connect eligible
        pregnant women and new mothers with appropriate education and infant-feeding support.
      </p>

      <H2>Become a Referral Partner</H2>
      <p>
        We welcome churches, mosques, temples, gurdwaras, synagogues, community groups, charities
        and healthcare organisations serving women and families across Norwich and Norfolk. There is
        no joining fee, sponsorship requirement or minimum referral commitment.
      </p>
      <p>
        To become a referral partner, email {SITE_CONFIG.emails.partnerships} with your
        organisation name, contact person and a brief description of the communities you support.
        We will provide the referral information and next steps.
      </p>
      <div>
        <ButtonLink href={`mailto:${SITE_CONFIG.emails.partnerships}`}>
          Become a Referral Partner — {SITE_CONFIG.emails.partnerships}
        </ButtonLink>
      </div>

      <H2>Submit a Referral</H2>
      <p>
        Already an approved GNI referral partner? Submit an eligible woman or family through our
        secure referral portal. The form will be available to authorised partner contacts once
        enrolment opens.
      </p>
      <div>
        <ButtonLink href="/portal/login" variant="outline">
          Submit a Referral — Approved Partner Form
        </ButtonLink>
      </div>
      <p>
        A referral does not guarantee a place. GNI reviews eligibility, suitability and available
        capacity, then contacts the woman using her agreed safe contact method. Please do not email
        personal health details or immigration information.
      </p>

      <H2>Our referral process</H2>
      <ol className="list-decimal space-y-2 pl-5">
        <li>A community organisation becomes an approved referral partner.</li>
        <li>The partner discusses the programme and information sharing with the woman.</li>
        <li>The partner submits the secure referral form.</li>
        <li>GNI reviews the referral and confirms the next steps.</li>
      </ol>

      <Notice>
        GNI does not replace NHS maternity or emergency services. For an emergency, call 999. For
        urgent pregnancy or postnatal concerns, contact your local maternity team.
      </Notice>
    </PageShell>
  );
}
