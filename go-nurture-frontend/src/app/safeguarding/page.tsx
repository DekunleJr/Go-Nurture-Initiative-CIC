import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants";
import { PageShell, H2, H3, MailLink, Notice } from "@/components/ui/PageShell";

export const metadata: Metadata = {
  title: "Safeguarding | Go Nurture Initiative CIC",
  description:
    "GNI’s safeguarding commitments, how to raise a safeguarding concern and independent Norfolk safeguarding routes.",
  alternates: { canonical: "/safeguarding" },
};

export default function SafeguardingPage() {
  return (
    <PageShell label="SAFETY" title="Safeguarding">
      <H2>Our commitment</H2>
      <p>
        Go Nurture Initiative CIC is committed to protecting the safety, dignity and wellbeing of
        women, babies, families and everyone involved in our activities. Safeguarding is a shared
        responsibility. We work to prevent harm and respond carefully and promptly when concerns
        arise.
      </p>

      <H2>How we work safely</H2>
      <p>
        Our personnel and delivery partners are expected to respect professional boundaries, keep
        information confidential within lawful limits, recognise possible signs of abuse or
        exploitation and follow GNI safeguarding and incident-reporting arrangements. Roles,
        supervision and safeguarding checks are appropriate to the work undertaken. No one is
        required to discuss sensitive experiences publicly or with other participants.
      </p>

      <H2>Raising a safeguarding concern</H2>
      <p>
        To raise a safeguarding concern relating to GNI, email{" "}
        <MailLink email={SITE_CONFIG.emails.safeguarding} />. GNI&rsquo;s Designated Safeguarding
        Lead is Favour Oloye. You can also telephone GNI on{" "}
        <a href={SITE_CONFIG.phoneHref} className="text-(--color-accent) hover:underline">
          {SITE_CONFIG.phone}
        </a>
        . Do not rely on email when someone is in immediate danger: call 999.
      </p>

      <H2>What happens next</H2>
      <p>
        We take concerns seriously. Information is handled discreetly and shared only as necessary
        for safety, professional responsibilities or legal requirements. Where appropriate, we may
        involve relevant safeguarding authorities. We cannot guarantee complete confidentiality
        where sharing is necessary to protect someone.
      </p>

      <H2>Independent concerns</H2>
      <p>
        If the concern involves GNI leadership or you would prefer an external safeguarding route,
        you may report it directly to the relevant Norfolk service below. You do not need
        permission from GNI to contact statutory safeguarding services.
      </p>

      <H3>Emergency danger — 999</H3>
      <p>
        If someone is in immediate danger, call 999. For urgent pregnancy or postnatal concerns,
        contact your local maternity team.
      </p>

      <H3>Safeguarding concerns about a child</H3>
      <p>
        Norfolk County Council:{" "}
        <a href="tel:03448008020" className="text-(--color-accent) hover:underline">0344 800 8020</a>{" "}
        (members of the public). Professionals working with children can use the Children&rsquo;s
        Advice and Duty Service:{" "}
        <a href="tel:03448008021" className="text-(--color-accent) hover:underline">0344 800 8021</a>.
      </p>

      <H3>Safeguarding concerns about an adult at risk</H3>
      <p>
        Norfolk County Council Adult Social Services:{" "}
        <a href="tel:03448008020" className="text-(--color-accent) hover:underline">0344 800 8020</a>.
      </p>

      <H3>Concerns about someone working or volunteering with children</H3>
      <p>
        Norfolk Local Authority Designated Officer (LADO): <MailLink email="LADO@norfolk.gov.uk" />.
        The LADO route is for allegations about adults who work or volunteer with children, rather
        than the general route for every safeguarding concern. See the official{" "}
        <a
          href="https://www.norfolklscb.org/people-working-with-children/how-to-raise-a-concern/local-authority-designated-officer-lado/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-(--color-accent) hover:underline"
        >
          Norfolk Safeguarding Children Partnership LADO referral guidance
        </a>
        .
      </p>

      <Notice>
        Outside Norfolk, contact the local authority safeguarding service in the relevant area; call
        999 for immediate danger.
      </Notice>
    </PageShell>
  );
}
