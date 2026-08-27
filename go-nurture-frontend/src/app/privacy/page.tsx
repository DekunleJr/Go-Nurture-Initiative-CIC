import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Notice | Go Nurture Initiative CIC",
  description:
    "How Go Nurture Initiative CIC collects, uses, retains and protects personal information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="pt-32 lg:pt-80 pb-16 bg-(--color-primary)">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent-light) mb-3">
            LEGAL
          </p>
          <h1 className="font-heading text-4xl font-extrabold text-white sm:text-5xl">
            Privacy Notice
          </h1>
        </div>
      </section>
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-6 text-(--color-text-muted) leading-relaxed">
          <p className="rounded-xl bg-(--color-bg-sage) p-4 text-sm">
            Draft notice — to be reviewed and approved (including by GNI&apos;s legal advisers)
            before the website is made publicly accessible.
          </p>
          <p>
            Go Nurture Initiative CIC respects your privacy and is committed to protecting your
            personal information. This notice explains what information we collect through this
            website and our referral process, why we collect it, how long we keep it, who we share
            it with and the rights you have over your data.
          </p>
          <h2 className="font-heading text-2xl font-bold text-(--color-primary)">
            What we collect
          </h2>
          <p>
            We collect information you provide directly — such as your name and email address when
            you use our contact form or donate — and information provided with consent by referral
            partners about participants, including contact details, expected due date, language and
            communication needs, interpreter requirements and consent confirmations.
          </p>
          <h2 className="font-heading text-2xl font-bold text-(--color-primary)">
            Why we use it
          </h2>
          <p>
            To respond to enquiries, deliver our programmes safely, meet safeguarding and legal
            obligations, process donations and improve our services. Referral information is used
            only to assess eligibility and deliver support.
          </p>
          <h2 className="font-heading text-2xl font-bold text-(--color-primary)">
            Your rights
          </h2>
          <p>
            You have rights over your personal information under UK data protection law, including
            access, correction, restriction and objection. To exercise these rights, contact{" "}
            <a href="mailto:info@gonurture.org" className="text-(--color-accent) hover:underline">
              info@gonurture.org
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}