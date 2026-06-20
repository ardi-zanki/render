# Deployment — RenderAI

**One Docker image, three possible targets.** The same image runs as the
**web** server (default) or the render **worker** (`pnpm worker`). It is built
from `Dockerfile` and is portable across hosts — no code differences, all config
via environment variables (12-factor).

```
            ┌── web  (standalone Next server, $PORT)
Dockerfile ─┤
            └── worker (pnpm worker)  ← drains the render queue (worker mode)
```

The render queue is **PostgreSQL-backed**, so **no Redis is needed** for the
current scale. How it is drained depends on `RENDER_PROCESSING_MODE`:

- **`worker` (recommended)** — the web service only enqueues; a separate
  `pnpm worker` process drains the queue. **A running worker is required in this
  mode** — without it, render jobs stay `queued` forever (deployment PRD §13).
  Use this whenever you run more than one web instance or want renders to survive
  web restarts.
- **`inline`** — the web process renders in-band right after the request commits
  (same processing path, no separate service). The default locally, and a valid
  option for **single-instance deploys without a worker service** (e.g. Render
  Free, where Background Workers and Shell are unavailable). Trade-offs: no
  background poller, so a job orphaned by a web restart/spin-down is not retried,
  and it does not scale past one instance. Switch to `worker` once you scale out.

| Target | How | Config |
|---|---|---|
| **VPS** (OVH/Vultr/DO — Singapore/Jakarta) | `docker compose` (web + worker + Caddy) | `docker-compose.yml`, `Caddyfile` |
| **Render.com** (Singapore) | Docker runtime: 1 Web Service + 1 Background Worker | `render.yaml` |
| **Cloudflare Containers** | deploy the same image (verify region/availability) | `Dockerfile` |

> **Cloudflare Workers (serverless) is NOT a target** — `sharp`, the long-running
> worker, and the Postgres TCP driver don't fit that runtime without a major
> refactor. Use Cloudflare for **R2 (storage) + DNS + CDN**, which this app
> already does, regardless of where compute runs.

Portability ≠ running all three at once. Pick **one** to run/maintain in
production; the shared image keeps you free to move later (no lock-in).

---

## 1. Prerequisites (all targets)

- **Neon PostgreSQL** (region Singapore) — use the **pooled** connection string.
- **Cloudflare R2** bucket(s): `renderai-staging`, `renderai-production`.
  Each bucket needs a **CORS policy** so the Render Studio canvas (Magic Wand)
  can read source pixels cross-origin — see [§1a](#1a-r2-cors).
- **Resend** API key + verified sender domain.
- **Midtrans** server/client keys; set webhook → `https://<domain>/api/payments/webhook/midtrans`.
- **fal.ai** API key with enough balance for storage uploads and inference.
- (Optional) Google OAuth client id/secret.
- Strong, **separate** `BETTER_AUTH_SECRET` and `JWT_SECRET`.

Full variable list: `.env.example`.

### 1a. R2 CORS

The Render Studio canvas loads R2 assets with `crossOrigin="anonymous"` and reads
their pixels (Magic Wand). The browser only allows that when R2 returns the right
`Access-Control-Allow-Origin` header. List **explicit** origins (never `*`) so R2
also emits `Vary: Origin` — otherwise a response cached for one origin gets
replayed, without CORS headers, to another, which is what forced hard reloads.

Apply per bucket with the env's R2 credentials:

```bash
# Origins from R2_CORS_ORIGINS (comma-separated) or APP_URL; extras via args.
pnpm cors:setup
pnpm cors:setup https://app.renderai.com https://render-g0hv.onrender.com
pnpm cors:setup --print   # only print JSON to paste into the R2 dashboard
```

Dashboard path: R2 → bucket → **Settings → CORS Policy**. Re-run after adding a
new app domain. List every origin that serves the app (production, staging, any
preview/onrender host, and `http://localhost:3210` for local dev).

> ⚠️ **Verify fal.ai live once after funding the account.** The API key can be
> valid while the account is still locked for exhausted balance. Do one live
> render per mode (interior / exterior / style_transfer / upscale) after wiring
> `FAL_KEY`, and confirm worker logs plus output persistence in R2.

---

## 2. GitHub CI/CD

The repository includes `.github/workflows/ci.yml`.

On pull requests and pushes it runs:

1. PostgreSQL 17 service container.
2. `pnpm install --frozen-lockfile`.
3. `pnpm db:migrate`.
4. `pnpm lint`.
5. `pnpm test`.
6. `pnpm test:integration` for credits + payments.
7. `pnpm test:e2e` with Playwright and mock providers.
8. `pnpm build`.

CI intentionally does **not** require production secrets. It uses safe test
values:

- `AI_PROVIDER=mock`
- `PAYMENT_PROVIDER=mock`
- `STORAGE_PROVIDER=local`
- `RATE_LIMIT_ENABLED=false`
- dummy `BETTER_AUTH_SECRET` / `JWT_SECRET`
- temporary PostgreSQL database from the GitHub Actions service container

Recommended branch protection:

- Require the `Verify` job before merging to `main`.
- Deploy only from `main`.
- Keep staging and production as separate Render env groups/services.

For CD, choose one path:

- **Recommended:** Render Blueprint with `autoDeploy: true` in `render.yaml`.
  Push/merge to `main` after CI passes; Render builds web + worker.
- **Optional deploy hooks:** disable Render auto-deploy and set GitHub secrets
  `RENDER_WEB_DEPLOY_HOOK_URL` and `RENDER_WORKER_DEPLOY_HOOK_URL`. The workflow
  triggers them after the `Verify` job passes on `main`.

Keep only one CD path active. If `autoDeploy: true` stays enabled in
`render.yaml`, do not also configure deploy-hook secrets, otherwise one merge
can trigger duplicate web/worker deploys.

---

## 3. Option A — VPS (Docker Compose + Caddy)

Use a **Singapore/Jakarta** VPS for low Indonesia latency (Vultr Jakarta, OVH
Singapore, DigitalOcean Singapore). 2 vCPU / 4 GB is enough for MVP — the box
only orchestrates API calls, R2, and the queue (no local rendering).

```bash
git clone <repo> && cd renderai
cp .env.example .env.production        # fill PRODUCTION values
export DOMAIN=app.renderai.com         # your hostname (DNS A record → VPS)

docker compose build
docker compose run --rm web pnpm db:migrate   # first deploy only
docker compose run --rm web pnpm db:seed       # first deploy only (credit packages)
docker compose up -d

# scale workers when the queue grows (deployment PRD §13):
docker compose up -d --scale worker=2
```

Caddy obtains TLS automatically for `$DOMAIN`. Harden the VPS (SSH keys only,
firewall: 80/443/22, auto-updates) per deployment PRD §25.

---

## 4. Option B — Render.com (Docker)

1. Push to GitHub → wait for the GitHub Actions `Verify` job to pass → create a
   **Blueprint** from `render.yaml`. It creates
   `renderai-web` (web) and `renderai-worker` (background worker), both built
   from the same `Dockerfile`.
2. Fill every `sync:false` secret in the **renderai-shared** env group —
   including `DATABASE_URL` (Neon pooled URL), `APP_URL`, `BETTER_AUTH_URL`,
   `FAL_KEY`, `RENDER_PROCESSING_MODE=worker`, and all storage/payment/email
   secrets.
3. First deploy — run once in a Render Shell (or locally against the Neon URL):
   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```
4. The web service binds to `$PORT` automatically; the worker runs `pnpm worker`.

Approx cost: web (starter ~$7) + worker (starter ~$7) + Neon (free/launch) ≈
**$14–21/mo** — within the $50 budget, minimal ops.

### Budget variant — single web service, no worker (e.g. Render Free)

On plans where a Background Worker (and Shell) is unavailable, run **only the web
service** and let it render in-band:

- Set **`RENDER_PROCESSING_MODE=inline`** in the web service env.
- Build command (Native runtime): `pnpm install --frozen-lockfile && pnpm db:migrate && pnpm run build && mkdir -p .next/standalone/.next && cp -r .next/static .next/standalone/.next/static && cp -r public .next/standalone/public`. Run `pnpm db:seed` once, manually — do **not** seed on every deploy (it overwrites package prices).
- `/api/health` will report `renderProcessingMode: "inline"` — expected here.

Caveats: inline has no background poller, so a render orphaned by a Free-tier
spin-down/restart is not auto-retried, and it does not scale past one instance.
Move to the worker setup above once volume or uptime matters.

---

## 5. Option C — Cloudflare Containers

If/when you want it: deploy the **same image** as a Cloudflare Container (run a
web container and a worker container). Verify region latency to Indonesia and
pricing first — it's a newer product. DNS + R2 stay on Cloudflare either way.

---

## 6. Migrations, staging, scaling

- **Migrations** run via `pnpm db:migrate` (drizzle-kit) with `DATABASE_URL` in
  the environment. Always migrate **staging** before **production**; snapshot
  Neon before destructive changes (deployment PRD §22).
- **Staging vs production** must not share DB, R2 bucket, payment keys, or
  secrets (deployment PRD §19.3). On Render use a second Blueprint/env group; on
  a VPS use a second compose project + `.env.staging` + subdomain.
- **Workers:** scale by adding worker containers/replicas. Jobs are pulled with
  `SELECT … FOR UPDATE SKIP LOCKED`, so multiple workers won't collide.
- **Web render mode:** check `renderProcessingMode` at `/api/health`. Multi-
  instance / worker-based production should return `"worker"`. `"inline"` is
  expected only for the single-instance budget variant above; avoid it once you
  run more than one web instance.
- **Redis:** not required now. If you later move to BullMQ, uncomment the `redis`
  service in `docker-compose.yml`.

---

## 7. Post-deploy smoke checklist (deployment PRD §30)

- [ ] HTTPS live; `/api/health` returns `ok: true` and the expected
  `renderProcessingMode` (`worker`, or `inline` for the single-instance variant);
  landing/login reachable.
- [ ] Register → verify email (Resend) → 3 free credits granted.
- [ ] Render each mode → queue is processed → output stored in R2 → download works.
- [ ] Force a provider error → credit auto-refunded after 3 attempts.
- [ ] Buy credits via Midtrans → webhook marks `paid` once → credits added (no double).
- [ ] Admin overview shows real numbers; retry a failed render.
- [ ] Permanent delete removes the file from R2.
- [ ] In worker mode, worker logs show `Render worker started` (skip for inline).
