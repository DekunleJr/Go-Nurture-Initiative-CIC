import { SITE_CONFIG } from "@/lib/constants";
import { PageShell, H2, ButtonLink, MailLink } from "@/components/ui/PageShell";

export default function ProgrammesPage() {
  return (
    <PageShell label="OUR PROGRAMMES" title="Free support for pregnancy and early parenthood">
      <H2>Free Antenatal Education</H2>
      <p>
        Our six-week antenatal education programme offers a supportive space to learn about
        pregnancy, birth preparation, informed choices, wellbeing, newborn care and the early days
        at home. Sessions bring together practical knowledge and peer connection.
      </p>
      <p>
        We plan three small-group cohorts in our first year. Dates, locations and places will be
        announced when available.
      </p>

      <H2>Infant-Feeding Support</H2>
      <p>
        Our group infant-feeding clinics offer practical guidance, encouragement and opportunities
        to ask questions about breastfeeding and infant feeding. Clinics will be supported by
        appropriately competent professionals. We plan twelve clinics in our first year.
      </p>

      <H2>How to access free programmes</H2>
      <p>
        Places are offered through approved referral partners to women and families experiencing
        barriers to suitable support. If you think you may benefit, ask a community organisation,
        healthcare professional or family-support service whether they can refer you.
      </p>
      <p>
        Referral partners can request information at <MailLink email={SITE_CONFIG.emails.partnerships} />.
        Referral arrangements and programme opening dates will be shared with approved partners once
        confirmed.
      </p>

      <H2>Become a Referral Partner</H2>
      <p>
        We welcome community groups, churches, mosques, temples, other faith communities, charities
        and healthcare organisations. Becoming a referral partner is free, with no sponsorship or
        minimum referral obligation.
      </p>
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/referrals">Become a Referral Partner</ButtonLink>
        <ButtonLink href="/portal/login" variant="outline">
          Submit a Referral
        </ButtonLink>
      </div>
    </PageShell>
  );
}
