# RenderAI Deployment

RenderAI uses one Docker image for two processes:

- **Web** runs the Next.js app.
- **Worker** processes the render queue.

The full configuration reference is in [.env.example](.env.example).

## Processing mode

Use the worker in production:

```env
RENDER_PROCESSING_MODE=worker
```

The web app creates jobs and the worker processes them. If the worker is not running, jobs stay `queued`.

The `inline` mode processes renders inside the web app and only works with a single instance:

```env
RENDER_PROCESSING_MODE=inline
```

## Required services

- PostgreSQL
- Cloudflare R2
- Resend
- Midtrans
- fal.ai
- Google OAuth, if needed

Use separate credentials for staging and production. `BETTER_AUTH_SECRET` and `JWT_SECRET` must be strong, different from each other, and never committed to the repository.

## Render.com

[render.yaml](render.yaml) creates one web service and one worker from the same Docker image.

1. Push the repository to GitHub.
2. Create a new Blueprint from `render.yaml`.
3. Fill in every environment variable marked as a secret.
4. Make sure both web and worker use `RENDER_PROCESSING_MODE=worker`.
5. Run the migration and seed once from the Render Shell:

```bash
pnpm db:migrate
pnpm db:seed
```

The Blueprint creates these services:

- `renderai-web`
- `renderai-worker`

Do not run the seed on every deployment, because it updates the credit package configuration.

## VPS

VPS deployment uses [docker-compose.yml](docker-compose.yml) and the [Caddyfile](Caddyfile). Caddy handles HTTPS automatically once the domain's DNS points to the server.

Recommended starting size:

- 2 vCPU
- 4 GB RAM

Deployment steps:

```bash
git clone https://github.com/ardi-zanki/render.git renderai
cd renderai
cp .env.example .env.production
```

Fill in `.env.production`, then run:

```bash
export DOMAIN=app.example.com
docker compose build
docker compose run --rm web pnpm db:migrate
docker compose run --rm web pnpm db:seed
docker compose up -d
```

Add more workers when you need more render capacity:

```bash
docker compose up -d --scale worker=2
```

The queue runs on PostgreSQL and supports multiple workers without Redis.

## Cloudflare R2 CORS

The R2 bucket must stay private. Do not enable `r2.dev` or a custom public domain. The app grants access through signed URLs that expire after one hour.

The bucket also needs to allow the app's origin so Render Studio can read image pixels.

```bash
pnpm cors:setup
```

To add other origins:

```bash
pnpm cors:setup https://app.example.com https://staging.example.com
```

List every origin explicitly and avoid the `*` wildcard.

## Database

Run migrations after every schema change:

```bash
pnpm db:migrate
```

Before migrating production:

- Test the migration on staging.
- Back up the database before destructive changes.
- Do not share one database between staging and production.
- Run the seed only when the initial data needs updating.

`pnpm db:seed` syncs the package catalog idempotently and disables any package no longer listed in the seed.

## CI/CD

The [.github/workflows/ci.yml](.github/workflows/ci.yml) workflow runs on pull requests and pushes to `main`. CI runs:

- Database migrations
- Lint and design system checks
- Unit and integration tests
- Production build

The deploy job runs after those checks pass. Pick one deployment method: Render auto-deploy or a deploy hook.

## Post-deployment checks

- [ ] HTTPS is active.
- [ ] `/api/health` returns `ok: true`.
- [ ] Web and worker use the correct processing mode.
- [ ] Sign-up and email verification work.
- [ ] Renders complete and are stored in R2.
- [ ] The R2 bucket has no public access.
- [ ] The pricing page matches the catalog from `pnpm db:seed`.
- [ ] The support email is valid; WhatsApp and Instagram appear only when configured.
- [ ] Responses include the CSP and other security headers.
- [ ] Credits are refunded when a render fails.
- [ ] Midtrans payments and webhooks work.
- [ ] Admins can access the admin dashboard.
