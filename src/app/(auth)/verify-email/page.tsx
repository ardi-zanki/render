import { MailOpen } from "lucide-react";
import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { VerifyEmailActions } from "@/components/auth/verify-email-actions";

export const metadata: Metadata = { title: "Verifikasi email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <AuthCard
      title="Cek email Anda"
      subtitle={
        email
          ? `Kami mengirim tautan verifikasi ke ${email}.`
          : "Kami mengirim tautan verifikasi ke email Anda."
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-3 rounded-lg bg-muted/60 px-4 py-5 text-center">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <MailOpen className="size-5" />
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            Klik tautan di email untuk mengaktifkan akun dan mendapatkan{" "}
            <span className="font-semibold text-foreground">kredit awal</span>.
          </p>
        </div>
        <VerifyEmailActions email={email} />
      </div>
    </AuthCard>
  );
}
