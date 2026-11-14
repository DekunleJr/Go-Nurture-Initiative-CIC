import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accessibility | Go Nurture Initiative CIC",
  description:
    "GNI’s accessibility commitment, adjustments and how to tell us about access needs.",
  alternates: { canonical: "/accessibility" },
};

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="pt-32 lg:pt-80 pb-16 bg-(--color-primary)">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent-light) mb-3">
            INCLUSION
          </p>
          <h1 className="font-heading text-4xl font-extrabold text-white sm:text-5xl">
            Accessibility Statement
          </h1>
        </div>
      </section>
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-6 text-(--color-text-muted) leading-relaxed">
          <p>
            Go Nurture Initiative CIC wants everyone who needs our support to be able to access it.
            Accessibility shapes how we design sessions, choose venues, publish information and run
            referral pathways.
          </p>
          <h2 className="font-heading text-2xl font-bold text-(--color-primary)">
            What we do
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Ask about language, communication, literacy, disability, cultural and practical access needs during referral</li>
            <li>Arrange interpretation, translated information and reasonable adjustments according to assessed need, availability and funding</li>
            <li>Select venues that are safe, welcoming and as accessible as possible, publishing verified details before referrals open</li>
            <li>Design this website to be usable on mobile devices and with assistive technologies</li>
          </ul>
          <h2 className="font-heading text-2xl font-bold text-(--color-primary)">
            Tell us about your access needs
          </h2>
          <p>
            If something on this website or in our services does not work for you, contact{" "}
            <a href="mailto:info@gonurtureinitiative.org.uk" className="text-(--color-accent) hover:underline">
              info@gonurtureinitiative.org.uk
            </a>{" "}
            so we can help and improve.
          </p>
        </div>
      </section>
    </div>
  );
}