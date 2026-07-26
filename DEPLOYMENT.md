# Deployment RenderAI

RenderAI menggunakan satu Docker image untuk dua proses:

- **Web** menjalankan aplikasi Next.js.
- **Worker** memproses antrean render.

Konfigurasi lengkap tersedia di [.env.example](.env.example).

## Mode pemrosesan

Gunakan worker untuk production:

```env
RENDER_PROCESSING_MODE=worker
```

Web akan membuat job dan worker akan memprosesnya. Jika worker tidak aktif, job tetap berstatus `queued`.

Mode `inline` memproses render melalui web dan hanya cocok untuk satu instance:

```env
RENDER_PROCESSING_MODE=inline
```

## Layanan yang diperlukan

- PostgreSQL
- Cloudflare R2
- Resend
- Midtrans
- fal.ai
- Google OAuth, jika diperlukan

Gunakan credential terpisah untuk staging dan production. `BETTER_AUTH_SECRET` dan `JWT_SECRET` harus kuat, berbeda, dan tidak disimpan di repository.

## Render.com

File [render.yaml](render.yaml) membuat satu web service dan satu worker dengan Docker image yang sama.

1. Push repository ke GitHub.
2. Buat Blueprint baru dari `render.yaml`.
3. Isi seluruh environment variable yang ditandai sebagai secret.
4. Pastikan web dan worker menggunakan `RENDER_PROCESSING_MODE=worker`.
5. Jalankan migration dan seed satu kali melalui Render Shell:

```bash
pnpm db:migrate
pnpm db:seed
```

Blueprint membuat layanan berikut:

- `renderai-web`
- `renderai-worker`

Jangan menjalankan seed pada setiap deployment karena seed memperbarui konfigurasi paket kredit.

## VPS

Deployment VPS menggunakan [docker-compose.yml](docker-compose.yml) dan [Caddyfile](Caddyfile). Caddy menyediakan HTTPS otomatis setelah DNS domain mengarah ke server.

Kebutuhan awal yang disarankan:

- 2 vCPU
- 4 GB RAM

Langkah deployment:

```bash
git clone https://github.com/ardi-zanki/render.git renderai
cd renderai
cp .env.example .env.production
```

Isi `.env.production`, lalu jalankan:

```bash
export DOMAIN=app.example.com
docker compose build
docker compose run --rm web pnpm db:migrate
docker compose run --rm web pnpm db:seed
docker compose up -d
```

Tambahkan worker saat kapasitas render perlu ditingkatkan:

```bash
docker compose up -d --scale worker=2
```

Antrean menggunakan PostgreSQL dan mendukung beberapa worker tanpa Redis.

## Cloudflare R2 CORS

Bucket R2 harus mengizinkan origin aplikasi agar Render Studio dapat membaca pixel gambar.

```bash
pnpm cors:setup
```

Untuk menambahkan origin lain:

```bash
pnpm cors:setup https://app.example.com https://staging.example.com
```

Daftarkan setiap origin secara eksplisit dan hindari wildcard `*`.

## Database

Jalankan migration pada setiap perubahan schema:

```bash
pnpm db:migrate
```

Sebelum migration production:

- Uji migration di staging.
- Buat backup sebelum perubahan destruktif.
- Jangan gunakan database yang sama untuk staging dan production.
- Jalankan seed hanya saat data awal perlu diperbarui.

## CI/CD

Workflow [.github/workflows/ci.yml](.github/workflows/ci.yml) berjalan untuk pull request dan push ke `main`. CI menjalankan:

- Migration database
- Lint dan pemeriksaan design system
- Unit test dan integration test
- Production build

Job deploy berjalan setelah verifikasi berhasil. Gunakan salah satu metode deployment: auto-deploy Render atau deploy hook.

## Pemeriksaan setelah deployment

- [ ] HTTPS aktif.
- [ ] `/api/health` mengembalikan `ok: true`.
- [ ] Web dan worker menggunakan mode pemrosesan yang benar.
- [ ] Registrasi dan verifikasi email berhasil.
- [ ] Render berhasil diproses dan disimpan di R2.
- [ ] Kredit dikembalikan saat render gagal.
- [ ] Pembayaran dan webhook Midtrans berhasil.
- [ ] Dashboard admin dapat diakses oleh admin.
