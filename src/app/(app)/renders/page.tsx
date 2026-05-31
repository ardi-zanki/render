import type { Metadata } from "next";

import { ComingSoon } from "@/components/app/coming-soon";
import { PageHeader } from "@/components/app/page-header";

export const metadata: Metadata = { title: "Riwayat Render" };

export default function RendersPage() {
  return (
    <>
      <PageHeader
        title="Riwayat Render"
        description="Semua render Anda, lengkap dengan status dan hasilnya."
      />
      <ComingSoon phase="Phase 2" />
    </>
  );
}
