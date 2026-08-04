CREATE TABLE "link" (
	"id" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"short_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"accessed_at" timestamp,
	"access_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "link_short_url_unique" UNIQUE("short_url")
);
