"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { GoogleButton } from "@/components/auth/google-button";
import { OrDivider } from "@/components/auth/or-divider";
import { PasswordInput } from "@/components/auth/password-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { zodFieldErrors } from "@/lib/form";
import { registerSchema } from "@/lib/validations/auth";

export function RegisterForm() {
  const router = useRouter();
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [agree, setAgree] = useState(false);
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
    const parsed = registerSchema.safeParse({ ...values, agreeTerms: agree });
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setLoading(true);
    const { error } = await signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      callbackURL: "/dashboard",
    });
    if (error) {
      setFormError(authErrorMessage(error));
      setLoading(false);
      return;
    }
    router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nama lengkap</Label>
        <Input
          id="name"
          value={values.name}
          onChange={update("name")}
          placeholder="Nama Anda"
          aria-invalid={!!errors.name}
          autoComplete="name"
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={values.email}
          onChange={update("email")}
          placeholder="nama@email.com"
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
          placeholder="Min. 8 karakter"
          aria-invalid={!!errors.password}
          autoComplete="new-password"
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password}</p>
        )}
      </div>

      <label className="flex items-start gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          className="mt-0.5 size-4 accent-primary"
        />
        <span>
          Saya setuju dengan{" "}
          <Link href="/syarat" className="font-medium text-primary underline">
            Syarat &amp; Ketentuan
          </Link>
        </span>
      </label>
      {errors.agreeTerms && (
        <p className="-mt-2 text-xs text-destructive">{errors.agreeTerms}</p>
      )}

      <Button type="submit" disabled={loading} className="mt-1 w-full">
        {loading && <Loader2 className="animate-spin" />}
        Daftar
      </Button>

      <OrDivider />
      <GoogleButton label="Daftar dengan Google" onError={setFormError} />
    </form>
  );
}
