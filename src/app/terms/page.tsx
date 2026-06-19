import type { Metadata } from "next";
import Link from "next/link";

import { PublicFooter } from "@/components/brand/public-footer";
import { PublicHeader } from "@/components/brand/public-header";
import { Card, CardContent } from "@/components/ui/card";
import { getServerSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Ketentuan Layanan",
  description:
    "Ketentuan layanan RenderAI untuk akun, kredit, pembayaran, unggahan, hasil render, dan batasan penggunaan.",
};

const sections = [
  {
    title: "1. Penerimaan Ketentuan",
    body: [
      "Dengan membuat akun, mengakses, atau menggunakan RenderAI, Anda menyetujui Ketentuan Layanan ini. Jika Anda tidak menyetujui salah satu bagian, mohon untuk tidak menggunakan layanan.",
      "RenderAI dapat memperbarui ketentuan ini dari waktu ke waktu. Perubahan penting akan diinformasikan melalui aplikasi, email, atau kanal komunikasi lain yang relevan.",
    ],
  },
  {
    title: "2. Akun dan Keamanan",
    body: [
      "Anda bertanggung jawab menjaga kerahasiaan email, password, dan akses akun. Semua aktivitas yang terjadi melalui akun Anda dianggap sebagai aktivitas Anda.",
      "Informasi yang diberikan saat registrasi harus akurat dan tidak boleh menggunakan identitas pihak lain tanpa izin.",
    ],
  },
  {
    title: "3. Penggunaan Layanan",
    body: [
      "RenderAI membantu membuat visual arsitektur dan interior berbasis AI dari materi yang Anda unggah, seperti foto, sketsa, screenshot desain, atau referensi visual.",
      "Layanan ini ditujukan untuk eksplorasi konsep, presentasi awal, mood approval, dan komunikasi desain. Hasil render tetap perlu ditinjau sebelum digunakan untuk keputusan teknis, konstruksi, legal, atau komersial yang berdampak tinggi.",
    ],
  },
  {
    title: "4. Kredit, Pembayaran, dan Paket",
    body: [
      "Sebagian proses render menggunakan kredit. Jumlah kredit, harga paket, bonus, dan aturan pemakaian dapat berubah sesuai kebijakan RenderAI.",
      "Kredit yang sudah digunakan untuk proses render yang berhasil tidak dapat dikembalikan. Jika render gagal karena gangguan sistem, RenderAI dapat mengembalikan kredit sesuai status yang tercatat di sistem.",
      "Pembayaran diproses melalui penyedia pembayaran pihak ketiga. Status transaksi, biaya, dan validasi pembayaran mengikuti data dari penyedia tersebut.",
    ],
  },
  {
    title: "5. Materi Unggahan dan Hak Penggunaan",
    body: [
      "Anda menyatakan memiliki hak, izin, atau kewenangan yang diperlukan atas materi yang diunggah ke RenderAI.",
      "Anda tetap memiliki hak atas materi yang Anda unggah. Dengan menggunakan layanan, Anda memberi RenderAI izin non-eksklusif untuk memproses, menyimpan, menampilkan, dan menghasilkan output dari materi tersebut sejauh diperlukan untuk menyediakan layanan.",
    ],
  },
  {
    title: "6. Hasil Render",
    body: [
      "Hasil render dapat digunakan oleh Anda untuk kebutuhan presentasi, diskusi, eksplorasi desain, atau kebutuhan bisnis Anda, selama tidak melanggar hukum, hak pihak ketiga, atau ketentuan ini.",
      "Karena hasil dibuat dengan bantuan AI, RenderAI tidak menjamin seluruh detail, proporsi, material, pencahayaan, teks, atau elemen visual selalu akurat. Anda bertanggung jawab melakukan pengecekan akhir sebelum hasil digunakan.",
    ],
  },
  {
    title: "7. Batasan Penggunaan",
    body: [
      "Anda tidak boleh menggunakan RenderAI untuk mengunggah materi ilegal, melanggar hak cipta, mengandung data sensitif tanpa izin, meniru identitas pihak lain, atau menghasilkan konten yang merugikan pihak lain.",
      "Anda juga tidak boleh mencoba mengakses sistem secara tidak sah, mengganggu layanan, melakukan penyalahgunaan otomatisasi, atau menggunakan layanan untuk aktivitas yang melanggar hukum.",
    ],
  },
  {
    title: "8. Ketersediaan Layanan",
    body: [
      "RenderAI berupaya menjaga layanan tetap tersedia dan berjalan baik. Namun, layanan dapat terganggu karena pemeliharaan, pembaruan sistem, gangguan jaringan, penyedia AI, penyimpanan, pembayaran, atau faktor lain di luar kendali RenderAI.",
      "RenderAI tidak bertanggung jawab atas kerugian tidak langsung yang timbul dari gangguan sementara, keterlambatan proses, atau ketidakakuratan hasil AI.",
    ],
  },
  {
    title: "9. Privasi dan Data",
    body: [
      "Pemrosesan data pribadi dan materi unggahan dijelaskan lebih rinci di halaman Kebijakan Privasi RenderAI.",
      "Anda bertanggung jawab memastikan materi yang diunggah tidak berisi data pribadi atau rahasia pihak lain tanpa izin yang sah.",
    ],
  },
  {
    title: "10. Penghentian Akses",
    body: [
      "RenderAI dapat membatasi, menangguhkan, atau menghentikan akses akun jika terdapat indikasi penyalahgunaan, pelanggaran ketentuan, risiko keamanan, pembayaran bermasalah, atau permintaan hukum yang sah.",
      "Anda dapat berhenti menggunakan layanan kapan saja. Beberapa data mungkin tetap disimpan selama diperlukan untuk kepatuhan, keamanan, audit, atau penyelesaian transaksi.",
    ],
  },
  {
    title: "11. Kontak",
    body: [
      "Jika Anda memiliki pertanyaan tentang Ketentuan Layanan ini, hubungi tim RenderAI melalui kanal dukungan yang tersedia di aplikasi.",
    ],
  },
];

export default async function TermsPage() {
  const session = await getServerSession();
  const isAuthenticated = Boolean(session?.user && !session.user.isDisabled);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader authenticated={isAuthenticated} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-5 sm:py-12">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase text-primary">
            Legal
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
            Ketentuan Layanan
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
            Ketentuan ini menjelaskan aturan penggunaan RenderAI, termasuk akun,
            kredit, pembayaran, unggahan, hasil render, dan batasan penggunaan
            layanan.
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Untuk penjelasan pemrosesan data pribadi, baca{" "}
            <Link href="/privacy" className="font-semibold text-primary hover:underline">
              Kebijakan Privasi
            </Link>
            .
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
      </main>

      <PublicFooter />
    </div>
  );
}
