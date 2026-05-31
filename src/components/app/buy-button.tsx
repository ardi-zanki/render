"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type SnapCallbacks = {
  onSuccess?: () => void;
  onPending?: () => void;
  onError?: () => void;
  onClose?: () => void;
};

declare global {
  interface Window {
    snap?: { pay: (token: string, callbacks: SnapCallbacks) => void };
  }
}

export function BuyButton({
  slug,
  featured,
}: {
  slug: string;
  featured?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buy() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageSlug: slug }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal membuat pembayaran");
        setLoading(false);
        return;
      }

      if (json.provider === "midtrans" && json.token && window.snap) {
        window.snap.pay(json.token, {
          onSuccess: () => router.push("/payments/finish?status=success"),
          onPending: () => router.push("/payments/finish?status=pending"),
          onError: () => router.push("/payments/finish?status=error"),
          onClose: () => setLoading(false),
        });
      } else if (json.redirectUrl) {
        window.location.href = json.redirectUrl;
      } else {
        setError("Pembayaran tidak tersedia.");
        setLoading(false);
      }
    } catch {
      setError("Tidak bisa terhubung ke server.");
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-1.5">
      <Button
        onClick={buy}
        disabled={loading}
        variant={featured ? "default" : "outline"}
        className="w-full"
      >
        {loading && <Loader2 className="animate-spin" />}
        Beli Paket
      </Button>
      {error && <p className="text-center text-xs text-destructive">{error}</p>}
    </div>
  );
}
