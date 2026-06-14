"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { apiErrorMessage, postJson } from "@/lib/client-api";

/** Dev-only: simulate a Midtrans notification by posting to our webhook. */
export function SimulatePayButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"pay" | "fail" | null>(null);

  async function notify(transactionStatus: string, redirectStatus: string) {
    setLoading(transactionStatus === "settlement" ? "pay" : "fail");
    try {
      await postJson("/api/payments/webhook", {
        order_id: orderId,
        transaction_status: transactionStatus,
        status_code: "200",
        gross_amount: "0",
        transaction_id: `mock-${Date.now()}`,
      });
      router.push(`/payments/finish?status=${redirectStatus}`);
      router.refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Gagal menjalankan simulasi pembayaran"));
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Button
        onClick={() => notify("settlement", "success")}
        disabled={loading !== null}
        size="lg"
        className="w-full"
      >
        {loading === "pay" ? (
          <Loader2 className="animate-spin" />
        ) : (
          <CheckCircle2 />
        )}
        Bayar Sekarang (simulasi)
      </Button>
      <Button
        variant="outline"
        onClick={() => notify("expire", "failed")}
        disabled={loading !== null}
        size="lg"
        className="w-full"
      >
        {loading === "fail" ? <Loader2 className="animate-spin" /> : <XCircle />}
        Batalkan
      </Button>
    </div>
  );
}
