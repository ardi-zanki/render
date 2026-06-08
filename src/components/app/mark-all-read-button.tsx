"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/client-api";

export function MarkAllReadButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markAll() {
    setLoading(true);
    try {
      await postJson("/api/notifications/read", { all: true });
      router.refresh();
    } catch {
      // Keep the button quiet; the notifications page will refresh on navigation.
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={markAll} disabled={loading}>
      <Check /> Tandai semua dibaca
    </Button>
  );
}
