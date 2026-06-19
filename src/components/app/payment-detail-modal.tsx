"use client";

import { useState, type ReactNode } from "react";

import { ResumePaymentButton } from "@/components/app/buy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { paymentStatusBadge } from "@/lib/payments/labels";

const idr = new Intl.NumberFormat("id-ID");
const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export type PaymentDetail = {
  orderId: string;
  provider: string;
  packageName: string;
  amount: number;
  credits: number;
  status: string;
  paymentType: string | null;
  snapToken: string | null;
  paymentUrl: string | null;
  createdAt: string;
  paidAt: string | null;
};

export function PaymentDetailModal({ payment }: { payment: PaymentDetail }) {
  const [open, setOpen] = useState(false);
  const status = paymentStatusBadge(payment.status);
  const documentBase = `/api/payments/${encodeURIComponent(payment.orderId)}`;
  const effectiveDate = payment.paidAt ?? payment.createdAt;
  const rows: Array<[string, ReactNode]> = [
    ["Nomor order", payment.orderId],
    ["Status", <Badge key="status" variant={status.variant}>{status.label}</Badge>],
    [
      payment.status === "paid" ? "Tanggal bayar" : "Tanggal dibuat",
      dateFmt.format(new Date(effectiveDate)),
    ],
    ["Provider", payment.provider],
    ["Metode", payment.paymentType ?? "Belum tersedia"],
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
      >
        Detail
      </button>

      {open && (
        <Modal
          onClose={() => setOpen(false)}
          labelledBy="payment-detail-title"
          panelClassName="w-full max-w-lg overflow-hidden rounded-lg border border-border bg-card shadow-dialog"
        >
          <div className="px-5 pb-5 pt-8 text-center sm:px-7 sm:pb-6">
            <h2
              id="payment-detail-title"
              className="text-sm font-medium text-muted-foreground"
            >
              Detail pembayaran
            </h2>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              Rp{idr.format(payment.amount)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {payment.packageName} · {idr.format(payment.credits)} kredit
            </p>
          </div>

          <dl className="mx-5 divide-y divide-border border-y border-border sm:mx-7">
            {rows.map(([label, value]) => (
              <div
                key={label}
                className="grid grid-cols-[110px_minmax(0,1fr)] gap-4 py-2.5 text-sm"
              >
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="break-words text-right font-medium text-foreground">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="grid gap-2 px-5 py-5 sm:grid-cols-2 sm:px-7 sm:py-6">
            <Button asChild variant="outline">
              <a href={`${documentBase}/invoice`} download>
                Download invoice
              </a>
            </Button>
            {payment.status === "paid" ? (
              <Button asChild>
                <a href={`${documentBase}/receipt`} download>
                  Download receipt
                </a>
              </Button>
            ) : payment.status === "pending" &&
              (payment.snapToken || payment.paymentUrl) ? (
              <div className="[&>div]:items-stretch [&_button]:h-9 [&_button]:w-full">
                <ResumePaymentButton
                  orderId={payment.orderId}
                  provider={payment.provider}
                  token={payment.snapToken}
                  redirectUrl={payment.paymentUrl}
                />
              </div>
            ) : (
              <Button disabled>Receipt belum tersedia</Button>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
