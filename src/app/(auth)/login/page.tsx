import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; disabled?: string }>;
}) {
  const { reset, disabled } = await searchParams;

  return (
    <AuthCard
      title="Masuk ke RenderAI"
      subtitle="Selamat datang kembali! Masuk untuk lanjut render."
      footer={
        <>
          Belum punya akun?{" "}
          <Link href="/register" className="font-semibold text-foreground hover:underline">
            Daftar Gratis
          </Link>
        </>
      }
    >
      {reset === "success" && (
        <Alert variant="success">
          <AlertDescription>
            Password berhasil diperbarui. Silakan masuk dengan password baru.
          </AlertDescription>
        </Alert>
      )}
      {disabled === "1" && (
        <Alert variant="destructive">
          <AlertDescription>
            Akun kamu dinonaktifkan. Silakan hubungi admin.
          </AlertDescription>
        </Alert>
      )}
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
