// Stripe Checkout: monthly or yearly Pro. Test mode only (live = human go).
import { getDb } from "@code2img/db";
import { currentUserFor, serviceUnavailable } from "@/lib/session";
import { getStripe, priceIds, stripeUnavailable, type CheckoutPlan } from "@/lib/stripe";

export async function POST(req: Request) {
  const db = getDb();
  if (!db) return serviceUnavailable();
  const stripe = getStripe();
  if (!stripe) return stripeUnavailable();
  const user = await currentUserFor(req);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { plan } = (await req.json().catch(() => ({}))) as { plan?: CheckoutPlan };
  const price = plan && priceIds()[plan];
  if (!price) return Response.json({ error: "plan must be 'pro-monthly' or 'pro-yearly'" }, { status: 400 });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    client_reference_id: user.id,
    metadata: { userId: user.id },
    customer: user.stripeCustomerId ?? undefined,
    customer_creation: user.stripeCustomerId ? undefined : "always",
    automatic_tax: { enabled: false },
    allow_promotion_codes: true,
    managed_payments: { enabled: false },
    success_url: `${process.env.APP_URL ?? "http://localhost:3335"}/dashboard?upgraded=1`,
    cancel_url: `${process.env.APP_URL ?? "http://localhost:3335"}/dashboard`,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
  return Response.json({ url: session.url });
}
