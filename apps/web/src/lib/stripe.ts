import Stripe from "stripe";

// Test mode only (keys are placeholders in .env.example). Live mode requires a human go.
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key) : null;
}

export function stripeUnavailable() {
  return Response.json({ error: "billing not configured" }, { status: 503 });
}

// Price ids come from env (see .env.example); plan -> price lookup for checkout.
export const priceIds = () => ({
  "pro-monthly": process.env.STRIPE_PRICE_PRO_MONTHLY,
  "pro-yearly": process.env.STRIPE_PRICE_PRO_YEARLY,
});

export type CheckoutPlan = keyof ReturnType<typeof priceIds>;
