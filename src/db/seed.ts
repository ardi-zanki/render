import { db } from "@/db";
import { paymentPackages } from "@/db/schema";

/** Credit packages seed (PRD §23.2). Packages are managed via seed, not admin. */
const packages = [
  { name: "Starter", slug: "starter", price: 79_000, credits: 30, sortOrder: 1 },
  {
    name: "Creator",
    slug: "creator",
    price: 249_000,
    credits: 100,
    sortOrder: 2,
  },
  { name: "Studio", slug: "studio", price: 735_000, credits: 300, sortOrder: 3 },
  {
    name: "Agency",
    slug: "agency",
    price: 2_300_000,
    credits: 1_000,
    sortOrder: 4,
  },
];

async function main() {
  for (const p of packages) {
    await db
      .insert(paymentPackages)
      .values({ ...p, currency: "IDR" })
      .onConflictDoUpdate({
        target: paymentPackages.slug,
        set: {
          name: p.name,
          price: p.price,
          credits: p.credits,
          bonusCredits: 0,
          sortOrder: p.sortOrder,
          isActive: true,
          updatedAt: new Date(),
        },
      });
  }
  console.log(`✓ Seeded ${packages.length} payment packages`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed gagal:", err);
  process.exit(1);
});
