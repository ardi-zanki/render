import { config } from "dotenv";

config({ path: ".env.local" });

const packages = [
  { name: "Starter", slug: "starter", price: 90_000, credits: 30, sortOrder: 1 },
  {
    name: "Creator",
    slug: "creator",
    price: 280_000,
    credits: 100,
    sortOrder: 2,
  },
  { name: "Studio", slug: "studio", price: 780_000, credits: 300, sortOrder: 3 },
  {
    name: "Agency",
    slug: "agency",
    price: 2_500_000,
    credits: 1_000,
    sortOrder: 4,
  },
];

async function main() {
  const { db } = await import("@/db");
  const { paymentPackages } = await import("@/db/schema");

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
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed gagal:", err);
    process.exit(1);
  });
