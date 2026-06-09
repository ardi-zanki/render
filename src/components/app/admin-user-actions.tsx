"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  creditAdjustmentAction,
  setRoleAction,
  toggleDisableAction,
} from "@/app/(app)/admin/users/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";

type AdminUserAction = "role" | "status" | "credit";

type UserSummary = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  isDisabled: boolean;
};

function userLabel(user: UserSummary) {
  return user.name || user.email;
}

export function AdminUserActions({ user }: { user: UserSummary }) {
  const [open, setOpen] = useState<AdminUserAction | null>(null);
  const [amount, setAmount] = useState("");
  const [confirmationName, setConfirmationName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const label = userLabel(user);
  const nextRole = user.role === "admin" ? "user" : "admin";
  const nextDisabled = !user.isDisabled;

  function close() {
    setOpen(null);
    setAmount("");
    setConfirmationName("");
    setErrors({});
  }

  function runAction(action: () => Promise<void>, success: string) {
    startTransition(async () => {
      try {
        await action();
        toast.success(success);
        close();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Aksi admin gagal dijalankan.",
        );
      }
    });
  }

  function confirmRole() {
    const fd = new FormData();
    fd.set("userId", user.id);
    fd.set("role", nextRole);
    runAction(
      () => setRoleAction(fd),
      nextRole === "admin" ? "User dijadikan admin" : "Role admin dicabut",
    );
  }

  function confirmStatus() {
    const fd = new FormData();
    fd.set("userId", user.id);
    fd.set("disabled", String(nextDisabled));
    runAction(
      () => toggleDisableAction(fd),
      nextDisabled ? "User dinonaktifkan" : "User diaktifkan",
    );
  }

  function confirmCredit() {
    const nextErrors: Record<string, string> = {};
    const value = Number(amount);
    if (!amount.trim()) nextErrors.amount = "Jumlah kredit wajib diisi";
    else if (!Number.isInteger(value) || value === 0) {
      nextErrors.amount = "Jumlah harus bilangan bulat selain 0";
    }
    if (confirmationName.trim() !== label) {
      nextErrors.confirmationName = `Ketik "${label}" untuk menyesuaikan kredit`;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const fd = new FormData();
    fd.set("userId", user.id);
    fd.set("amount", String(value));
    fd.set("confirmationName", confirmationName.trim());
    runAction(() => creditAdjustmentAction(fd), "Kredit berhasil disesuaikan");
  }

  return (
    <>
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen("credit")}>
          Atur kredit
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen("role")}>
          {user.role === "admin" ? "Jadikan User" : "Jadikan Admin"}
        </Button>
        <Button
          type="button"
          variant={user.isDisabled ? "outline" : "destructive"}
          size="sm"
          onClick={() => setOpen("status")}
        >
          {user.isDisabled ? "Aktifkan" : "Nonaktifkan"}
        </Button>
      </div>

      {open === "role" && (
        <Modal
          onClose={close}
          labelledBy="admin-role-title"
          panelClassName="w-full max-w-sm rounded-lg border border-border bg-card p-5 shadow-dialog"
        >
          <h2 id="admin-role-title" className="text-base font-semibold text-foreground">
            Ubah role user?
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
            {userLabel(user)} akan dijadikan {nextRole === "admin" ? "Admin" : "User biasa"}.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={close} disabled={isPending}>
              Batal
            </Button>
            <Button onClick={confirmRole} disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              Konfirmasi
            </Button>
          </div>
        </Modal>
      )}

      {open === "status" && (
        <Modal
          onClose={close}
          labelledBy="admin-status-title"
          panelClassName="w-full max-w-sm rounded-lg border border-border bg-card p-5 shadow-dialog"
        >
          <h2 id="admin-status-title" className="text-base font-semibold text-foreground">
            {nextDisabled ? "Nonaktifkan user?" : "Aktifkan user?"}
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
            {nextDisabled
              ? `${userLabel(user)} akan logout dan tidak bisa mengakses akun.`
              : `${userLabel(user)} akan bisa mengakses akun kembali.`}
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={close} disabled={isPending}>
              Batal
            </Button>
            <Button
              variant={nextDisabled ? "destructive" : "default"}
              onClick={confirmStatus}
              disabled={isPending}
            >
              {isPending && <Loader2 className="animate-spin" />}
              {nextDisabled ? "Nonaktifkan" : "Aktifkan"}
            </Button>
          </div>
        </Modal>
      )}

      {open === "credit" && (
        <Modal
          onClose={close}
          labelledBy="admin-credit-title"
          panelClassName="w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-dialog"
        >
          <h2 id="admin-credit-title" className="text-base font-semibold text-foreground">
            Sesuaikan kredit
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
            Masukkan nilai positif untuk menambah kredit atau negatif untuk mengurangi kredit {label}.
          </p>
          <div className="mt-4 grid gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`credit-amount-${user.id}`}>Jumlah kredit</Label>
              <Input
                id={`credit-amount-${user.id}`}
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setErrors((prev) => ({ ...prev, amount: "" }));
                }}
                placeholder="+10 atau -5"
                aria-invalid={!!errors.amount}
              />
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`credit-confirmation-${user.id}`}>
                Ketik nama pengguna
              </Label>
              <Input
                id={`credit-confirmation-${user.id}`}
                value={confirmationName}
                onChange={(e) => {
                  setConfirmationName(e.target.value);
                  setErrors((prev) => ({ ...prev, confirmationName: "" }));
                }}
                placeholder={label}
                maxLength={160}
                aria-invalid={!!errors.confirmationName}
              />
              {errors.confirmationName && (
                <p className="text-xs text-destructive">
                  {errors.confirmationName}
                </p>
              )}
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={close} disabled={isPending}>
              Batal
            </Button>
            <Button onClick={confirmCredit} disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              Simpan
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
