import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants";
import { PageShell, H2, ButtonLink, MailLink } from "@/components/ui/PageShell";

export const metadata: Metadata = {
  title: "ParentConnect | Go Nurture Initiative CIC",
  description:
    "ParentConnect is GNI's employer-supported parental-leave wellbeing service: voluntary, confidential remote check-ins and signposting for employees.",
  alternates: { canonical: "/parentconnect" },
};

export default function ParentConnectPage() {
  return (
    <PageShell label="PARENTCONNECT" title="Parental wellbeing support for employers">
      <p>
        ParentConnect is GNI&rsquo;s employer-supported parental-leave wellbeing service, designed
        to help organisations offer thoughtful, practical support to employees navigating maternity,
        paternity and other parental transitions.
      </p>
      <p>
        Through voluntary, confidential remote wellbeing check-ins and helpful signposting,
        ParentConnect creates space for parents to feel heard and supported through leave and their
        return to work.
      </p>

      <H2>Support that respects employees</H2>
      <p>
        ParentConnect is delivered within clear professional and confidentiality boundaries.
        Participation is voluntary, and employers do not receive private wellbeing conversations or
        individual health information.
      </p>

      <H2>Explore ParentConnect for your organisation</H2>
      <p>
        We welcome enquiries from employers interested in providing ParentConnect as an employee
        wellbeing benefit. Please contact our ParentConnect team for information about the service,
        availability and tailored options for your organisation.
      </p>
      <p>
        Email: <MailLink email={SITE_CONFIG.emails.parentconnect} />
        <br />
        Telephone: <a href={SITE_CONFIG.phoneHref} className="text-(--color-accent) hover:underline">{SITE_CONFIG.phone}</a>
      </p>
      <div>
        <ButtonLink href={`mailto:${SITE_CONFIG.emails.parentconnect}`}>Contact ParentConnect</ButtonLink>
      </div>
    </PageShell>
  );
}
