"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import StripeProvider from "./StripeProvider";
import { api } from "@/lib/api-client";

interface Donation {
  id: string;
  amount: number;
  donor_name: string;
  message: string;
  is_anonymous: boolean;
  created_at: string;
}

function DonationForm({
  onIntentCreated,
}: {
  onIntentCreated: (clientSecret: string, donationId: string) => void;
}) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState("25");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const data = await api.post<{ client_secret: string; donation_id: string }>("/api/donations/create-payment-intent", {
          amount: parseFloat(amount),
          donor_name: anonymous ? "Anonymous" : name,
          donor_email: email || null,
          message: message || null,
          is_anonymous: anonymous,
      });
      console.log("[DonationForm] PaymentIntent created:", { donationId: data.donation_id, hasSecret: !!data.client_secret });
      onIntentCreated(data.client_secret, data.donation_id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      console.error("[DonationForm] Error:", msg);
      setError(msg);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-(--color-primary) mb-2">
          {t("transparency.amountLabel")}
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t("transparency.amountPlaceholder")}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-(--color-accent) focus:outline-none"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-(--color-primary) mb-2">
          {t("transparency.nameLabel")}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("transparency.namePlaceholder")}
          disabled={anonymous}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-(--color-accent) focus:outline-none disabled:bg-gray-100"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-(--color-primary) mb-2">
          {t("transparency.emailLabel")}
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("transparency.emailPlaceholder")}
          disabled={anonymous}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-(--color-accent) focus:outline-none disabled:bg-gray-100"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-(--color-primary) mb-2">
          {t("transparency.messageLabel")}
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("transparency.messagePlaceholder")}
          rows={3}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-(--color-accent) focus:outline-none"
        />
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={anonymous}
          onChange={(e) => setAnonymous(e.target.checked)}
          className="rounded border-gray-300"
        />
        <span className="text-sm text-(--color-text-muted)">
          {t("transparency.anonymousLabel")}
        </span>
      </label>

      {error && <div className="text-red-700 text-sm">{error}</div>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-(--color-accent) px-8 py-4 text-base font-semibold text-white shadow-lg shadow-(--color-accent)/30 transition-all hover:bg-(--color-accent-light) hover:shadow-xl hover:shadow-(--color-accent)/40 disabled:opacity-50"
      >
        {submitting ? t("transparency.processing") : t("transparency.donateButton")}
      </button>
    </form>
  );
}

function CheckoutForm({
  donationId,
  onSuccess,
}: {
  clientSecret: string;
  donationId: string;
  onSuccess?: () => void;
}) {
  const { t } = useLanguage();
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrorMsg(null);

    if (!stripe || !elements) {
      setErrorMsg(t("transparency.paymentNotReady"));
      setProcessing(false);
      return;
    }

    const returnUrl = new URL(window.location.href);
    returnUrl.searchParams.set("donation_id", donationId);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl.toString() },
    });

    if (error) {
      console.error("[CheckoutForm] Stripe confirmPayment error:", error.message, error);
      setErrorMsg(error.message || t("transparency.paymentFailed"));
      setProcessing(false);
    } else {
      console.log("[CheckoutForm] Payment confirmed successfully, calling onSuccess");
      if (onSuccess) {
        onSuccess();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {errorMsg && <div className="text-red-700 text-sm">{errorMsg}</div>}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full rounded-xl bg-(--color-accent) px-8 py-4 text-base font-semibold text-white shadow-lg shadow-(--color-accent)/30 transition-all hover:bg-(--color-accent-light) hover:shadow-xl hover:shadow-(--color-accent)/40 disabled:opacity-50"
      >
        {processing ? t("transparency.processing") : t("transparency.payNow")}
      </button>
    </form>
  );
}

export default function TransparencyContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [total, setTotal] = useState<number | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [donationId, setDonationId] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ total: number }>("/api/donations/total")
      .then((data: { total: number }) => setTotal(data.total))
      .catch(() => {});
    api.get<Donation[]>("/api/donations/")
      .then((data: Donation[]) => setDonations(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleIntentCreated = (secret: string, id: string) => {
    setClientSecret(secret);
    setDonationId(id);
  };

  const confirmDonation = useCallback(async (id: string) => {
    try {
      console.log("[Transparency] Confirming donation:", id);
      await api.post(`/api/donations/confirm/${id}`);

      console.log("[Transparency] Donation confirmed successfully:", id);
      setSuccess(true);
      setClientSecret(null);
      setDonationId(null);

      const updated = await api.get<Donation[]>("/api/donations/");
      setDonations(updated);
      const totalRes = await api.get<{ total: number }>("/api/donations/total");
      setTotal(totalRes.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      console.error("[Transparency] Confirmation error:", message);
      setError(message);
    }
  }, []);

  useEffect(() => {
    const paymentIntent = searchParams.get("payment_intent");
    const urlDonationId = searchParams.get("donation_id");
    const redirectStatus = searchParams.get("redirect_status");

    if (paymentIntent && redirectStatus === "succeeded" && urlDonationId) {
      setTimeout(() => confirmDonation(urlDonationId), 0);
    }
  }, [searchParams, confirmDonation]);

  const handleSuccess = useCallback(() => {
    if (donationId) confirmDonation(donationId);
  }, [donationId, confirmDonation]);

  const Wrapper = useMemo(() => clientSecret ? StripeProvider : React.Fragment, [clientSecret]);
  const wrapperProps = clientSecret ? { clientSecret: clientSecret || undefined } : {};

  return (
    <Wrapper {...wrapperProps}>
      <section className="relative pt-32 lg:pt-80 pb-20 bg-(--color-primary) overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent-light) mb-3">
            {t("transparency.introLabel")}
          </p>
          <h1 className="font-heading text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl">
            {t("transparency.introTitle")}
          </h1>
          <p className="mt-6 text-lg text-white/80 max-w-2xl">
            {t("transparency.introDesc")}
          </p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl mb-6">
                {t("transparency.legalStatusTitle")}
              </h2>
              <p className="text-(--color-text-muted) leading-relaxed mb-10">
                {t("transparency.legalStatusDesc")}
              </p>

              <h3 className="font-heading text-2xl font-bold text-(--color-primary) mb-4">
                {t("transparency.fundingTitle")}
              </h3>
              <p className="text-(--color-text-muted) leading-relaxed mb-6">
                {t("transparency.fundingDesc")}
              </p>
              <ul className="mb-10 space-y-3">
                {[
                  "transparency.fundingItem1",
                  "transparency.fundingItem2",
                  "transparency.fundingItem3",
                  "transparency.fundingItem4",
                ].map((key) => (
                  <li key={key} className="flex items-start gap-3 rounded-xl bg-(--color-bg-sage) p-4">
                    <Check size={16} className="mt-1 shrink-0 text-(--color-accent)" />
                    <span className="text-sm leading-relaxed text-foreground">{t(key)}</span>
                  </li>
                ))}
              </ul>

              <h3 className="font-heading text-2xl font-bold text-(--color-primary) mb-4">
                {t("transparency.useFundsTitle")}
              </h3>
              <ul className="space-y-3">
                {[
                  "transparency.useFundsItem1",
                  "transparency.useFundsItem2",
                  "transparency.useFundsItem3",
                  "transparency.useFundsItem4",
                ].map((key) => (
                  <li key={key} className="flex items-start gap-3 rounded-xl bg-(--color-bg-sage) p-4">
                    <Check size={16} className="mt-1 shrink-0 text-(--color-accent)" />
                    <span className="text-sm leading-relaxed text-foreground">{t(key)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl mb-4">
                {t("transparency.formTitle")}
              </h2>
              <p className="text-(--color-text-muted) mb-8">{t("transparency.formDesc")}</p>

              {success && (
                <div className="mb-6 rounded-xl bg-green-50 p-4 text-green-700">
                  {t("transparency.donationSuccess")}
                </div>
              )}

              {error && (
                <div className="mb-6 rounded-xl bg-red-50 p-4 text-red-700">
                  {error}
                </div>
              )}

              {!clientSecret ? (
                <DonationForm onIntentCreated={handleIntentCreated} />
              ) : (
                <div className="rounded-2xl border border-gray-200 p-6">
                  <p className="mb-4 text-sm text-(--color-text-muted)">
                    {t("transparency.completeSecurely")}
                  </p>
                  <CheckoutForm
                    clientSecret={clientSecret}
                    donationId={donationId!}
                    onSuccess={handleSuccess}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Donation Statement & Reporting */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-(--color-bg-sage) p-8">
            <h2 className="font-heading text-2xl font-bold text-(--color-primary) mb-4">
              {t("transparency.donationStatementTitle")}
            </h2>
            <p className="text-sm leading-relaxed text-(--color-text-muted) mb-8">
              {t("transparency.donationStatementDesc")}
            </p>
            <h2 className="font-heading text-2xl font-bold text-(--color-primary) mb-4">
              {t("transparency.reportingTitle")}
            </h2>
            <p className="text-sm leading-relaxed text-(--color-text-muted)">
              {t("transparency.reportingDesc")}
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-(--color-bg-sage)">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl mb-12 text-center">
            {t("transparency.recentSupport")}
          </h2>

          {loading ? (
            <p className="text-center text-(--color-text-muted)">{t("transparency.loading")}</p>
          ) : donations.length === 0 ? (
            <p className="text-center text-(--color-text-muted)">{t("transparency.noDonations")}</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {donations.slice(0, 6).map((donation) => (
                <div key={donation.id} className="bg-white rounded-2xl p-6 shadow-sm">
                  <p className="font-heading text-xl font-bold text-(--color-primary)">
                    £{donation.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-(--color-text-muted) mt-1">
                    {donation.is_anonymous ? t("transparency.anonymousDonor") : donation.donor_name}
                  </p>
                  {donation.message && (
                    <p className="text-sm text-(--color-text-muted) mt-2 italic">“{donation.message}”</p>
                  )}
                  <p className="text-xs text-(--color-text-muted) mt-2">
                    {new Date(donation.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Wrapper>
  );
}