import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Atur Ulang Password" };

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Buat Password Baru"
      subtitle="Gunakan password baru yang aman untuk melindungi akun RenderAI."
    >
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
