import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Complaints | Go Nurture Initiative CIC",
  description:
    "How to make a complaint to Go Nurture Initiative CIC and what happens next.",
  alternates: { canonical: "/complaints" },
};

export default function ComplaintsPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="pt-32 lg:pt-80 pb-16 bg-(--color-primary)">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent-light) mb-3">
            FEEDBACK
          </p>
          <h1 className="font-heading text-4xl font-extrabold text-white sm:text-5xl">
            Complaints Procedure
          </h1>
        </div>
      </section>
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-6 text-(--color-text-muted) leading-relaxed">
          <p>
            Feedback and complaints help us improve. We treat every complaint seriously,
            confidentially and without prejudice to anyone raising it.
          </p>
          <h2 className="font-heading text-2xl font-bold text-(--color-primary)">
            How to complain
          </h2>
          <p>
            Email{" "}
            <a href="mailto:info@gonurture.org" className="text-(--color-accent) hover:underline">
              info@gonurture.org
            </a>{" "}
            with &ldquo;Complaint&rdquo; in the subject line, describing what happened and what
            outcome you are seeking. Please do not include detailed medical information in this
            general channel unless we ask for it.
          </p>
          <h2 className="font-heading text-2xl font-bold text-(--color-primary)">
            What happens next
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>We acknowledge complaints promptly and explain next steps</li>
            <li>A named person reviews the complaint fairly and independently where possible</li>
            <li>We respond within the timescales set out in our full complaints policy</li>
            <li>You may escalate concerns to relevant external bodies where appropriate</li>
          </ul>
        </div>
      </section>
    </div>
  );
}