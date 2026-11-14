// Signed, idempotent Stripe webhooks. Errors retry via Stripe (500) unless the
// event is dead-lettered after MAX_ATTEMPTS (then 200 to stop the retry storm).
import type Stripe from "stripe";
import { getDb } from "@code2img/db";
import { getStripe } from "@/lib/stripe";
import { processStripeEvent } from "@/lib/stripe-events";

export async function POST(req: Request) {
  const db = getDb();
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!db || !stripe || !secret) return Response.json({ error: "billing not configured" }, { status: 503 });
  const signature = req.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "missing signature" }, { status: 400 });
  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, secret);
  } catch {
    return Response.json({ error: "invalid signature" }, { status: 400 });
  }
  try {
    const result = await processStripeEvent(db, event);
    return Response.json({ result });
  } catch {
    // Not dead-lettered: let Stripe retry.
    return Response.json({ error: "processing failed, will retry" }, { status: 500 });
  }
}
