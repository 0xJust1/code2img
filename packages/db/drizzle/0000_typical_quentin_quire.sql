CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"account_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"password" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_account_id_unique" UNIQUE("account_id")
);
--> statement-breakpoint
CREATE TABLE "api_key" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"prefix" text NOT NULL,
	"key_hash" text NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "image" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"config_hash" text NOT NULL,
	"config" jsonb,
	"storage_key" text,
	"format" text NOT NULL,
	"width" integer,
	"height" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "preset" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"config" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "share_link" (
	"id" text PRIMARY KEY NOT NULL,
	"image_id" text NOT NULL,
	"slug" text NOT NULL,
	"expires_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"utm" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "share_link_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "upload" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"storage_key" text NOT NULL,
	"mime" text NOT NULL,
	"bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_counter" (
	"user_id" text NOT NULL,
	"day" text NOT NULL,
	"renders" integer DEFAULT 0 NOT NULL,
	"api_calls" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "usage_counter_user_id_day_pk" PRIMARY KEY("user_id","day")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"stripe_customer_id" text,
	"subscription_status" text,
	"period_end" timestamp with time zone,
	"grace_until" timestamp with time zone,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_event" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_event_id" text NOT NULL,
	"payload" jsonb,
	"processed_at" timestamp with time zone,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"dead_letter" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_event_stripe_event_id_unique" UNIQUE("stripe_event_id")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image" ADD CONSTRAINT "image_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preset" ADD CONSTRAINT "preset_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_link" ADD CONSTRAINT "share_link_image_id_image_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."image"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload" ADD CONSTRAINT "upload_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_counter" ADD CONSTRAINT "usage_counter_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "api_key_hash_idx" ON "api_key" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "api_key_user_idx" ON "api_key" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "image_user_idx" ON "image" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "preset_user_idx" ON "preset" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "upload_user_idx" ON "upload" USING btree ("user_id");