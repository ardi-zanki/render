"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { PasswordInput } from "@/components/auth/password-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { zodFieldErrors } from "@/lib/form";
import { resetPasswordSchema } from "@/lib/validations/auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [values, setValues] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof values) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [field]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const parsed = resetPasswordSchema.safeParse({ ...values, token });
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setLoading(true);
    const { error } = await resetPassword({
      newPassword: values.password,
      token,
    });
    if (error) {
      setFormError(authErrorMessage(error));
      setLoading(false);
      return;
    }
    router.push("/login?reset=success");
  }

  if (!token) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Tautan reset tidak valid atau sudah kedaluwarsa. Silakan minta{" "}
          <Link href="/forgot-password" className="font-medium underline">
            tautan baru
          </Link>
          .
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password Baru</Label>
        <PasswordInput
          id="password"
          value={values.password}
          onChange={update("password")}
          placeholder="Min. 8 karakter"
          aria-invalid={!!errors.password}
          autoComplete="new-password"
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password}</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
        <PasswordInput
          id="confirmPassword"
          value={values.confirmPassword}
          onChange={update("confirmPassword")}
          placeholder="Ulangi password baru"
          aria-invalid={!!errors.confirmPassword}
          autoComplete="new-password"
        />
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">{errors.confirmPassword}</p>
        )}
      </div>
      <Button type="submit" disabled={loading} className="mt-1 w-full">
        {loading && <Loader2 className="animate-spin" />}
        Simpan Password Baru
      </Button>
    </form>
  );
}
