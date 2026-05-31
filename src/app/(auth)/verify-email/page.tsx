import { MailOpen } from "lucide-react";
import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { VerifyEmailActions } from "@/components/auth/verify-email-actions";

export const metadata: Metadata = { title: "Verifikasi Email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <AuthCard
      title="Cek Email Anda"
      subtitle={
        email
          ? `Kami mengirim tautan verifikasi ke ${email}.`
          : "Kami mengirim tautan verifikasi ke email Anda."
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-3 rounded-xl bg-muted/60 px-4 py-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailOpen className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground">
            Klik tautan di email untuk mengaktifkan akun dan mendapatkan{" "}
            <span className="font-semibold text-foreground">3 kredit gratis</span>.
          </p>
        </div>
        <VerifyEmailActions email={email} />
      </div>
    </AuthCard>
  );
}
