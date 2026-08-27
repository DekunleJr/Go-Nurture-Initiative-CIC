import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Safeguarding | Go Nurture Initiative CIC",
  description:
    "GNI’s safeguarding commitments and how to raise a safeguarding concern.",
  alternates: { canonical: "/safeguarding" },
};

export default function SafeguardingPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="pt-32 lg:pt-80 pb-16 bg-(--color-primary)">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent-light) mb-3">
            SAFETY
          </p>
          <h1 className="font-heading text-4xl font-extrabold text-white sm:text-5xl">
            Safeguarding Statement
          </h1>
        </div>
      </section>
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-6 text-(--color-text-muted) leading-relaxed">
          <p>
            The safety and wellbeing of women, children and families is central to everything Go
            Nurture Initiative CIC does.
          </p>
          <h2 className="font-heading text-2xl font-bold text-(--color-primary)">
            Our commitments
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Maintain a written safeguarding policy with clear reporting lines and designated responsibilities</li>
            <li>Apply appropriate recruitment checks and training for team members and volunteers</li>
            <li>Require explicit, documented consent for referrals involving personal information</li>
            <li>Work within clear service boundaries alongside NHS and statutory partners</li>
          </ul>
          <h2 className="font-heading text-2xl font-bold text-(--color-primary)">
            Raising a concern
          </h2>
          <p>
            If you are worried about the immediate safety of a child or adult, call 999. For
            non-emergencies, contact NHS 111, your local authority safeguarding team, or raise a
            concern with GNI at{" "}
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