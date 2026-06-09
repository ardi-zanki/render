import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Atur ulang password" };

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Buat password baru"
      subtitle="Gunakan password baru yang aman untuk melindungi akun RenderAI."
    >
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
