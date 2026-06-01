import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Daftar" };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Buat Akun RenderAI"
      subtitle="Mulai dengan kredit awal untuk mencoba workflow render pertama Anda."
      footer={
        <>
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-foreground hover:underline">
            Masuk
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
