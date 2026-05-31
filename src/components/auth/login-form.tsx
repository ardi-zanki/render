"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { GoogleButton } from "@/components/auth/google-button";
import { OrDivider } from "@/components/auth/or-divider";
import { PasswordInput } from "@/components/auth/password-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";
import { authErrorMessage, isEmailNotVerified } from "@/lib/auth-errors";
import { zodFieldErrors } from "@/lib/form";
import { loginSchema } from "@/lib/validations/auth";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/dashboard";

  const [values, setValues] = useState({ email: "", password: "" });
  const [remember, setRemember] = useState(false);
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
    const parsed = loginSchema.safeParse({ ...values, rememberMe: remember });
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setLoading(true);
    const { error } = await signIn.email({
      email: values.email,
      password: values.password,
      rememberMe: remember,
      callbackURL: redirectTo,
    });
    if (error) {
      if (isEmailNotVerified(error)) {
        router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
        return;
      }
      setFormError(authErrorMessage(error));
      setLoading(false);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={values.email}
          onChange={update("email")}
          placeholder="kamu@email.com"
          aria-invalid={!!errors.email}
          autoComplete="email"
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          value={values.password}
          onChange={update("password")}
          placeholder="Password kamu"
          aria-invalid={!!errors.password}
          autoComplete="current-password"
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="size-4 accent-primary"
          />
          Ingat saya
        </label>
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-foreground hover:underline"
        >
          Lupa password?
        </Link>
      </div>

      <Button type="submit" disabled={loading} className="mt-1 w-full">
        {loading && <Loader2 className="animate-spin" />}
        Masuk
      </Button>

      <OrDivider />
      <GoogleButton
        label="Masuk pakai Google"
        callbackURL={redirectTo}
        onError={setFormError}
      />
    </form>
  );
}
