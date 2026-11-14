// Single source of truth for plan entitlements. Server-side only usage; never trust the client.
// The API add-on (Phase 4) will extend this; today: free | pro.

export type Plan = "free" | "pro";
export type Feature = "no-watermark" | "custom-logo" | "custom-background" | "scale-4x" | "presets-unlimited";

export const FREE_MAX_SCALE = 2 as const;
export const PRO_MAX_SCALE = 4 as const;
export const FREE_MAX_PRESETS = 10 as const;

export function can(plan: Plan, _feature: Feature): boolean {
  return plan === "pro";
}

export function maxScale(plan: Plan): 1 | 2 | 3 | 4 {
  return plan === "pro" ? PRO_MAX_SCALE : FREE_MAX_SCALE;
}

export function maxPresets(plan: Plan): number {
  return plan === "pro" ? Number.POSITIVE_INFINITY : FREE_MAX_PRESETS;
}

// Effective plan for entitlement checks: pro stays active during the grace window,
// downgrades to free once grace_until has passed (webhook drives the stored fields).
export interface PlanState {
  plan: string; // stored plan
  subscriptionStatus?: string | null;
  periodEnd?: Date | null;
  graceUntil?: Date | null;
}

export function effectivePlan(state: PlanState, now: Date = new Date()): Plan {
  if (state.plan !== "pro") return "free";
  const active = state.subscriptionStatus === "active" || state.subscriptionStatus === "trialing";
  if (active) return "pro";
  if (state.subscriptionStatus === "past_due" && state.graceUntil && state.graceUntil > now) return "pro";
  return "free";
}
