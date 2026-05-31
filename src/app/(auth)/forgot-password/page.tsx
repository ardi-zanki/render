import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Lupa Password" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Lupa Password?"
      subtitle="Masukkan email Anda, kami kirim tautan untuk mengatur ulang."
      footer={
        <Link href="/login" className="font-semibold text-foreground hover:underline">
          Kembali ke Masuk
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
