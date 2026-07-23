# RenderAI

RenderAI adalah platform render arsitektur berbasis AI untuk pasar Indonesia.
Pengguna dapat mengunggah gambar desain, memilih mode render, lalu menghasilkan
visual arsitektur realistis dalam hitungan detik.

> Status: MVP selesai dan siap dikembangkan lebih lanjut sebagai project open source.

## Fitur utama

- Render interior dan eksterior berbasis AI
- Edit tekstur dan riwayat versi
- Manajemen project dan render
- Sistem kredit dan pembayaran Midtrans
- Login email/password dan Google OAuth
- Penyimpanan aset melalui Cloudflare R2
- Notifikasi dalam aplikasi dan email
- Halaman berbagi render publik
- Dashboard admin dan audit log
- Unit test, integration test, E2E test, dan GitHub Actions

## Tech stack

- **Framework:** Next.js 16, React 19, TypeScript
- **UI:** Tailwind CSS 4, custom UI components
- **Database:** PostgreSQL, Drizzle ORM
- **Authentication:** Better Auth
- **AI:** fal.ai melalui provider adapter
- **Storage:** Cloudflare R2 atau local storage
- **Payment:** Midtrans atau mock provider
- **Email:** Resend
- **Testing:** Vitest dan Playwright
- **Package manager:** pnpm

## Menjalankan secara lokal

### Prasyarat

- Node.js 22
- pnpm 11
- PostgreSQL

### Instalasi

```bash
git clone <repository-url>
cd renderai
pnpm install
cp .env.example .env.local
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Aplikasi berjalan di:

```text
http://localhost:3210
```

Untuk pengembangan tanpa layanan cloud, gunakan provider lokal dan mock:

```env
AI_PROVIDER=mock
STORAGE_PROVIDER=local
PAYMENT_PROVIDER=mock
RENDER_PROCESSING_MODE=inline
```

## Konfigurasi produksi

Gunakan konfigurasi berikut saat deploy:

```env
AI_PROVIDER=fal
FAL_KEY=

STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

PAYMENT_PROVIDER=midtrans
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=

RESEND_API_KEY=

RENDER_PROCESSING_MODE=worker
```

Google OAuth dan URL aplikasi juga perlu dikonfigurasi sesuai lingkungan deploy.
Lihat validasi environment di `src/env.ts` untuk daftar lengkap variabel yang
didukung.

## Perintah penting

```bash
pnpm dev               # menjalankan development server
pnpm build             # membuat production build
pnpm lint              # menjalankan ESLint
pnpm test              # unit test
pnpm test:integration  # integration test
pnpm test:e2e          # end-to-end test
pnpm worker            # menjalankan render worker
```

Perintah database:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm db:studio
```

## Cara kerja render

Alur render utama:

```text
Validasi pengguna dan kredit
→ simpan render
→ kurangi kredit
→ simpan gambar asli
→ masukkan job ke antrean
→ proses melalui AI provider
→ simpan hasil
→ tandai berhasil
```

Jika proses gagal secara permanen, kredit pengguna dikembalikan secara otomatis.

Render dapat diproses dengan dua mode:

- **`worker`** — direkomendasikan untuk produksi dan deployment multi-instance
- **`inline`** — cocok untuk pengembangan atau deployment single-instance

## Struktur project

```text
src/
├── app/                 # halaman dan API routes
├── components/          # komponen UI dan brand
├── db/                  # schema, migration, dan database client
├── lib/
│   ├── auth/            # autentikasi dan session
│   ├── renders/         # render pipeline dan job processing
│   ├── payments/        # pembayaran dan kredit
│   ├── providers/       # adapter AI dan payment
│   ├── storage/         # local dan R2 storage
│   └── notifications/   # notifikasi aplikasi dan email
└── env.ts               # validasi environment variables
```

Setiap domain mengekspos API publik melalui `service.ts`. Hindari mengimpor file
internal domain secara langsung dari luar modul tersebut.

## Testing

Project ini menggunakan:

- **Vitest** untuk unit dan integration test
- **Playwright** untuk E2E test
- **Mock provider** agar alur render dan pembayaran dapat diuji tanpa kredensial cloud

GitHub Actions menjalankan lint, migration, unit test, integration test, E2E test,
dan production build.

## Kontribusi

Kontribusi sangat diterima.

1. Fork repository ini.
2. Buat branch baru.
3. Lakukan perubahan dan tambahkan test bila diperlukan.
4. Pastikan lint dan seluruh test berhasil.
5. Kirim pull request dengan penjelasan yang jelas.

Sebelum mulai, baca `CONTRIBUTING.md` dan `CODE_OF_CONDUCT.md` jika tersedia.

## Keamanan

Jangan membuka laporan kerentanan melalui issue publik. Gunakan petunjuk di
`SECURITY.md` untuk melaporkan masalah keamanan secara privat.

## Lisensi

Project ini dilisensikan dengan **Apache License 2.0**.

Anda boleh menggunakan, memodifikasi, dan mendistribusikan project ini,
termasuk untuk kebutuhan komersial, selama mengikuti ketentuan lisensi.
Lihat file [`LICENSE`](LICENSE) untuk informasi lengkap.
