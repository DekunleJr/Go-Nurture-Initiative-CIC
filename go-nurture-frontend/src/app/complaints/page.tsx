import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants";
import { PageShell, MailLink } from "@/components/ui/PageShell";

export const metadata: Metadata = {
  title: "Complaints & Feedback | Go Nurture Initiative CIC",
  description:
    "How to make a complaint or give feedback to Go Nurture Initiative CIC and what happens next.",
  alternates: { canonical: "/complaints" },
};

export default function ComplaintsPage() {
  return (
    <PageShell label="FEEDBACK" title="Complaints & Feedback">
      <p>
        We welcome feedback and want to hear when something has not gone well. You can make a
        complaint about your experience of GNI by emailing{" "}
        <MailLink email={SITE_CONFIG.emails.complaints} /> or calling{" "}
        <a href={SITE_CONFIG.phoneHref} className="text-(--color-accent) hover:underline">
          {SITE_CONFIG.phone}
        </a>
        . Please tell us what happened, when it happened and how you would like us to respond, if
        you are comfortable doing so.
      </p>
      <p>
        We will acknowledge your complaint, review it fairly and explain the next steps and outcome.
        Complaints that raise safeguarding or professional concerns may need to be managed through
        additional procedures. We aim to protect confidentiality and avoid unfair treatment of
        anyone who raises a concern.
      </p>
      <p>
        If you need an alternative way to communicate with us, email{" "}
        <MailLink email={SITE_CONFIG.email} />.
      </p>
    </PageShell>
  );
}
