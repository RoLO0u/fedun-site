ALTER TABLE "link" ADD COLUMN "author" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "short_links" text[];--> statement-breakpoint
ALTER TABLE "link" ADD CONSTRAINT "link_author_user_id_fk" FOREIGN KEY ("author") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;