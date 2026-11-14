import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants";
import { PageShell, H2, MailLink } from "@/components/ui/PageShell";

export const metadata: Metadata = {
  title: "Cookies | Go Nurture Initiative CIC",
  description: "How Go Nurture Initiative CIC uses cookies and how to manage your choices.",
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return (
    <PageShell label="LEGAL" title="Cookies">
      <H2>What are cookies?</H2>
      <p>
        Cookies are small pieces of information stored on your device by websites. Some are
        necessary for pages and forms to work. Others may be used for website analytics or
        additional features.
      </p>
      <H2>Essential cookies</H2>
      <p>
        We may use essential cookies needed for website security, session management and any secure
        service areas. These do not require consent where they are strictly necessary for the
        service you request.
      </p>
      <H2>Optional cookies</H2>
      <p>
        If we use optional analytics, preferences, embedded media or marketing technologies, we will
        explain their purposes and providers before setting them. Non-essential cookies will not be
        activated until you make a choice where consent is required.
      </p>
      <H2>Your choices</H2>
      <p>
        You can accept or reject optional cookies through the website&rsquo;s cookie controls and
        change your preference later through &ldquo;Cookie preferences&rdquo; in the footer. You can
        also manage cookies using your browser settings, although this may affect some website
        functions.
      </p>
      <H2>Updates</H2>
      <p>
        The precise list of cookies, their providers and lifetimes will appear here when the
        website&rsquo;s final tools have been configured and reviewed. Questions can be sent to{" "}
        <MailLink email={SITE_CONFIG.emails.privacy} />.
      </p>
    </PageShell>
  );
}
