"use client";

import React, { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowRight, Mail, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/lib/LanguageContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ContactPage() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/contact/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to send message");
      }

      toast.success(t("contact.formSuccess"));
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 lg:pt-80 pb-20 bg-(--color-primary) overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent-light) mb-3">
              {t("contact.introLabel")}
            </p>
            <h1 className="font-heading text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl">
              {t("contact.introTitle")}{" "}
              <span className="text-(--color-accent-light)">{t("contact.introTitleHighlight")}</span>
            </h1>
            <p className="mt-6 text-lg text-white/80 max-w-2xl">
              {t("contact.introDesc")}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Details + Form */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Left: Info */}
            <div>
              <div className="space-y-8">
                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-(--color-accent)/10 text-(--color-accent)">
                    <Mail size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{t("contact.email")}</p>
                    <a href="mailto:info@gonurture.org" className="text-(--color-accent) hover:underline">
                      {t("contact.emailValue")}
                    </a>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-(--color-accent)/10 text-(--color-accent)">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{t("contact.location")}</p>
                    <p className="text-(--color-text-muted)">{t("contact.locationValue")}</p>
                  </div>
                </div>
              </div>

              {/* Partner CTA */}
              <div className="mt-12 rounded-2xl bg-(--color-bg-sage) p-8">
                <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent) mb-2">
                  {t("contact.ctaLabel")}
                </p>
                <h3 className="font-heading text-xl font-bold text-(--color-primary) mb-3">
                  {t("contact.ctaTitle")}
                </h3>
                <p className="text-sm text-(--color-text-muted) mb-6">
                  {t("contact.ctaDesc")}
                </p>
                <Link href="/portal/login">
                  <Button variant="accent" size="md">
                    {t("contact.ctaButton")}
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: Form */}
            <div className="rounded-2xl border border-(--color-border) bg-background p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent) mb-2">
                {t("contact.partnerLabel")}
              </p>
              <h3 className="font-heading text-2xl font-bold text-(--color-primary) mb-6">
                {t("contact.partnerTitle")}
              </h3>
              <p className="text-sm text-(--color-text-muted) mb-8">
                {t("contact.partnerDesc")}
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {t("contact.formName")}
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-(--color-border) px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:border-transparent"
                    placeholder={t("contact.formName")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {t("contact.formEmail")}
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-(--color-border) px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:border-transparent"
                    placeholder={t("contact.formEmail")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {t("contact.formSubject")}
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-(--color-border) px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:border-transparent"
                    placeholder={t("contact.formSubjectPlaceholder")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {t("contact.formMessage")}
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-(--color-border) px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:border-transparent resize-none"
                    placeholder={t("contact.formMessagePlaceholder")}
                  />
                </div>
                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    t("contact.formSubmit")
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}