import { beforeAll, describe, expect, it } from "vitest";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { createTestDb, tables, type Database } from "@code2img/db";
import { billingForStatus, handleStripeEvent, processStripeEvent } from "../src/lib/stripe-events";
import { getStripe } from "../src/lib/stripe";

const db = await createTestDb();
// PGlite and postgres-js share the drizzle PgDatabase API used here; one cast, test-side.
const prod = db as unknown as Database;
const userId = "u_test_1";
const customerId = "cus_test_1";

function evt(type: Stripe.Event["type"], data: unknown, id = `evt_${Math.random().toString(36).slice(2)}`): Stripe.Event {
  return { id, type, data: { object: data }, object: "event", api_version: "2024-12-18.acacia", created: 0, livemode: false, pending_webhooks: 0, request: null } as unknown as Stripe.Event;
}

beforeAll(async () => {
  await db.insert(tables.users).values({ id: userId, email: "t@example.com", name: "T" });
});

describe("billingForStatus", () => {
  it("maps statuses to plans with grace on past_due", () => {
    const pe = new Date("2026-12-01T00:00:00Z");
    expect(billingForStatus("active", pe).plan).toBe("pro");
    const pd = billingForStatus("past_due", pe);
    expect(pd.plan).toBe("pro");
    expect(pd.graceUntil!.getTime()).toBeGreaterThan(pe.getTime());
    expect(billingForStatus("canceled", pe).plan).toBe("free");
  });
});

describe("handleStripeEvent", () => {
  it("checkout.session.completed attaches the customer and grants pro", async () => {
    await handleStripeEvent(prod,evt("checkout.session.completed", {
      mode: "subscription",
      customer: customerId,
      client_reference_id: userId,
      metadata: { userId },
    }));
    const [user] = await db.select().from(tables.users).where(eq(tables.users.id, userId)).limit(1);
    expect(user!.stripeCustomerId).toBe(customerId);
    expect(user!.plan).toBe("pro");
  });

  it("subscription events drive status, period end and downgrade on cancel", async () => {
    const periodEnd = Math.floor(new Date("2027-01-01T00:00:00Z").getTime() / 1000);
    await handleStripeEvent(prod,evt("customer.subscription.updated", {
      customer: customerId,
      status: "past_due",
      current_period_end: periodEnd,
    }));
    let [user] = await db.select().from(tables.users).where(eq(tables.users.id, userId)).limit(1);
    expect(user!.subscriptionStatus).toBe("past_due");
    expect(user!.graceUntil).toBeTruthy();

    await handleStripeEvent(prod,evt("customer.subscription.deleted", {
      customer: customerId,
      status: "canceled",
      current_period_end: periodEnd,
    }));
    [user] = await db.select().from(tables.users).where(eq(tables.users.id, userId)).limit(1);
    expect(user!.plan).toBe("free");
    expect(user!.subscriptionStatus).toBe("canceled");
  });

  it("ignores subscriptions for unknown customers without crashing", async () => {
    await handleStripeEvent(prod,evt("customer.subscription.updated", {
      customer: "cus_unknown",
      status: "active",
      current_period_end: 0,
    }));
  });
});

describe("processStripeEvent idempotency", () => {
  it("processes once, then reports duplicate", async () => {
    await db.insert(tables.users).values({ id: "u_test_idem", email: "idem@example.com", name: "I" });
    const e = evt("checkout.session.completed", {
      mode: "subscription",
      customer: "cus_idem_1",
      metadata: { userId: "u_test_idem" },
    }, "evt_idem_1");
    expect(await processStripeEvent(prod,e)).toBe("processed");
    expect(await processStripeEvent(prod,e)).toBe("duplicate");
    const [row] = await db.select().from(tables.webhookEvents).where(eq(tables.webhookEvents.stripeEventId, "evt_idem_1")).limit(1);
    expect(row!.processedAt).toBeTruthy();
  });

  it("dead-letters after MAX_ATTEMPTS failures and then skips (returns 200 path)", async () => {
    await db.insert(tables.users).values({ id: "u_test_fail", email: "fail@example.com", name: "F" });
    await db.update(tables.users).set({ stripeCustomerId: "cus_fail_1" }).where(eq(tables.users.id, "u_test_fail"));
    const failing = evt("customer.subscription.updated", { customer: "cus_fail_1", status: "active" }, "evt_fail_1");
    // Deterministic failure: the handler's update() (odd calls) throws, while the
    // bookkeeping update (even calls, retry counter) still works — like a bad payload.
    let calls = 0;
    const broken = Object.create(prod) as Database;
    broken.update = ((...a: unknown[]) => {
      calls += 1;
      if (calls % 2 === 1) throw new Error("bad payload");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (prod.update as any)(...a);
    }) as Database["update"];
    let last: string | unknown = "error";
    for (let i = 0; i < 5; i++) {
      try {
        last = await processStripeEvent(broken, failing);
      } catch {
        last = "error"; // route would return 500 -> Stripe retries
      }
    }
    expect(last).toBe("dead-letter");
    // Dead-lettered: a replay is skipped, never retried again.
    await expect(processStripeEvent(prod,failing)).resolves.toBe("dead-letter");
    const [row] = await db.select().from(tables.webhookEvents).where(eq(tables.webhookEvents.stripeEventId, "evt_fail_1")).limit(1);
    expect(row!.deadLetter).toBe(true);
    expect(row!.retryCount).toBe(5);
  });
});

describe("stripe signature verification", () => {
  it("verifies a properly signed payload and rejects a tampered one", async () => {
    // Any test key works: signature generation/verification is local HMAC.
    process.env.STRIPE_SECRET_KEY ??= "sk_test_sig";
    const stripe = getStripe();
    if (!stripe) return; // unreachable, keeps TS happy
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
    const payload = JSON.stringify({ id: "evt_sig", type: "ping" });
    const header = await stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET, timestamp: Math.floor(Date.now() / 1000) });
    const ok = await stripe.webhooks.constructEventAsync(payload, header, process.env.STRIPE_WEBHOOK_SECRET);
    expect(ok.id).toBe("evt_sig");
    await expect(
      stripe.webhooks.constructEventAsync(payload + " tampered", header, process.env.STRIPE_WEBHOOK_SECRET),
    ).rejects.toThrow();
  });
});
