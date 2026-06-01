"use client";

import { Archive } from "lucide-react";
import { useState } from "react";

import { archiveProjectAction } from "@/app/(app)/projects/[id]/actions";
import { Button } from "@/components/ui/button";

export function ArchiveProjectButton({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false);

  async function onArchive() {
    if (
      !window.confirm(
        "Arsipkan project ini? Render di dalamnya tetap tersimpan.",
      )
    ) {
      return;
    }
    setLoading(true);
    await archiveProjectAction(projectId);
  }

  return (
    <Button variant="outline" size="sm" onClick={onArchive} disabled={loading}>
      <Archive /> Arsipkan
    </Button>
  );
}
