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
  searchParams: Promise<{ reset?: string; disabled?: string; reauth?: string }>;
}) {
  const { reset, disabled, reauth } = await searchParams;

  return (
    <AuthCard
      title="Masuk ke RenderAI"
      subtitle="Lanjutkan project visual, riwayat render, dan kredit studio Anda."
      footer={
        <>
          Belum punya akun?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Daftar
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
            Akun Anda dinonaktifkan. Silakan hubungi admin.
          </AlertDescription>
        </Alert>
      )}
      {reauth && (
        <Alert variant="default">
          <AlertDescription>
            {reauth === "admin"
              ? "Sesi admin sudah berakhir. Masuk lagi untuk melanjutkan."
              : "Demi keamanan, masuk lagi sebelum melanjutkan aksi ini."}
          </AlertDescription>
        </Alert>
      )}
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
