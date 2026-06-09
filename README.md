# RenderAI

Platform SaaS render arsitektur berbasis AI untuk pasar Indonesia. Brand &
UX terinspirasi **Vrendr**, fungsionalitas mengacu **MyArchitectAI**. Lihat
PRD lengkap di `../RenderAI_PRD_Final/`.

> Upload gambar desain, pilih mode render, dan dapatkan visual arsitektur
> realistis dalam hitungan detik.

## Tech stack

| Layer        | Teknologi                                          |
| ------------ | -------------------------------------------------- |
| Package mgr  | pnpm 11.5.2                                         |
| Runtime      | Node.js 22 (Docker/CI)                              |
| Framework    | Next.js 16.2.7 (App Router, Turbopack)             |
| UI runtime   | React 19.2                                          |
| Language     | TypeScript 6.0                                      |
| CSS          | Tailwind CSS v4                                     |
| Komponen     | Custom UI primitives di `src/components/ui`         |
| Ikon         | `lucide-react` 1.17                                |
| Tema         | Local `ThemeProvider` (light/dark/system, class-based) |
| Font         | Plus Jakarta Sans (teks) · Geist Mono (angka/kode) |
| Testing      | Vitest 4.1 + Playwright 1.60                        |

Stack lengkap (auth, DB, storage, payment, AI provider) ada di PRD §5.

## Menjalankan

```bash
pnpm install   # sekali; build script sharp diizinkan via pnpm-workspace.yaml
pnpm dev       # http://localhost:3210
pnpm build     # build produksi
pnpm lint      # eslint
pnpm test      # unit test (Vitest)
pnpm test:integration # integration test DB (credits + payments)
pnpm test:e2e  # Playwright smoke + render mock flow
```

Dari folder induk (`RumAI/`): `pnpm --dir renderai dev`.

## Design system

Halaman `/design-system` adalah **showcase brand kit** — warna, tipografi,
tombol, badge, form, kartu mode render, dan kartu harga.

### Token warna (`src/app/globals.css`)

Semua warna didefinisikan sebagai CSS variable di `:root` (light) dan `.dark`,
lalu dipetakan ke utility Tailwind via `@theme inline`. Token utama:

- **Brand:** `--primary` navy `#1B2A5E` (dark mode `#3A4F94`) · `--brand-violet` (aksen AI) · `--foreground` ink
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
pnpm test:e2e      # Playwright; login + render memakai mock provider
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
- **Protected** (app shell w/ sidebar + topbar): `/dashboard`, `/projects`,
  `/projects/[id]`, `/renders`, `/renders/new`, `/renders/[id]`, `/payments`,
  `/notifications`, and `/settings`.
- **Admin:** `/admin`, `/admin/users`, `/admin/projects`, `/admin/renders`,
  `/admin/payments`, `/admin/credits`, `/admin/packages`,
  `/admin/notifications`, `/admin/settings`, and `/admin/audit`.

Full flow works in the browser: register → (dev: verification link printed to
the server console) → click link → auto sign-in → dashboard shows the 3 free
credits + "Project Saya". Forms use the `authClient` (`signUp`, `signIn`,
`requestPasswordReset`, `resetPassword`, `sendVerificationEmail`, `signOut`).
Smoke scripts or E2E flows that use `demo@renderai.test` require that user to
exist in the local/test database first.

## Render core & Render Studio (Phase 2)

The render pipeline (`src/lib/renders/`) is split by concern: `create`, `jobs`,
`assets`, `queries`, `archive-delete`, and `processor`. Flow: check balance →
create render row → deduct credit (idempotent) → store original → enqueue job →
worker/process job → call AI provider → persist result asset → mark success. On
final failure the render is marked failed and the credit is refunded. Entry
point: `POST /api/renders` (multipart upload). In local development,
`RENDER_PROCESSING_MODE=inline` can process the queued job from the web request
for convenience. In production, use `RENDER_PROCESSING_MODE=worker` so the web
service only enqueues jobs and `pnpm worker` processes the queue.

- **Render Studio** (`/renders/new`) — the workspace: mode (Interior/Exterior/
  Style Transfer/Upscale), style, location, time & weather, image upload,
  instruction, **Render**, before/after view, download, and a scene grid.
- **Riwayat Render** (`/renders`) and **Project** (`/projects`) show real data;
  the dashboard lists recent renders.

**AI provider** (`src/lib/providers/ai/`): `myarchitectai` implements the real
API (`POST https://api.myarchitectai.com/v1/render/{interior,exterior}` etc.,
`x-api-key` header, `{ image: <public url>, prompt, outputFormat }` → `{ output }`;
outputs are fetched immediately since the CDN expires them in ~5 min). `fal`
uses the official `@fal-ai/client`: it uploads local/R2 image bytes to fal
storage, calls queue-based model inference, fetches result URLs immediately, and
normalizes the result to the requested output format. Defaults are
`fal-ai/flux-kontext/dev` for interior/exterior edits, `fal-ai/uso` for style
transfer with a reference image, and `fal-ai/aura-sr` for upscale; override them
with `FAL_RENDER_MODEL`, `FAL_STYLE_TRANSFER_MODEL`, and `FAL_UPSCALE_MODEL`.
The `selfhost-stablediffusion` provider posts multipart form data to
`SELFHOST_SD_API_URL` for a ComfyUI/FastAPI wrapper and accepts raw image, URL,
data URL, or base64 outputs. A `mock` provider (sharp-based) and a `local`
storage provider make the full flow testable locally without any cloud
credentials. For local smoke tests and CI, use `AI_PROVIDER=mock` and
`STORAGE_PROVIDER=local`. For production set one of `AI_PROVIDER=fal` +
`FAL_KEY`, `AI_PROVIDER=myarchitectai` + `MYARCHITECTAI_API_KEY`, or
`AI_PROVIDER=selfhost-stablediffusion` + `SELFHOST_SD_API_URL`, plus
`STORAGE_PROVIDER=r2` + R2 creds.

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
  upload image → create render using `AI_PROVIDER=mock`.

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
  previews). The Studio has a **Bagikan** button that calls
  `POST /api/renders/share` (idempotent; stores a `share_slug` on the render)
  and copies the link. Public viewer: `getPublicRender` in
  `src/lib/renders/share.ts`.
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
`AI_PROVIDER=myarchitectai` (+ `MYARCHITECTAI_API_KEY`), or
`AI_PROVIDER=selfhost-stablediffusion` (+ `SELFHOST_SD_API_URL`),
`PAYMENT_PROVIDER=midtrans` (+ Midtrans keys and notification URL). Render
execution uses the DB-backed `render_jobs` queue and `pnpm worker` in
production with `RENDER_PROCESSING_MODE=worker` (`pnpm render:worker` is the
local `.env.local` helper).
