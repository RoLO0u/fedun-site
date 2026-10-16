CREATE TABLE "posts" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"published_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
