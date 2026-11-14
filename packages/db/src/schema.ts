// Single source of truth for the Postgres schema (Phase 2).
// `user`/`session`/`account`/`verification` are owned by Better Auth (drizzle adapter);
// billing fields live directly on user.
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default(""),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  // Billing (Phase 2). plan: free | pro. effective plan computed in @code2img/shared entitlements.
  plan: text("plan").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id").unique(),
  subscriptionStatus: text("subscription_status"), // active | trialing | past_due | canceled
  periodEnd: timestamp("period_end", { withTimezone: true }),
  graceUntil: timestamp("grace_until", { withTimezone: true }),
});

export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  providerId: text("provider_id").notNull(),
  accountId: text("account_id").notNull().unique(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  password: text("password"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const apiKeys = pgTable(
  "api_key",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    prefix: text("prefix").notNull(),
    keyHash: text("key_hash").notNull(),
    scopes: jsonb("scopes").$type<string[]>().notNull().default([]),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("api_key_hash_idx").on(t.keyHash), index("api_key_user_idx").on(t.userId)],
);

export const images = pgTable(
  "image",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    configHash: text("config_hash").notNull(),
    config: jsonb("config").$type<Record<string, unknown>>(),
    storageKey: text("storage_key"),
    format: text("format").notNull(),
    width: integer("width"),
    height: integer("height"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (t) => [index("image_user_idx").on(t.userId, t.createdAt)],
);

export const shareLinks = pgTable("share_link", {
  id: text("id").primaryKey(),
  imageId: text("image_id")
    .notNull()
    .references(() => images.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  utm: jsonb("utm").$type<Record<string, string>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const presets = pgTable(
  "preset",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    config: jsonb("config").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("preset_user_idx").on(t.userId)],
);

export const uploads = pgTable(
  "upload",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["logo", "background"] }).notNull(),
    storageKey: text("storage_key").notNull(),
    mime: text("mime").notNull(),
    bytes: integer("bytes").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("upload_user_idx").on(t.userId)],
);

export const usageCounters = pgTable(
  "usage_counter",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    day: text("day").notNull(), // YYYY-MM-DD (UTC)
    renders: integer("renders").notNull().default(0),
    apiCalls: integer("api_calls").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.day] })],
);

export const webhookEvents = pgTable("webhook_event", {
  id: text("id").primaryKey(),
  stripeEventId: text("stripe_event_id").notNull().unique(),
  payload: jsonb("payload").$type<Record<string, unknown>>(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  retryCount: integer("retry_count").notNull().default(0),
  lastError: text("last_error"),
  deadLetter: boolean("dead_letter").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Better Auth relations (drizzle adapter expects these to exist for relations queries; core uses plain selects).
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
}));
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));
export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));
