# Deployment — RenderAI

RenderAI runs as **two processes**: the Next.js web server and a **render worker**
(`scripts/render-worker.ts`). The worker is **mandatory** — without it, render
jobs created by users stay in `queued` forever (PRD §19). This is why a
serverless host that freezes after the response (Vercel, Cloudflare Workers) is
not recommended; use a host that keeps a long-lived Node process.

Two ready-to-use configs are included:

| File | Target |
|---|---|
| `ecosystem.config.cjs` | VPS (pm2) — **recommended #1** |
| `render.yaml` | Render.com Blueprint — **recommended #2** |

---

## 1. Prerequisites (both options)

- PostgreSQL database.
- Cloudflare R2 bucket (`STORAGE_PROVIDER=r2`).
- Resend API key + verified sender domain.
- Midtrans server/client keys (+ configure the webhook URL → `/api/payments/webhook/midtrans`).
- MyArchitectAI API key (`AI_PROVIDER=myarchitectai`).
- (Optional) Google OAuth client id/secret.
- `BETTER_AUTH_SECRET` and `JWT_SECRET` — generate strong, **different** secrets.

Full variable list is in `.env.example` / PRD §31.

> ⚠️ **MyArchitectAI not yet verified live.** The integration
> (`src/lib/providers/ai/myarchitectai.ts`) now sends snake_case fields
> (`output_format`, `reference_image`, …) per the API reference, but it has not
> been run against the real API. Do a single live render per mode (interior,
> exterior, style_transfer, upscale) right after wiring the key, and confirm the
> endpoint paths + response shape before going live.

---

## 2. Option A — VPS with pm2

```bash
# on the server, in the repo:
cp .env.example .env.local      # then fill PRODUCTION values (NODE_ENV=production)
corepack enable                  # ensures pnpm is available
pnpm install --prod=false        # dev deps needed for `next build` + tsx worker
pnpm build
pnpm db:migrate                  # apply DB schema
pnpm db:seed                     # seed credit packages (once)

pm2 start ecosystem.config.cjs   # starts renderai-web + renderai-worker
pm2 save && pm2 startup          # auto-restart on reboot
```

Put a reverse proxy (nginx/Caddy) in front of the web process (port `3210`) for
TLS. Both processes read config from `.env.local` on the server.

Useful: `pm2 status`, `pm2 logs renderai-worker`, `pm2 restart all`.

---

## 3. Option B — Render.com Blueprint

1. Push the repo to GitHub and create a new **Blueprint** from `render.yaml`.
   It provisions: `renderai-web` (web), `renderai-worker` (background worker),
   and `renderai-db` (Postgres).
2. In the dashboard, fill every `sync:false` secret in the **renderai-shared**
   env group (auth secrets, MyArchitectAI/Midtrans/R2/Resend/Google, `APP_URL`,
   `BETTER_AUTH_URL`).
3. First-time DB setup — run once from a shell (Render Shell or locally with the
   external `DATABASE_URL`):
   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```
4. Redeploy. Web binds to `$PORT`; the worker runs `pnpm worker`.

> Render prunes dev dependencies under `NODE_ENV=production`, so both build
> commands use `pnpm install --prod=false` to keep `tsx`, `typescript`, and
> `tailwindcss` available.

---

## 4. Post-deploy smoke checklist

- [ ] Register → verify email (Resend) → 3 free credits granted.
- [ ] Create a render in each mode → worker processes it → output stored in R2.
- [ ] Force a provider error → credit auto-refunded after 3 attempts.
- [ ] Buy credits via Midtrans → webhook marks `paid` once → credits added (no double).
- [ ] Admin overview shows real numbers; retry a failed render.
- [ ] `pm2 logs` / Render worker logs show `Render worker started`.
