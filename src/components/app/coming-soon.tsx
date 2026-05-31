import { Hammer } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

export function ComingSoon({ phase }: { phase?: string }) {
  return (
    <EmptyState
      icon={Hammer}
      title="Segera hadir"
      description={
        phase
          ? `Halaman ini dibangun pada ${phase}.`
          : "Halaman ini sedang dalam pengembangan."
      }
    />
  );
}
