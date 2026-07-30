"use client";

import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    "pk_test_placeholder"
);

interface StripeProviderProps {
  children: React.ReactNode;
  clientSecret?: string;
}

export default function StripeProvider({
  children,
  clientSecret,
}: StripeProviderProps) {
  if (!clientSecret) return <>{children}</>;

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        locale: "en-GB",
      }}
    >
      {children}
    </Elements>
  );
}
