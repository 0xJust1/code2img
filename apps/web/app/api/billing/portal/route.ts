// Stripe Customer Portal (cancel / update payment method / invoices).
import { getDb } from "@code2img/db";
import { currentUserFor, serviceUnavailable } from "@/lib/session";
import { getStripe, stripeUnavailable } from "@/lib/stripe";

export async function POST(req: Request) {
  const db = getDb();
  if (!db) return serviceUnavailable();
  const stripe = getStripe();
  if (!stripe) return stripeUnavailable();
  const user = await currentUserFor(req);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!user.stripeCustomerId) return Response.json({ error: "no stripe customer yet — subscribe first" }, { status: 400 });
  const base = process.env.APP_URL ?? "http://localhost:3335";
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${base}/dashboard`,
  });
  return Response.json({ url: session.url });
}
