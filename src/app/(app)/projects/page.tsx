import type { Metadata } from "next";

import { ComingSoon } from "@/components/app/coming-soon";
import { PageHeader } from "@/components/app/page-header";

export const metadata: Metadata = { title: "Project" };

export default function ProjectsPage() {
  return (
    <>
      <PageHeader
        title="Project"
        description="Kelola dan kelompokkan render Anda per project."
      />
      <ComingSoon phase="Phase 2" />
    </>
  );
}
