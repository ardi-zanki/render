/**
 * Marketing copy for credit packages, keyed by package slug.
 *
 * The pricing numbers (price, credits, bonus) live in the database
 * (`paymentPackages`) and are the single source of truth — fetched by the
 * landing page, the pricing page, and checkout alike. This file only holds the
 * marketing copy (positioning note + feature bullets) that does not belong in
 * the transactional table.
 */
export type PackageCopy = {
  note: string;
  features: string[];
  highlighted?: boolean;
};

export const PACKAGE_COPY: Record<string, PackageCopy> = {
  starter: {
    note: "Untuk validasi workflow awal",
    features: [
      "Eksplorasi ringan",
      "Project dan riwayat render",
      "Mode interior dan eksterior",
    ],
  },
  creator: {
    note: "Untuk presentasi dan revisi rutin",
    highlighted: true,
    features: [
      "Lebih leluasa membuat opsi",
      "Riwayat render tertata",
      "Bagikan dan unduh hasil",
    ],
  },
  studio: {
    note: "Untuk beberapa project berjalan",
    features: [
      "Cocok untuk tim desain",
      "Manajemen project",
      "Bagikan dan unduh hasil",
    ],
  },
  agency: {
    note: "Untuk kebutuhan visual volume tinggi",
    features: [
      "Kapasitas render tinggi",
      "Workflow multi-project",
      "Bagikan dan unduh hasil",
    ],
  },
};

const idr = new Intl.NumberFormat("id-ID");

/** Format a Rupiah price, e.g. 249000 -> "Rp249.000". */
export function formatPrice(price: number) {
  return `Rp${idr.format(price)}`;
}

/** Format a credit total, e.g. (100, 10) -> "110 kredit". */
export function formatCredits(credits: number, bonusCredits = 0) {
  return `${idr.format(credits + bonusCredits)} kredit`;
}

export function packageCopy(slug: string): PackageCopy {
  return PACKAGE_COPY[slug] ?? { note: "", features: [] };
}
