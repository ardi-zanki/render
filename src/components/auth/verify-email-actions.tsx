"use client";

import { Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { sendVerificationEmail } from "@/lib/auth-client";

export function VerifyEmailActions({ email }: { email?: string }) {
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [loading, setLoading] = useState(false);

  async function resend() {
    if (!email) return;
    setLoading(true);
    setStatus("idle");
    const { error } = await sendVerificationEmail({
      email,
      callbackURL: "/dashboard",
    });
    setLoading(false);
    setStatus(error ? "error" : "sent");
  }

  return (
    <div className="flex flex-col gap-3">
      {status === "sent" && (
        <Alert variant="success">
          <MailCheck />
          <AlertDescription>Email verifikasi sudah dikirim ulang.</AlertDescription>
        </Alert>
      )}
      {status === "error" && (
        <Alert variant="destructive">
          <AlertDescription>
            Gagal mengirim email. Coba lagi sebentar.
          </AlertDescription>
        </Alert>
      )}

      {email && (
        <Button onClick={resend} disabled={loading} className="w-full">
          {loading && <Loader2 className="animate-spin" />}
          Kirim Ulang Email Verifikasi
        </Button>
      )}
      <Button variant="ghost" asChild>
        <Link href="/login">Kembali ke Masuk</Link>
      </Button>
    </div>
  );
}
