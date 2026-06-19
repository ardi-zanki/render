"use client";

import { CreditCard, Loader2 } from "lucide-react";
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

type PaymentButtonState = {
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
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

  async function openCheckout(json: CheckoutResponse, state: PaymentButtonState) {
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
        onClose: () => state.setLoading(false),
      });
    } else if (json.redirectUrl) {
      window.location.href = json.redirectUrl;
    } else {
      state.setError("Pembayaran tidak tersedia.");
      state.setLoading(false);
    }
  }

  async function buy() {
    setLoading(true);
    setError("");
    try {
      const json = await postJson<CheckoutResponse>("/api/payments/checkout", {
        packageSlug: slug,
      });

      await openCheckout(json, { setLoading, setError });
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

export function ResumePaymentButton({
  orderId,
  provider,
  token,
  redirectUrl,
}: {
  orderId: string;
  provider: string;
  token?: string | null;
  redirectUrl?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function finishHref(status: "success" | "pending" | "error", id?: string) {
    const params = new URLSearchParams({ status });
    params.set("order", id ?? orderId);
    return `/payments/finish?${params.toString()}`;
  }

  async function syncPayment(id?: string) {
    try {
      await postJson("/api/payments/sync", { orderId: id ?? orderId });
    } catch {
      // Webhook remains authoritative; this keeps the return page fresher.
    }
  }

  async function resume() {
    setLoading(true);
    setError("");

    const checkout: CheckoutResponse = {
      orderId,
      provider,
      token: token ?? undefined,
      redirectUrl: redirectUrl ?? undefined,
    };

    if (checkout.provider === "midtrans" && checkout.token && window.snap) {
      window.snap.pay(checkout.token, {
        onSuccess: async (result) => {
          const id = result?.order_id ?? orderId;
          await syncPayment(id);
          router.push(finishHref("success", id));
        },
        onPending: (result) =>
          router.push(finishHref("pending", result?.order_id ?? orderId)),
        onError: (result) =>
          router.push(finishHref("error", result?.order_id ?? orderId)),
        onClose: () => setLoading(false),
      });
    } else if (checkout.redirectUrl) {
      window.location.href = checkout.redirectUrl;
    } else {
      setError("Pembayaran tidak tersedia.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        onClick={resume}
        disabled={loading}
        variant="outline"
        size="sm"
        className="h-8"
      >
        {loading ? <Loader2 className="animate-spin" /> : <CreditCard />}
        Lanjutkan pembayaran
      </Button>
      {error && (
        <p className="max-w-44 text-right text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
