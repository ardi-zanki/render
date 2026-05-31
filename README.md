# RenderAI

Platform SaaS render arsitektur berbasis AI untuk pasar Indonesia. Brand &
UX terinspirasi **Vrendr**, fungsionalitas mengacu **MyArchitectAI**. Lihat
PRD lengkap di `../RenderAI_PRD_Final/`.

> Upload gambar desain, pilih mode render, dan dapatkan visual arsitektur
> realistis dalam hitungan detik.

## Tech stack

| Layer        | Teknologi                                          |
| ------------ | -------------------------------------------------- |
| Package mgr  | pnpm 11.5                                           |
| Framework    | Next.js 16.2.6 (App Router, Turbopack)             |
| UI runtime   | React 19.2                                          |
| Language     | TypeScript 5.9                                      |
| CSS          | Tailwind CSS v4                                     |
| UI primitive | `@base-ui/react` 1.5                               |
| Komponen     | Pola Shadcn (custom, di `components/ui`)            |
| Ikon         | `lucide-react` 1.17                                |
| Tema         | `next-themes` (light/dark, class-based)            |
| Font         | Plus Jakarta Sans (teks) · Geist Mono (angka/kode) |

Stack lengkap (auth, DB, storage, payment, AI provider) ada di PRD §5.

## Menjalankan

```bash
pnpm install   # sekali; build script sharp diizinkan via pnpm-workspace.yaml
pnpm dev       # http://localhost:3000
pnpm build     # build produksi
pnpm lint      # eslint
```

Dari folder induk (`RumAI/`): `pnpm --dir renderai dev`.

## Design system

Halaman beranda (`src/app/page.tsx`) saat ini adalah **showcase brand kit** —
warna, tipografi, tombol, badge, form, kartu mode render, dan kartu harga.

### Token warna (`src/app/globals.css`)

Semua warna didefinisikan sebagai CSS variable di `:root` (light) dan `.dark`,
lalu dipetakan ke utility Tailwind via `@theme inline`. Token utama:

- **Brand:** `--primary` navy `#1B2A5E` (dark mode `#3A4F94`) · `--brand-violet` (aksen AI) · `--foreground` ink
- **Permukaan:** `--background`, `--card`, `--muted`, `--border`
- **Semantik:** `--success`, `--warning`, `--destructive`, `--info`

Gunakan via kelas: `bg-primary`, `text-foreground`, `border-border`, dll.
Mode gelap mengikuti kelas `.dark` (di-set `next-themes`) — tidak perlu
menulis ulang warna, cukup pakai token.

### Komponen

```
src/components/
  ui/        button · card · input · textarea · label · badge ·
             separator · slot · mode-toggle
  brand/     logo (mark + wordmark) · credit-pill
  theme-provider.tsx
src/lib/utils.ts   # cn() — clsx + tailwind-merge
```

Tombol `<Button>` default berbentuk pill (radius penuh) sesuai gaya Vrendr;
varian: `default` (navy), `inverse` (ink, auto-adaptif tema), `secondary`,
`outline`, `ghost`, `destructive`, `link`. Dukung `asChild` untuk render
sebagai `<Link>`.

## Backend foundation (Phase 1b)

```
src/
  env.ts                 # Zod-validated env (core required, creds optional)
  db/
    schema/{auth,app}.ts # Drizzle schema — full ERD (18 tables)
    index.ts             # postgres-js + drizzle client
    seed.ts              # payment_packages seed (PRD §23.2)
  lib/
    auth.ts              # Better Auth: email/pw + Google, verification, sessions
    auth-client.ts       # client SDK
    session.ts           # requireUser / requireVerifiedUser / requireAdmin
    credits.ts           # idempotent credit ledger (row-locked, never negative)
    provisioning.ts      # profile + balance + default project + 3 free credits
    jwt.ts               # jose tokens w/ single-use auth_tokens (PRD §11)
    rate-limit.ts        # DB-backed limiter, all PRD §12 rules
    email/               # provider layer + Resend + templates + email_logs
    storage/             # provider layer + R2 (S3) + render asset key builder
    providers/{ai,payment}/  # adapter interfaces + stubs (wired Phase 2/4)
    validations/auth.ts  # Zod schemas (Bahasa Indonesia errors)
  proxy.ts               # edge auth guard for protected routes (Next 16 convention)
  app/api/auth/[...all]/ # Better Auth route handler
```

Database commands:

```bash
pnpm db:generate   # create migration from schema
pnpm db:migrate    # apply migrations
pnpm db:seed       # seed credit packages
pnpm db:studio     # Drizzle Studio
pnpm smoke:auth    # runtime test: signup → provisioning → credits → rate limit
```

Auth wiring: a new user gets a profile, a 0 credit balance, and a default
project ("Project Saya") on creation; the **3 free credits** are granted
(idempotently) once the email is verified — or immediately for Google OAuth
users (already verified). Without `RESEND_API_KEY`, verification/reset links
are printed to the dev console instead of emailed.

## Auth & app UI

Working pages on top of the Phase 1b backend:

- **Public:** `/` (landing), `/design-system` (brand kit), `/login`,
  `/register`, `/forgot-password`, `/reset-password`, `/verify-email`.
- **Protected** (app shell w/ sidebar + topbar): `/dashboard` (real data —
  credit balance, counts, default project), `/payments` (live credit packages
  from DB), and stubs for `/projects`, `/renders`, `/renders/new`,
  `/notifications`, `/settings`.

Full flow works in the browser: register → (dev: verification link printed to
the server console) → click link → auto sign-in → dashboard shows the 3 free
credits + "Project Saya". Forms use the `authClient` (`signUp`, `signIn`,
`requestPasswordReset`, `resetPassword`, `sendVerificationEmail`, `signOut`).

> Dev demo account (already verified): **demo@renderai.test** / `rahasia123`.

## Render core & Rendr Studio (Phase 2)

The render pipeline (`src/lib/renders/service.ts`) is: check balance → create
render row → deduct credit (idempotent) → store original → call AI provider →
persist result asset → mark success. On failure the render is marked failed and
the credit is refunded. Entry point: `POST /api/renders` (multipart upload).

- **Rendr Studio** (`/renders/new`) — the workspace: mode (Interior/Exterior/
  Style Transfer/Upscale), style, location, time & weather, image upload,
  instruction, **Gass Render!**, before/after view, download, and a scene grid.
- **Riwayat Render** (`/renders`) and **Project** (`/projects`) show real data;
  the dashboard lists recent renders.

**AI provider** (`src/lib/providers/ai/`): `myarchitectai` implements the real
API (`POST https://api.myarchitectai.com/v1/render/{interior,exterior}` etc.,
`x-api-key` header, `{ image: <public url>, prompt, outputFormat }` → `{ output }`;
outputs are fetched immediately since the CDN expires them in ~5 min). A `mock`
provider (sharp-based) and a `local` storage provider make the full flow
testable locally without any cloud credentials. Dev defaults: `AI_PROVIDER=mock`,
`STORAGE_PROVIDER=local`. For production set `AI_PROVIDER=myarchitectai` +
`MYARCHITECTAI_API_KEY` and `STORAGE_PROVIDER=r2` + R2 creds.

```bash
pnpm smoke:render   # render pipeline test (credit, storage, provider, assets)
```

> **Port:** the dev server runs on **3210** (`pnpm dev`) because port 3000 is
> used by another local project; `APP_URL`/`BETTER_AUTH_URL` match it.

## Credit purchase & payment (Phase 3)

Buy-credits flow (`src/lib/payments/service.ts`): pick package → create a pending
`payments` row + provider checkout → provider webhook → **idempotent** credit
top-up (`applyCreditChange` keyed by `payment:<id>`; a payment already `paid` is
a no-op, so duplicate webhooks never double-credit).

- `/payments` — package cards with **Beli Paket**, live balance, transaction
  history; `/payments/finish` (result) and `/payments/simulate` (dev mock).
- `POST /api/payments/checkout` (auth) → Snap token / redirect URL.
- `POST /api/payments/webhook` (public; provider signature verified).

**Payment provider** (`src/lib/providers/payment/`): `midtrans` implements Snap
(`POST {app[.sandbox].midtrans.com}/snap/v1/transactions`, Basic auth) and
webhook verification (`sha512(order_id + status_code + gross_amount + serverKey)`).
A `mock` provider routes checkout to the in-app simulate page so the full
checkout → webhook → credit flow runs locally. Dev default: `PAYMENT_PROVIDER=mock`.
For production set `PAYMENT_PROVIDER=midtrans` + `MIDTRANS_SERVER_KEY` /
`MIDTRANS_CLIENT_KEY` and point the Midtrans notification URL at
`/api/payments/webhook`.

```bash
pnpm smoke:payment   # checkout → webhook → idempotent top-up
```

## Notifications & account settings (Phase 4)

- **Notifications** (`src/lib/notifications/service.ts`): `notifyUser` writes an
  in-app `notifications` row and, gated by
  `user_profiles.emailNotificationsEnabled`, sends an email (never throws —
  notifications can't break the originating flow). Wired into the render flow
  (success / failed / low-credit) and payment flow (success). UI: a topbar bell
  with unread badge + panel (mark read / mark all), a `/notifications` page, and
  `POST /api/notifications/read`.
- **Account settings** (`/settings`): edit profile (name via Better Auth
  `updateUser`, display name in `user_profiles`), preferences (email
  notifications, default render mode/format) via server actions, and change
  password via Better Auth `changePassword`.

## Status & langkah berikutnya

- [x] **Phase 1a** — Scaffold + design system + dark mode
- [x] **Phase 1b** — Better Auth, PostgreSQL/Drizzle, R2, Resend, rate limiter, JWT
- [x] **Auth UI + dashboard** — login/register/verify/reset, app shell, dashboard
- [x] **Phase 2** — Project & Render core, Rendr Studio, MyArchitectAI provider
- [x] **Phase 3** — Credit purchase + Midtrans payment (Snap + webhook)
- [x] **Phase 4** — Notifications (in-app + email) + account settings
- [ ] Phase 5 — Admin (users, renders, payments, audit log)

Still stubbed (by phase): Google OAuth (`GOOGLE_CLIENT_*`), email sending
(`RESEND_API_KEY`), R2 + Midtrans + MyArchitectAI credentials. Render execution
is inline in the request; a `render_jobs` queue/worker can take over later.

> **Catatan provider AI:** PRD menyebut "MyArchitectAI API". Perlu diverifikasi
> apakah API publiknya tersedia; arsitektur provider/adapter (PRD §6.1)
> memudahkan ganti ke Replicate / fal.ai / OpenAI image bila perlu.
