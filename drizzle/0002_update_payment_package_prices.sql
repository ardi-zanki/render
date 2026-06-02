UPDATE "payment_packages"
SET
  "price" = 79000,
  "credits" = 30,
  "bonus_credits" = 0,
  "updated_at" = now()
WHERE "slug" = 'starter';--> statement-breakpoint

UPDATE "payment_packages"
SET
  "price" = 249000,
  "credits" = 100,
  "bonus_credits" = 0,
  "updated_at" = now()
WHERE "slug" = 'creator';--> statement-breakpoint

UPDATE "payment_packages"
SET
  "price" = 735000,
  "credits" = 300,
  "bonus_credits" = 0,
  "updated_at" = now()
WHERE "slug" = 'studio';--> statement-breakpoint

UPDATE "payment_packages"
SET
  "price" = 2300000,
  "credits" = 1000,
  "bonus_credits" = 0,
  "updated_at" = now()
WHERE "slug" = 'agency';
