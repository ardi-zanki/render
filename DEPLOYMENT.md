# Deployment RenderAI

RenderAI menggunakan satu Docker image untuk dua proses:

- **Web** — menjalankan aplikasi Next.js.
- **Worker** — memproses antrean render dengan `pnpm worker`.

Konfigurasi dilakukan melalui environment variables. Daftar lengkapnya tersedia di `.env.example`.

## Pilih mode pemrosesan render

### Worker mode — direkomendasikan

```env
RENDER_PROCESSING_MODE=worker
```

Web hanya membuat job, lalu worker memproses antrean.

Gunakan mode ini untuk production, lebih dari satu instance web, atau saat job harus tetap diproses setelah web restart.

> Worker harus aktif. Tanpa worker, job akan tetap berstatus `queued`.

### Inline mode

```env
RENDER_PROCESSING_MODE=inline
```

Web memproses render langsung setelah request selesai.

Gunakan hanya untuk deployment satu instance tanpa background worker, seperti paket gratis tertentu. Mode ini tidak cocok untuk scaling dan job yang terputus saat restart tidak diproses ulang secara otomatis.

## Pilihan deployment

| Platform | Cocok untuk | Konfigurasi |
|---|---|---|
| **Render.com** | Deployment termudah | `render.yaml` |
| **VPS** | Kontrol penuh dan biaya fleksibel | `docker-compose.yml`, `Caddyfile` |
| **Cloudflare Containers** | Alternatif container | `Dockerfile` |

Cloudflare Workers tidak didukung karena aplikasi membutuhkan `sharp`, koneksi PostgreSQL TCP, dan proses worker yang berjalan lama. Cloudflare tetap dapat digunakan untuk DNS, CDN, dan R2.

## Prasyarat

Siapkan layanan berikut:

- PostgreSQL, disarankan Neon region Singapore.
- Cloudflare R2 untuk penyimpanan file.
- Resend untuk email.
- Midtrans untuk pembayaran.
- fal.ai untuk proses AI.
- Google OAuth, opsional.
- `BETTER_AUTH_SECRET` dan `JWT_SECRET` yang kuat dan berbeda.

Gunakan database, bucket, key, dan secret yang berbeda untuk staging dan production.

## Cloudflare R2 CORS

Render Studio membaca pixel gambar dari R2, sehingga bucket harus mengizinkan origin aplikasi.

Jalankan:

```bash
pnpm cors:setup
```

Tambahkan origin lain bila diperlukan:

```bash
pnpm cors:setup https://app.example.com https://staging.example.com
```

Untuk hanya menampilkan konfigurasi JSON:

```bash
pnpm cors:setup --print
```

Daftarkan setiap origin secara eksplisit. Hindari wildcard `*`.

## CI/CD GitHub

Workflow tersedia di:

```text
.github/workflows/ci.yml
```

CI menjalankan:

```text
install
migration
lint
unit test
integration test
E2E test
production build
```

CI menggunakan provider mock dan tidak membutuhkan secret production.

Rekomendasi:

- Wajibkan job `Verify` sebelum merge ke `main`.
- Deploy hanya dari `main`.
- Pisahkan staging dan production.
- Gunakan satu metode deployment saja: auto deploy atau deploy hook.

## Deploy ke Render.com

### Web + worker — direkomendasikan

1. Push repository ke GitHub.
2. Pastikan GitHub Actions berhasil.
3. Buat Blueprint dari `render.yaml`.
4. Isi semua secret pada environment group.
5. Gunakan:

```env
RENDER_PROCESSING_MODE=worker
```

6. Jalankan migration dan seed satu kali:

```bash
pnpm db:migrate
pnpm db:seed
```

Blueprint membuat:

- `renderai-web`
- `renderai-worker`

Keduanya menggunakan Docker image yang sama.

### Satu web service tanpa worker

Gunakan mode ini hanya bila paket hosting tidak mendukung background worker.

```env
RENDER_PROCESSING_MODE=inline
```

Jalankan migration saat deploy, tetapi jalankan seed hanya satu kali:

```bash
pnpm db:migrate
pnpm db:seed
```

Jangan menjalankan seed pada setiap deploy karena dapat menimpa konfigurasi paket kredit.

## Deploy ke VPS

Disarankan menggunakan VPS di Singapore atau Jakarta.

Kebutuhan awal yang wajar untuk MVP:

```text
2 vCPU
4 GB RAM
```

Langkah deployment:

```bash
git clone <repository-url>
cd renderai

cp .env.example .env.production
export DOMAIN=app.example.com

docker compose build
docker compose run --rm web pnpm db:migrate
docker compose run --rm web pnpm db:seed
docker compose up -d
```

Caddy akan mengatur HTTPS secara otomatis bila DNS domain sudah mengarah ke VPS.

Untuk menambah worker:

```bash
docker compose up -d --scale worker=2
```

Amankan VPS dengan SSH key, firewall, dan pembaruan sistem otomatis.

## Database migration

Jalankan migration dengan:

```bash
pnpm db:migrate
```

Aturan penting:

- Uji migration di staging terlebih dahulu.
- Buat snapshot database sebelum perubahan destruktif.
- Jangan berbagi database antara staging dan production.
- Jalankan seed hanya saat diperlukan.

## Scaling

Untuk meningkatkan kapasitas render, tambahkan jumlah worker.

```bash
docker compose up -d --scale worker=3
```

Antrean menggunakan PostgreSQL sehingga beberapa worker dapat berjalan bersamaan tanpa mengambil job yang sama.

Redis belum diperlukan.

## Pemeriksaan setelah deploy

Pastikan hal berikut bekerja:

- [ ] HTTPS aktif.
- [ ] `/api/health` mengembalikan `ok: true`.
- [ ] `renderProcessingMode` sesuai konfigurasi.
- [ ] Registrasi dan verifikasi email berhasil.
- [ ] Kredit gratis diberikan setelah verifikasi.
- [ ] Semua mode render berhasil diproses.
- [ ] Hasil render tersimpan dan dapat dibuka dari R2.
- [ ] Kredit dikembalikan saat render gagal.
- [ ] Pembayaran Midtrans dan webhook berhasil.
- [ ] Worker aktif pada worker mode.
- [ ] Admin menampilkan data yang benar.

Setelah mengaktifkan fal.ai, lakukan satu render langsung untuk setiap mode dan periksa log worker serta file hasil di R2.
