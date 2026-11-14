// Stripe webhook event processing: idempotent via the webhook_event table.
// Kept free of HTTP concerns so tests can drive it directly.
import { eq } from "drizzle-orm";
import { tables, type Database } from "@code2img/db";
import type Stripe from "stripe";

export type ProcessResult = "processed" | "duplicate" | "dead-letter";

const MAX_ATTEMPTS = 5;
const GRACE_DAYS = 3;

// Effective subscription state -> user billing fields. past_due keeps Pro until
// grace expires (effectivePlan downgrades later); cancellation drops to free.
export function billingForStatus(
  status: string,
  periodEnd: Date | null,
): { plan: string; subscriptionStatus: string; periodEnd: Date | null; graceUntil: Date | null } {
  if (status === "active" || status === "trialing") {
    return { plan: "pro", subscriptionStatus: status, periodEnd, graceUntil: null };
  }
  if (status === "past_due" || status === "unpaid") {
    const grace = periodEnd ? new Date(periodEnd.getTime() + GRACE_DAYS * 86_400_000) : new Date(Date.now() + GRACE_DAYS * 86_400_000);
    return { plan: "pro", subscriptionStatus: "past_due", periodEnd, graceUntil: grace };
  }
  return { plan: "free", subscriptionStatus: "canceled", periodEnd, graceUntil: null };
}

async function applySubscription(db: Database, sub: Stripe.Subscription): Promise<void> {
  const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
  const billing = billingForStatus(sub.status, periodEnd);
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const byCustomer = eq(tables.users.stripeCustomerId, customerId);
  const updated = await db
    .update(tables.users)
    .set({ ...billing, updatedAt: new Date() })
    .where(byCustomer)
    .returning({ id: tables.users.id });
  if (updated.length === 0) {
    // Subscription without a known customer (e.g. test events): ignore, don't crash.
    return;
  }
}

export async function handleStripeEvent(db: Database, event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.userId ?? (session.client_reference_id || undefined);
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
      if (!userId || !customerId) return; // not a signed-up checkout (or no customer created)
      await db
        .update(tables.users)
        .set({ stripeCustomerId: customerId, updatedAt: new Date() })
        .where(eq(tables.users.id, userId));
      // If the checkout included a subscription, its state lands via subscription events;
      // for robustness apply Pro immediately on the completed session.
      if (session.mode === "subscription") {
        await db
          .update(tables.users)
          .set({ plan: "pro", subscriptionStatus: "active", updatedAt: new Date() })
          .where(eq(tables.users.id, userId));
      }
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await applySubscription(db, event.data.object);
      return;
    }
    default:
      return; // unhandled types are stored but do nothing
  }
}

// db is injected (tests use PGlite; the webhook route passes getDb()).
export async function processStripeEvent(db: Database, event: Stripe.Event): Promise<ProcessResult | "error"> {
  const [existing] = await db
    .select()
    .from(tables.webhookEvents)
    .where(eq(tables.webhookEvents.stripeEventId, event.id))
    .limit(1);
  if (existing?.processedAt) return "duplicate";
  if (existing?.deadLetter) return "dead-letter";
  if (!existing) {
    await db
      .insert(tables.webhookEvents)
      .values({ id: crypto.randomUUID(), stripeEventId: event.id, payload: event as unknown as Record<string, unknown> })
      .onConflictDoNothing();
  }
  try {
    await handleStripeEvent(db, event);
    await db
      .update(tables.webhookEvents)
      .set({ processedAt: new Date(), lastError: null })
      .where(eq(tables.webhookEvents.stripeEventId, event.id));
    return "processed";
  } catch (err) {
    const attempts = (existing?.retryCount ?? 0) + 1;
    const dead = attempts >= MAX_ATTEMPTS;
    await db
      .update(tables.webhookEvents)
      .set({ retryCount: attempts, lastError: (err as Error).message, deadLetter: dead })
      .where(eq(tables.webhookEvents.stripeEventId, event.id));
    // Dead-lettered events stop retrying (200 so Stripe stops); others rethrow for a 500 + Stripe retry.
    if (dead) return "dead-letter";
    throw err;
  }
}
