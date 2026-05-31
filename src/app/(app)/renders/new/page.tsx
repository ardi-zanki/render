import type { Metadata } from "next";

import { ComingSoon } from "@/components/app/coming-soon";
import { PageHeader } from "@/components/app/page-header";

export const metadata: Metadata = { title: "Buat Render" };

export default function CreateRenderPage() {
  return (
    <>
      <PageHeader
        title="Buat Render"
        description="Rendr Studio — upload desain, pilih mode, lalu generate."
      />
      <ComingSoon phase="Phase 2 (Rendr Studio)" />
    </>
  );
}
