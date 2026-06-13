"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { apiErrorMessage, postJson } from "@/lib/client-api";

type SnapCallbacks = {
  onSuccess?: () => void;
  onPending?: () => void;
  onError?: () => void;
  onClose?: () => void;
};

type CheckoutResponse = {
  provider: string;
  token?: string;
  redirectUrl?: string;
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
      const json = await postJson<CheckoutResponse>("/api/payments/checkout", {
        packageSlug: slug,
      });

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
    } catch (err) {
      setError(apiErrorMessage(err, "Tidak bisa terhubung ke server."));
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
        Top up
      </Button>
      {error && <p className="text-center text-xs text-destructive">{error}</p>}
    </div>
  );
}
