# RenderAI

RenderAI adalah aplikasi open-source untuk membuat dan mengelola visual arsitektur berbasis AI.

## Fitur utama

- Render interior dan eksterior berbasis AI
- Edit tekstur dan riwayat versi
- Manajemen proyek dan hasil render
- Sistem kredit dan pembayaran Midtrans
- Autentikasi email/password dan Google OAuth
- Penyimpanan lokal atau Cloudflare R2
- Dashboard admin, notifikasi, dan audit log

## Teknologi

- Next.js 16, React 19, dan TypeScript
- Tailwind CSS 4
- PostgreSQL dan Drizzle ORM
- Better Auth
- fal.ai, Cloudflare R2, Midtrans, dan Resend
- Vitest dan Playwright

## Mulai cepat

### Prasyarat

- Node.js 22
- pnpm 11
- Docker, atau PostgreSQL yang berjalan secara lokal

### Instalasi

```bash
git clone https://github.com/ardi-zanki/render.git renderai
cd renderai
pnpm install
cp .env.example .env.local
```

Untuk menjalankan PostgreSQL melalui Docker:

```bash
docker compose -f docker-compose.local.yml up -d db
```

Sesuaikan nilai berikut di `.env.local`:

```env
DATABASE_URL=postgresql://renderai:renderai@localhost:5433/renderai
BETTER_AUTH_SECRET=<secret-acak-minimal-16-karakter>
JWT_SECRET=<secret-acak-lain-minimal-16-karakter>

AI_PROVIDER=mock
STORAGE_PROVIDER=local
PAYMENT_PROVIDER=mock
RENDER_PROCESSING_MODE=inline
```

Kemudian siapkan database dan jalankan aplikasi:

```bash
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Buka [http://localhost:3210](http://localhost:3210). Dalam mode development, email verifikasi ditampilkan di terminal jika `RESEND_API_KEY` tidak diisi.

## Perintah utama

| Perintah | Kegunaan |
|---|---|
| `pnpm dev` | Menjalankan development server |
| `pnpm build` | Membuat production build |
| `pnpm lint` | Menjalankan ESLint |
| `pnpm test` | Menjalankan unit test |
| `pnpm test:integration` | Menjalankan integration test |
| `pnpm test:e2e` | Menjalankan E2E test secara lokal |
| `pnpm worker` | Menjalankan render worker |
| `pnpm db:migrate` | Menjalankan migration database |
| `pnpm db:seed` | Mengisi data awal |

## Pemrosesan render

Web menyimpan render ke antrean PostgreSQL. Render kemudian diproses oleh worker atau langsung oleh web, sesuai `RENDER_PROCESSING_MODE`.

- `worker` direkomendasikan untuk production dan deployment multi-instance.
- `inline` hanya cocok untuk development atau satu instance web.

Lihat [DEPLOYMENT.md](DEPLOYMENT.md) untuk konfigurasi production, Render.com, dan VPS.

## Pengujian

GitHub Actions menjalankan migration, lint, pemeriksaan design system, unit test, integration test, dan production build. E2E test tersedia untuk dijalankan secara lokal dengan Playwright.

## Kontribusi

Kontribusi melalui issue dan pull request sangat diterima.

1. Fork repository dan buat branch baru.
2. Lakukan perubahan beserta test yang relevan.
3. Jalankan lint dan test.
4. Kirim pull request dengan penjelasan yang ringkas dan jelas.

## Lisensi

RenderAI tersedia di bawah [Apache License 2.0](LICENSE).
