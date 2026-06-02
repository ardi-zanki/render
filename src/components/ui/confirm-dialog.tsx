"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Konfirmasi",
  destructive = false,
  onConfirm,
  onClose,
}: {
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function confirm() {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      labelledBy="confirm-dialog-title"
      panelClassName="w-full max-w-sm rounded-lg border border-border bg-card p-5 shadow-dialog"
    >
      <h2
        id="confirm-dialog-title"
        className="text-base font-semibold text-foreground"
      >
        {title}
      </h2>
      {description && (
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Batal
        </Button>
        <Button
          variant={destructive ? "destructive" : "default"}
          onClick={confirm}
          disabled={loading}
        >
          {loading && <Loader2 className="animate-spin" />}
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
