import type { Metadata } from "next";

import { ComingSoon } from "@/components/app/coming-soon";
import { PageHeader } from "@/components/app/page-header";

export const metadata: Metadata = { title: "Notifikasi" };

export default function NotificationsPage() {
  return (
    <>
      <PageHeader
        title="Notifikasi"
        description="Pemberitahuan render, pembayaran, dan sistem."
      />
      <ComingSoon phase="Phase 2" />
    </>
  );
}
