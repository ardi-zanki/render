import type { Metadata } from "next";
import Link from "next/link";

import { PublicFooter } from "@/components/brand/public-footer";
import { PublicHeader } from "@/components/brand/public-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getServerSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Kebijakan Privasi RenderAI tentang data akun, unggahan, hasil render, pembayaran, keamanan, dan hak pengguna.",
};

const sections = [
  {
    title: "1. Data yang Kami Kumpulkan",
    body: [
      "RenderAI dapat mengumpulkan data akun seperti nama, email, status verifikasi, preferensi akun, dan aktivitas login.",
      "Kami juga memproses materi yang Anda unggah, arahan visual, hasil render, project, transaksi, dan aktivitas penggunaan aplikasi sejauh diperlukan untuk menyediakan layanan.",
    ],
  },
  {
    title: "2. Cara Kami Menggunakan Data",
    body: [
      "Data digunakan untuk membuat dan mengelola akun, memproses render, menyimpan project, mengirim email penting, memproses pembayaran, menjaga keamanan, dan meningkatkan kualitas layanan.",
      "Kami dapat menggunakan data agregat yang tidak mengidentifikasi pengguna untuk memahami performa produk dan memperbaiki pengalaman penggunaan.",
    ],
  },
  {
    title: "3. Materi Unggahan dan Hasil Render",
    body: [
      "Materi unggahan dan hasil render disimpan agar Anda dapat meninjau, mengunduh, membagikan, atau melanjutkan revisi dalam workspace.",
      "Anda bertanggung jawab memastikan materi yang diunggah tidak melanggar hak pihak lain dan tidak memuat informasi rahasia tanpa izin yang sah.",
    ],
  },
  {
    title: "4. Penyedia Pihak Ketiga",
    body: [
      "RenderAI dapat menggunakan penyedia pihak ketiga untuk autentikasi, email, penyimpanan, pemrosesan AI, pembayaran, analitik, dan infrastruktur aplikasi.",
      "Penyedia tersebut hanya menerima data yang relevan untuk menjalankan fungsi layanan dan tunduk pada kebijakan serta standar keamanan masing-masing.",
    ],
  },
  {
    title: "5. Keamanan",
    body: [
      "Kami menerapkan langkah teknis dan operasional untuk membantu melindungi akun, transaksi, dan data project dari akses tidak sah.",
      "Tidak ada sistem yang sepenuhnya bebas risiko. Anda perlu menjaga kerahasiaan password dan segera menghubungi kami bila menemukan aktivitas mencurigakan.",
    ],
  },
  {
    title: "6. Retensi dan Penghapusan",
    body: [
      "Data disimpan selama akun aktif atau selama diperlukan untuk menyediakan layanan, menyelesaikan transaksi, memenuhi kewajiban hukum, audit, keamanan, dan penyelesaian sengketa.",
      "Anda dapat menghubungi RenderAI untuk meminta bantuan terkait akses, koreksi, atau penghapusan data, dengan mempertimbangkan kewajiban operasional dan hukum yang berlaku.",
    ],
  },
  {
    title: "7. Perubahan Kebijakan",
    body: [
      "Kebijakan Privasi ini dapat diperbarui dari waktu ke waktu. Perubahan penting akan diinformasikan melalui aplikasi, email, atau kanal lain yang relevan.",
    ],
  },
  {
    title: "8. Kontak",
    body: [
      "Jika Anda memiliki pertanyaan tentang privasi atau pemrosesan data, hubungi tim RenderAI melalui halaman kontak.",
    ],
  },
];

export default async function PrivacyPage() {
  const session = await getServerSession();
  const isAuthenticated = Boolean(session?.user && !session.user.isDisabled);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader authenticated={isAuthenticated} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-5 sm:py-12">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase text-primary">
            Legal RenderAI
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
            Kebijakan Privasi
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
            Kebijakan ini menjelaskan bagaimana RenderAI mengumpulkan,
            menggunakan, menyimpan, dan melindungi data saat Anda memakai
            layanan.
          </p>
          <p className="mt-3 text-xs font-medium text-muted-foreground">
            Terakhir diperbarui: 1 Juni 2026
          </p>
        </div>

        <Card className="mt-7">
          <CardContent className="flex flex-col gap-6 py-5">
            {sections.map((section) => (
              <section key={section.title} className="max-w-3xl">
                <h2 className="text-base font-semibold text-foreground">
                  {section.title}
                </h2>
                <div className="mt-3 space-y-3">
                  {section.body.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-sm leading-6 text-muted-foreground"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </CardContent>
        </Card>

        <div className="mt-7 flex flex-col gap-3 border-y border-border/80 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-foreground">
              Butuh membaca aturan penggunaan?
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Ketentuan layanan menjelaskan aturan akun, kredit, pembayaran,
              unggahan, dan hasil render.
            </p>
          </div>
          <Button asChild className="shrink-0">
            <Link href="/terms">Buka Ketentuan Layanan</Link>
          </Button>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
