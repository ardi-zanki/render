import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Atur ulang password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const hasToken = Boolean(token);

  return (
    <AuthCard
      title={hasToken ? "Buat password baru" : "Tautan tidak valid"}
      subtitle={
        hasToken
          ? "Gunakan password baru yang aman untuk melindungi akun Render Studio."
          : "Tautan reset sudah kedaluwarsa atau tidak valid. Minta tautan baru untuk melanjutkan."
      }
    >
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
