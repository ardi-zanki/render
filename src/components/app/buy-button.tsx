"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { apiErrorMessage, postJson } from "@/lib/client-api";

type SnapCallbacks = {
  onSuccess?: (result?: SnapResult) => void | Promise<void>;
  onPending?: (result?: SnapResult) => void;
  onError?: (result?: SnapResult) => void;
  onClose?: () => void;
};

type SnapResult = {
  order_id?: string;
  transaction_status?: string;
  status_code?: string;
};

type CheckoutResponse = {
  orderId: string;
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

  function finishHref(status: "success" | "pending" | "error", orderId?: string) {
    const params = new URLSearchParams({ status });
    if (orderId) params.set("order", orderId);
    return `/payments/finish?${params.toString()}`;
  }

  async function syncPayment(orderId?: string) {
    if (!orderId) return;
    try {
      await postJson("/api/payments/sync", { orderId });
    } catch {
      // The finish page and webhook remain the source of truth; this browser
      // sync is only a fast-path after Snap reports success.
    }
  }

  async function buy() {
    setLoading(true);
    setError("");
    try {
      const json = await postJson<CheckoutResponse>("/api/payments/checkout", {
        packageSlug: slug,
      });

      if (json.provider === "midtrans" && json.token && window.snap) {
        window.snap.pay(json.token, {
          onSuccess: async (result) => {
            const orderId = result?.order_id ?? json.orderId;
            await syncPayment(orderId);
            router.push(finishHref("success", orderId));
          },
          onPending: (result) =>
            router.push(finishHref("pending", result?.order_id ?? json.orderId)),
          onError: (result) =>
            router.push(finishHref("error", result?.order_id ?? json.orderId)),
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
