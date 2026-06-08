# Deployment — RenderAI

**One Docker image, three possible targets.** The same image runs as the
**web** server (default) or the render **worker** (`pnpm worker`). It is built
from `Dockerfile` and is portable across hosts — no code differences, all config
via environment variables (12-factor).

```
            ┌── web  (next start, $PORT)
Dockerfile ─┤
            └── worker (pnpm worker)  ← MANDATORY: processes the render queue
```

The worker is **required**. Without a running worker, render jobs stay `queued`
forever (deployment PRD §13). The queue is **PostgreSQL-backed**, so **no Redis
is needed** for the current scale.

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
- **Resend** API key + verified sender domain.
- **Midtrans** server/client keys; set webhook → `https://<domain>/api/payments/webhook/midtrans`.
- **fal.ai** API key with enough balance for storage uploads and inference.
- (Optional) Google OAuth client id/secret.
- Strong, **separate** `BETTER_AUTH_SECRET` and `JWT_SECRET`.

Full variable list: `.env.example`.

> ⚠️ **Verify fal.ai live once after funding the account.** The API key can be
> valid while the account is still locked for exhausted balance. Do one live
> render per mode (interior / exterior / style_transfer / upscale) after wiring
> `FAL_KEY`, and confirm worker logs plus output persistence in R2.

---

## 2. Option A — VPS (Docker Compose + Caddy)

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

## 3. Option B — Render.com (Docker)

1. Push to GitHub → create a **Blueprint** from `render.yaml`. It creates
   `renderai-web` (web) and `renderai-worker` (background worker), both built
   from the same `Dockerfile`.
2. Fill every `sync:false` secret in the **renderai-shared** env group —
   including `DATABASE_URL` (Neon pooled URL), `APP_URL`, `BETTER_AUTH_URL`,
   `FAL_KEY`, and all storage/payment/email secrets.
3. First deploy — run once in a Render Shell (or locally against the Neon URL):
   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```
4. The web service binds to `$PORT` automatically; the worker runs `pnpm worker`.

Approx cost: web (starter ~$7) + worker (starter ~$7) + Neon (free/launch) ≈
**$14–21/mo** — within the $50 budget, minimal ops.

---

## 4. Option C — Cloudflare Containers

If/when you want it: deploy the **same image** as a Cloudflare Container (run a
web container and a worker container). Verify region latency to Indonesia and
pricing first — it's a newer product. DNS + R2 stay on Cloudflare either way.

---

## 5. Migrations, staging, scaling

- **Migrations** run via `pnpm db:migrate` (drizzle-kit) with `DATABASE_URL` in
  the environment. Always migrate **staging** before **production**; snapshot
  Neon before destructive changes (deployment PRD §22).
- **Staging vs production** must not share DB, R2 bucket, payment keys, or
  secrets (deployment PRD §19.3). On Render use a second Blueprint/env group; on
  a VPS use a second compose project + `.env.staging` + subdomain.
- **Workers:** scale by adding worker containers/replicas. Jobs are pulled with
  `SELECT … FOR UPDATE SKIP LOCKED`, so multiple workers won't collide.
- **Redis:** not required now. If you later move to BullMQ, uncomment the `redis`
  service in `docker-compose.yml`.

---

## 6. Post-deploy smoke checklist (deployment PRD §30)

- [ ] HTTPS live; `/api/health` returns `ok: true`; landing/login reachable.
- [ ] Register → verify email (Resend) → 3 free credits granted.
- [ ] Render each mode → worker processes → output stored in R2 → download works.
- [ ] Force a provider error → credit auto-refunded after 3 attempts.
- [ ] Buy credits via Midtrans → webhook marks `paid` once → credits added (no double).
- [ ] Admin overview shows real numbers; retry a failed render.
- [ ] Permanent delete removes the file from R2.
- [ ] Worker logs show `Render worker started`.
