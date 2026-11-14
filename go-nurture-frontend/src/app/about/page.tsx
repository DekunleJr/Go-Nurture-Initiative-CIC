import { PageShell, H2, H3 } from "@/components/ui/PageShell";

export default function AboutPage() {
  return (
    <PageShell label="ABOUT US" title="Who we are">
      <p>
        Go Nurture Initiative CIC is an independent community interest company based in Norwich,
        working across Norfolk to improve access to pregnancy, birth and early-parenthood education
        and support.
      </p>

      <H2>Our vision</H2>
      <p>
        To cultivate a society where every mother&mdash;regardless of her background, race or legal
        status&mdash;experiences a safe, informed, dignified and supported transition into
        motherhood.
      </p>

      <H2>Our mission</H2>
      <p>
        To provide free, culturally responsive and evidence-informed antenatal education and
        infant-feeding support through trusted referral and community partnerships; to strengthen
        women&rsquo;s knowledge, autonomy and peer connection; and to sustain that community purpose
        through ethical trading and responsible sponsorship.
      </p>

      <H2>Our values</H2>
      <div className="space-y-4">
        <div>
          <H3>Faith &amp; Beliefs</H3>
          <p>
            We respect the beliefs, cultures and choices of every family. Participation is open to
            people of every faith or none.
          </p>
        </div>
        <div>
          <H3>Growth &amp; Improvement</H3>
          <p>We listen, learn and improve through evidence, experience and feedback.</p>
        </div>
        <div>
          <H3>Relationships &amp; Community</H3>
          <p>
            We build trust, community connections and partnerships so families can access
            meaningful support.
          </p>
        </div>
      </div>

      <H2>Our people</H2>
      <p>
        We are a team of community members and professionals united by a commitment to equitable
        maternal and infant wellbeing. Our education and support are planned and delivered by
        appropriately qualified antenatal educators, trained facilitators and competent
        infant-feeding professionals, supported by people with experience in nursing, midwifery,
        community engagement, safeguarding, administration and governance. We value lived
        experience, cultural understanding, professional standards and respectful, evidence-informed
        care.
      </p>
    </PageShell>
  );
}
