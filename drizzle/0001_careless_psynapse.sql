ALTER TABLE "renders" ADD COLUMN "share_slug" text;--> statement-breakpoint
ALTER TABLE "renders" ADD CONSTRAINT "renders_share_slug_unique" UNIQUE("share_slug");