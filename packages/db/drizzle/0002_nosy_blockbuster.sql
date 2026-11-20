CREATE TABLE "api_requests" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"ts" timestamp with time zone DEFAULT now() NOT NULL,
	"method" varchar(8) NOT NULL,
	"path" text NOT NULL,
	"status" integer NOT NULL,
	"duration_ms" integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX "api_requests_ts_idx" ON "api_requests" USING btree ("ts");