import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants";
import { PageShell, H2, MailLink } from "@/components/ui/PageShell";

export const metadata: Metadata = {
  title: "Privacy Notice | Go Nurture Initiative CIC",
  description:
    "How Go Nurture Initiative CIC collects, uses, retains and protects personal information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <PageShell label="LEGAL" title="Privacy Notice">
      <p>
        Go Nurture Initiative CIC (GNI), company number {SITE_CONFIG.companyNumber}, registered at{" "}
        {SITE_CONFIG.registeredOffice}, is committed to respecting your privacy. This notice
        explains how we handle personal information when you visit our website, make an enquiry,
        interact with our referral-led community services or use ParentConnect.
      </p>
      <H2>Information we collect</H2>
      <p>
        When you contact us, we may collect your name, contact details, organisation and the
        information in your message. When an approved referral partner refers someone to our free
        programmes, we may receive identification and safe-contact information, the referral
        source, relevant programme preferences, accessibility needs and limited information
        necessary to consider a place. For ParentConnect, we may use information needed to arrange
        voluntary employee wellbeing sessions and maintain confidential service records. We may also
        process business contact details of employers, partners and suppliers.
      </p>
      <H2>Why we use personal information</H2>
      <p>
        We use information to answer enquiries, assess referrals, arrange and deliver programmes,
        maintain appropriate safeguarding and quality records, administer contracts and
        partnerships, fulfil legal obligations and improve services. We use service providers only
        for appropriate activities and subject to suitable controls.
      </p>
      <H2>Legal grounds and sensitive information</H2>
      <p>
        We use the lawful basis appropriate to each activity, such as legitimate interests, a
        contract or legal obligations. Health and other sensitive information requires additional
        legal safeguards. Optional marketing and publicity choices are separate from programme
        participation.
      </p>
      <H2>Who we share information with</H2>
      <p>
        We share information only where necessary and lawful, including with authorised staff,
        approved technology providers and delivery professionals. Infant-feeding providers may
        receive minimum appointment details and separately explain their clinical records.
        ParentConnect session content is not routinely shared with employers. Safeguarding and legal
        disclosures may sometimes be required.
      </p>
      <H2>How we protect and retain information</H2>
      <p>
        We restrict access, apply security safeguards, and keep information only as long as law and
        our documented retention rules require. We will identify service providers and retention
        periods in the approved notice before activating sensitive forms.
      </p>
      <H2>Your rights</H2>
      <p>
        Depending on the law and circumstances, you may request access to, correction or deletion of
        your information, restrict or object to certain processing, or exercise other applicable
        rights. For a privacy enquiry or rights request, contact{" "}
        <MailLink email={SITE_CONFIG.emails.privacy} />. You may also raise concerns with the
        Information Commissioner&rsquo;s Office at{" "}
        <a
          href="https://ico.org.uk/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-(--color-accent) hover:underline"
        >
          https://ico.org.uk/
        </a>
        .
      </p>
      <H2>Website cookies and updates</H2>
      <p>
        For information about cookies, please read our{" "}
        <a href="/cookies" className="text-(--color-accent) hover:underline">
          Cookies page
        </a>
        . We will show the effective date when this notice is approved.
      </p>
    </PageShell>
  );
}
