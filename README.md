# RenderAI

Platform SaaS render arsitektur berbasis AI untuk pasar Indonesia. Brand &
UX terinspirasi **Vrendr**, fungsionalitas mengacu **MyArchitectAI**. Lihat
PRD lengkap di `../RenderAI_PRD_Final/`.

> Unggah gambar desain, pilih mode render, dan dapatkan visual arsitektur
> realistis dalam hitungan detik.

## Tech stack

| Layer        | Teknologi                                          |
| ------------ | -------------------------------------------------- |
| Package mgr  | pnpm 11.5.2                                         |
| Runtime      | Node.js 22 (Docker/CI)                              |
| Framework    | Next.js 16.2.9 (App Router, Turbopack)             |
| UI runtime   | React 19.2.7                                        |
| Language     | TypeScript 6.0.3                                    |
| CSS          | Tailwind CSS v4.3                                   |
| Komponen     | Custom UI primitives di `src/components/ui`         |
| Ikon         | `lucide-react` 1.20                                 |
| Tema         | Local `ThemeProvider` (light/dark/system, class-based) |
| Font         | Plus Jakarta Sans (teks) · Geist Mono (angka/kode) |
| Testing      | Vitest 4.1 + Playwright 1.61                        |

Stack lengkap (auth, DB, storage, payment, AI provider) ada di PRD §5.

## Menjalankan

```bash
pnpm install   # sekali; build script sharp diizinkan via pnpm-workspace.yaml
pnpm dev       # http://localhost:3210
pnpm build     # build produksi
pnpm lint      # eslint
pnpm test      # unit test (Vitest)
pnpm test:integration # integration test DB (credits + payments)
pnpm test:e2e  # Playwright auth + render/search/share/support flow
```

Dari folder induk (`RumAI/`): `pnpm --dir renderai dev`.

## Design system

Halaman `/design-system` adalah **showcase brand kit** — warna, tipografi,
tombol, badge, form, kartu mode render, dan kartu harga.

### Token warna (`src/app/globals.css`)

Semua warna didefinisikan sebagai CSS variable di `:root` (light) dan `.dark`,
lalu dipetakan ke utility Tailwind via `@theme inline`. Token utama:

- **Brand:** `--primary` navy `#173b67` (dark mode `#91b8f2`) · `--brand-violet` (aksen AI) · `--foreground` ink
- **Permukaan:** `--background`, `--card`, `--muted`, `--border`
- **Semantik:** `--success`, `--warning`, `--destructive`, `--info`

Gunakan via kelas: `bg-primary`, `text-foreground`, `border-border`, dll.
Mode gelap mengikuti kelas `.dark` yang diatur oleh local
`src/components/theme-provider.tsx`; tidak perlu menulis ulang warna, cukup
pakai token.

### Komponen

```
src/components/
  ui/        button · card · input · textarea · label · badge ·
             separator · slot · mode-toggle · modal · popover ·
             select · confirm-dialog
  brand/     logo (mark + wordmark) · credit-pill
  theme-provider.tsx
src/lib/utils.ts   # cn() — clsx + tailwind-merge
```

Tombol `<Button>` memakai radius `rounded-md` (4px) sesuai kontrak design
system; varian: `default` (navy), `inverse` (ink, auto-adaptif tema),
`secondary`, `outline`, `ghost`, `destructive`, `link`. Dukung `asChild` untuk
render sebagai `<Link>`.

### Token tambahan

- **Shadow:** `shadow-hairline` · `shadow-soft` · `shadow-floating` (kontrol
  mengambang di atas gambar) · `shadow-elevated` (menu) · `shadow-dialog`
  (modal). Jangan pakai `shadow-sm`/`shadow-md` default Tailwind.
- **Type scale:** `text-display` (40px, headline landing) dan `text-micro`
  (11px, counter/byline/badge mini) melengkapi skala Tailwind bawaan.

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
    providers/{ai,payment}/  # adapter interfaces + mock/real providers
    renders/             # create, jobs, assets, queries, archive-delete, processor
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
pnpm test          # unit test cepat (co-located di src)
pnpm test:integration # test DB untuk credits + payments
pnpm test:e2e      # Playwright; auth + render memakai mock provider
```

Auth wiring: a new user gets a profile, a 0 credit balance, and a default
project ("Project Saya") on creation; the **3 free credits** are granted
(idempotently) once the email is verified — or immediately for Google OAuth
users (already verified). Without `RESEND_API_KEY`, verification/reset links
are printed to the dev console instead of emailed.

## Konvensi kode & istilah

**`service.ts` = pintu publik domain.** Setiap modul `src/lib/<domain>/`
mengekspos API-nya lewat `service.ts`. Untuk domain kecil, `service.ts` berisi
implementasinya langsung (`projects`, `payments`, `account`, `admin`). Untuk
domain yang dipecah ke banyak file (`renders`), `service.ts` adalah **barrel**
yang me-`re-export` dari `create.ts`, `jobs.ts`, `queries.ts`, dst. Konsumen di
luar domain mengimpor dari `service.ts`, bukan dari file internalnya.

**Error API.** Petakan error domain ke HTTP lewat `errorResponse()` di
`src/lib/api/errors.ts` agar status & payload konsisten antar-route.

**Label status.** Satu sumber kebenaran per domain: render di
`src/lib/renders/labels.ts`, pembayaran di `src/lib/payments/labels.ts`. Jangan
menduplikasi map status di halaman.

**Server action vs API route.** Pakai **server action** (`actions.ts` co-located
dengan page) untuk mutasi yang dipicu dari form di halaman itu sendiri — mis.
rename/arsip project, simpan pengaturan. Pakai **API route** (`src/app/api/...`)
saat endpoint perlu dipanggil dari client lewat `fetch` (upload multipart,
polling status, aksi yang dipakai dari beberapa tempat) atau oleh pihak luar
(webhook provider). Singkatnya: form internal halaman → server action; kontrak
HTTP yang dipanggil JS/eksternal → API route.

### Glosarium istilah UI

Indonesia-first, formal tapi ramah ("Anda", tanpa slang seperti "nyalain"/"dulu
ya"). Pakai kolom kiri, hindari kolom kanan:

| Pakai | Hindari |
| ----- | ------- |
| Project | Proyek |
| Unggah | Upload |
| Render | Generate |
| Kredit | Credit / koin |
| Top up | Beli Kredit / Beli Paket |
| Segera hadir | Coming Soon |

Status: render memakai **Antri/Antrean**, pembayaran memakai **Menunggu** —
keduanya warna `warning`, dibedakan karena beda konteks (antrean vs. transaksi).

## Auth & app UI

Working pages on top of the Phase 1b backend:

- **Public:** `/` (landing), `/design-system` (brand kit), `/login`,
  `/register`, `/forgot-password`, `/reset-password`, `/verify-email`,
  and `/s/[slug]` (public render share).
- **Protected** (app shell w/ sidebar + topbar): `/dashboard`, `/projects`,
  `/projects/[id]`, `/renders`, `/renders/new`, `/renders/[id]`, `/payments`,
  `/notifications`, `/support`, and `/settings`.
- **Admin:** `/admin`, `/admin/users`, `/admin/projects`, `/admin/renders`,
  `/admin/payments`, `/admin/credits`, `/admin/packages`,
  `/admin/notifications`, `/admin/settings`, and `/admin/audit`.

Full flow works in the browser: register → (dev: verification link printed to
the server console) → click link → auto sign-in → dashboard shows the 3 free
credits + "Project Saya". Forms use the `authClient` (`signUp`, `signIn`,
`requestPasswordReset`, `resetPassword`, `sendVerificationEmail`, `signOut`).
Smoke scripts or E2E flows that use `demo@renderai.test` require that user to
exist in the local/test database first.

Sidebar behavior:

- Header uses a compact text-only **RenderAI.** wordmark with a panel toggle.
- **Buat render** opens the Studio.
- **Cari render** opens a command menu with a quick **Buat Render** action and recent
  renders. Search is global across render data only; selecting a result opens
  `/renders/[id]`.
- Page-level search on `/projects`, `/projects/[id]`, and `/renders` is
  debounced, auto-submits, and includes a clear button that restores the default
  list.

Profile menu:

- **Support** opens the in-app `/support` page, which provides Email, WhatsApp,
  and Instagram contact channels.
- **Logout** closes the menu immediately and shows a short loading overlay
  before redirecting to `/login`.

## Render core & Render Studio (Phase 2)

The render pipeline (`src/lib/renders/`) is split by concern: `create`, `jobs`,
`assets`, `queries`, `archive-delete`, and `processor`. Flow: check balance →
create render row → deduct credit (idempotent) → store original → enqueue job →
worker/process job → call AI provider → persist result asset → mark success. On
final failure the render is marked failed and the credit is refunded. Entry
point: `POST /api/renders` (multipart upload). Processing is controlled by
`RENDER_PROCESSING_MODE`:

- `worker` (recommended for production) — the web service only enqueues jobs and
  a dedicated `pnpm worker` process drains the queue. Scales to multiple
  instances and survives web restarts.
- `inline` — the web process renders in-band right after the request commits
  (same processing path, no separate service). The default locally, and a valid
  choice for **single-instance deploys without a worker service** (e.g. Render
  Free). Fine for low volume; switch to `worker` once you scale out, since inline
  has no background poller to retry jobs orphaned by a restart.

- **Render Studio** (`/renders/new`) — the workspace: editable render name,
  Interior/Exterior configuration, style, location, time & weather, image
  upload, sticky instruction prompt, **Render**, before/after comparison,
  wheel/trackpad zoom, texture edit, and version history.
- **Open Studio** from a render detail or share page opens `/renders/new` with
  the source render loaded, config pre-filled, and prior versions available.
- **Edit Texture** lets users select a region and apply a texture from Library,
  Upload, or Deskripsi. The Deskripsi path sends only the texture description
  plus the selected mask, without an extra instruction field.
- **Riwayat Render** (`/renders`) and **Project** (`/projects`) show real data;
  dashboard recent renders are clickable cards that open render details.

**AI provider** (`src/lib/providers/ai/`): `fal` is the production provider. It
uses the official `@fal-ai/client`: it uploads local/R2 image bytes to fal
storage, calls queue-based model inference, fetches result URLs immediately, and
normalizes the result to the requested output format. Defaults are
`fal-ai/flux-2-pro/edit` for interior/exterior edits, `fal-ai/uso` for style
transfer with a reference image, and `fal-ai/aura-sr` for upscale; override them
with `FAL_RENDER_MODEL`, `FAL_STYLE_TRANSFER_MODEL`, and `FAL_UPSCALE_MODEL`.
The FLUX.2 edit path sends positive, instruction-style prompts (no negative
prompt), passes inputs via `image_urls`, and pins an explicit `image_size`
(~2K longest edge, controlled by `FAL_RENDER_MAX_EDGE`); `FAL_RENDER_SAFETY_TOLERANCE`
(1 strict – 5 permissive) and an optional `FAL_RENDER_SEED` tune it further.
A `mock` provider (sharp-based) and a `local` storage provider make the full
flow testable locally without any cloud credentials. For local smoke tests and
CI, use `AI_PROVIDER=mock` and `STORAGE_PROVIDER=local`. For production set
`AI_PROVIDER=fal` + `FAL_KEY`, plus `STORAGE_PROVIDER=r2` + R2 creds.

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

- `/payments` — package cards with **Top up**, live balance, transaction
  history; `/payments/finish` (result) and `/payments/simulate` (dev mock).
- `POST /api/payments/checkout` (auth) → Snap token / redirect URL.
- `POST /api/payments/webhook` (public; provider signature verified).

**Payment provider** (`src/lib/providers/payment/`): `midtrans` implements Snap
(`POST {app[.sandbox].midtrans.com}/snap/v1/transactions`, Basic auth) and
webhook verification (`sha512(order_id + status_code + gross_amount + serverKey)`).
A `mock` provider routes checkout to the in-app simulate page so the full
checkout → webhook → credit flow runs locally. For local development use
`PAYMENT_PROVIDER=mock`.
For production set `PAYMENT_PROVIDER=midtrans` + `MIDTRANS_SERVER_KEY` /
`MIDTRANS_CLIENT_KEY` and point the Midtrans notification URL at
`/api/payments/webhook`.

```bash
pnpm smoke:payment   # checkout → webhook → idempotent top-up
```

## Testing & GitHub CI/CD

Testing strategy is intentionally MVP-sized:

- **Unit tests (Vitest, co-located):** validations, prompt builder, API helpers,
  pricing, status mapping, rate-limit helper, and small UI utilities.
- **Integration tests (Vitest):** `credits` and `payments` against PostgreSQL
  with test-only users/packages and cleanup.
- **E2E tests (Playwright):** public auth pages plus login → Render Studio →
  upload image → create render using `AI_PROVIDER=mock`, edit an existing
  render, open dashboard recent renders, use sidebar Search, visit Support, and
  verify share-page **Open Studio** navigation.

Local commands:

```bash
pnpm test
pnpm test:integration
pnpm test:e2e
```

GitHub Actions lives in `.github/workflows/ci.yml`. It starts a temporary
PostgreSQL service, runs migrations, then runs lint, unit tests, integration
tests, Playwright E2E, and production build. CI uses safe test env values:
`AI_PROVIDER=mock`, `PAYMENT_PROVIDER=mock`, `STORAGE_PROVIDER=local`, and
`RATE_LIMIT_ENABLED=false`; production secrets are not needed for CI.

For deployment, prefer Render.com Blueprint `autoDeploy` from the protected
`main` branch. If you disable Render auto-deploy, the workflow can optionally
trigger deploy hooks after CI passes by setting GitHub secrets:

- `RENDER_WEB_DEPLOY_HOOK_URL`
- `RENDER_WORKER_DEPLOY_HOOK_URL`

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

## Admin (Phase 5)

Admin area at `/admin` (guarded by `requireAdmin` in the admin layout; only
admins see the sidebar link): overview stats, **Users** (disable/enable —
revokes sessions; promote/demote role), all **Renders**, all **Payments**, and
the **Audit Log**. Mutations are recorded in `admin_audit_logs`. Disabled users
are blocked by an `isDisabled` check in `requireUser` (→ `/login?disabled=1`).

```bash
pnpm make:admin [email] [password]   # promote/create an admin (default admin@renderai.test)
```

## Extras (beyond the PRD MVP)

- **Public render sharing** — a successful render can be shared via a public,
  no-auth page at `/s/<slug>` (Open Graph + Twitter card meta for nice link
  previews). The page shows creator/date metadata; authenticated users see
  **Open Studio**, while visitors are guided to create an account. The Studio
  has a **Bagikan** button that calls `POST /api/renders/share` (idempotent;
  stores a `share_slug` on the render) and copies the link. Public viewer:
  `getPublicRender` in `src/lib/renders/share.ts`.
- **Admin analytics** — the `/admin` overview adds dependency-free charts
  (`src/components/app/charts.tsx`): renders & revenue over the last 14 days,
  plus render breakdowns by mode and status (`getAdminAnalytics`).
- **Full project management** — the Render Studio has a project picker (+ inline
  "create"); renders go to the selected project (`/renders/new?project=<id>`).
  Project detail page `/projects/[id]` lists that project's renders with rename
  and archive (default project can't be archived). `POST /api/projects` creates
  a project; `renameProject` / `archiveProject` in the project service.

## Status

- [x] **Phase 1a** — Scaffold + design system + dark mode
- [x] **Phase 1b** — Better Auth, PostgreSQL/Drizzle, R2, Resend, rate limiter, JWT
- [x] **Auth UI + dashboard** — login/register/verify/reset, app shell, dashboard
- [x] **Phase 2** — Project & Render core, Render Studio, AI provider layer
- [x] **Phase 3** — Credit purchase + Midtrans payment (Snap + webhook)
- [x] **Phase 4** — Notifications (in-app + email) + account settings
- [x] **Phase 5** — Admin (users, renders, payments, audit log)

The MVP feature set is complete. Before production, supply real credentials and
flip providers: Google OAuth (`GOOGLE_CLIENT_*`), email (`RESEND_API_KEY`),
`STORAGE_PROVIDER=r2` (+ R2 creds), `AI_PROVIDER=fal` (+ `FAL_KEY`),
`PAYMENT_PROVIDER=midtrans` (+ Midtrans keys and notification URL). Render
execution uses the DB-backed `render_jobs` queue, drained either by a dedicated
`pnpm worker` (`RENDER_PROCESSING_MODE=worker`, recommended) or by the web
process itself (`RENDER_PROCESSING_MODE=inline`, for single-instance deploys
without a worker). `pnpm render:worker` is the local `.env.local` helper.
