ALTER TABLE "link" DROP CONSTRAINT "link_author_user_id_fk";
--> statement-breakpoint
ALTER TABLE "link" ADD CONSTRAINT "link_author_user_id_fk" FOREIGN KEY ("author") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;