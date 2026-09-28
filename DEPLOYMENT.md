# RenderAI Deployment

One Docker image runs two processes: **web** serves Next.js and enqueues renders; **worker** processes the PostgreSQL queue. PostgreSQL is external in production; no Redis is required.

## Production configuration

Use [.env.example](.env.example) as the variable reference, then replace its development settings:

| Setting | Production value |
|---|---|
| `NODE_ENV` | `production` |
| `APP_URL`, `BETTER_AUTH_URL` | The same public HTTPS origin |
| `DATABASE_URL` | PostgreSQL connection URL for this environment |
| `BETTER_AUTH_SECRET`, `JWT_SECRET` | Two different random secrets; generate each with `openssl rand -hex 32` |
| `RENDER_PROCESSING_MODE` | `worker` on both services |
| `STORAGE_PROVIDER` | `r2`, with all four R2 credentials below |
| `AI_PROVIDER` | `fal`, with `FAL_KEY` or both `FAL_KEY_ID` and `FAL_KEY_SECRET` |
| `PAYMENT_PROVIDER` | `midtrans`; configure both keys and set `MIDTRANS_IS_PRODUCTION=true` only for live credentials |
| `EMAIL_PROVIDER` | `resend`; set `RESEND_API_KEY` and an approved `EMAIL_FROM` sender |
| `RATE_LIMIT_ENABLED` | `true` |

R2 requires `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET_NAME`. Keep the bucket private. Google OAuth is optional: supply both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` and configure the callback at `<BETTER_AUTH_URL>/api/auth/callback/google`. Review `SUPPORT_EMAIL` and optional support links for your business.

All services must share the database, secrets, provider settings, and public origin. Use separate databases and credentials for staging and production. Process-injected env values take precedence over local files. Production email has no console fallback; without a Resend key, verification and password-reset email fail.

The checked-in Compose and Blueprint configurations explicitly select `worker`. It is also the application's production default when processing mode is unset. Explicit `inline` is supported only for a single low-volume web instance; it processes jobs during the request. Multiple web instances require the dedicated worker. Each worker handles one job at a time; scale replicas for concurrency. `JOB_LOCK_TIMEOUT_SECONDS` is a positive integer (default 300).

## Docker image and build configuration

The image uses Node 24 LTS and pnpm 11.5.2. `APP_URL` is a **public build argument** used for generated metadata; build for the intended origin and use the same value at runtime. The builder uses dummy database/auth values and mock providers; real secrets are supplied only at runtime. Building requires internet access for package downloads and Google fonts.

The runtime retains the dependency set and CLI tools needed for the worker and migrations. `scripts/start-standalone.mjs` links `public` and `.next/static` into the standalone server directory, including the shared uploads directory for local Docker use. Next's [standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) does not copy these assets automatically.

## Render.com

Before creating the Blueprint, create an environment group named **`renderai-secrets`** in the Render Dashboard, in the same workspace/environment as the services. Populate it with:

- `DATABASE_URL`, `APP_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `JWT_SECRET`
- `FAL_KEY` (or the two split fal credentials)
- `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`
- `RESEND_API_KEY`, `EMAIL_FROM`
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
- Optional: Google credentials, support links, and `R2_CORS_ORIGINS`

[render.yaml](render.yaml) references this pre-existing group and creates `renderai-shared` for non-secret defaults. Render does not support `sync: false` placeholders inside environment groups; see its [Blueprint reference](https://render.com/docs/blueprint-spec).

For an existing Blueprint, populate `renderai-secrets` with the current values **before** syncing this configuration. Preserve the existing auth/JWT secrets unless you intend to invalidate sessions/tokens.

1. Push the repository to GitHub and create a Blueprint from `render.yaml`.
2. Confirm both services inherit both environment groups. Set `APP_URL` before building; [Render passes service env as Docker build arguments](https://render.com/docs/docker). The Dockerfile declares only the public `APP_URL` argument.
3. Apply migrations to the database using a trusted environment with access to it (`pnpm db:migrate`) before starting traffic. Run `pnpm db:seed` for the initial catalog. For an existing deployment, these commands can run from Render Shell.
4. Confirm `renderai-web` and `renderai-worker` are healthy and a render completes.

The Blueprint enables auto-deploy for both services. If using GitHub Actions deploy hooks instead, disable Render auto-deploy for both and configure **both** `RENDER_WEB_DEPLOY_HOOK_URL` and `RENDER_WORKER_DEPLOY_HOOK_URL` GitHub secrets. Leaving both empty skips the CI deploy job's hook calls. Choose one mechanism to avoid duplicate deployments; auto-deploy alone does not imply waiting for this CI workflow.

## VPS with Caddy

Provide an external PostgreSQL database reachable from the containers. Caddy obtains HTTPS certificates once DNS points to the server and ports 80/443 are available.

```bash
git clone https://github.com/ardi-zanki/render.git renderai
cd renderai
cp .env.example .env.production
```

Fill in the production configuration above and set `DOMAIN` to the public hostname, without a scheme or path. Use `--env-file` for Compose interpolation (`APP_URL`, `DOMAIN`); service `env_file` supplies container env separately.

```bash
docker compose --env-file .env.production build
docker compose --env-file .env.production run --rm --no-deps web pnpm db:migrate
docker compose --env-file .env.production run --rm --no-deps web pnpm db:seed
docker compose --env-file .env.production up -d
```

Run migrations on subsequent deployments whenever new migrations are committed. Do not seed automatically on every deployment: the seed updates prices/credits and disables packages absent from its catalog. Scale workers with:

```bash
docker compose --env-file .env.production up -d --scale worker=2
```

## Local production-image smoke check

For ordinary development, follow the README and use `pnpm dev`. To exercise the Docker production image (Docker Compose 2.24+):

```bash
cp .env.example .env.docker
```

Fill in two fresh secrets. Compose supplies the container database URL (`db:5432`), port/origin 3000, mock AI/payment, local storage, and worker mode for both services. The host database is exposed at `localhost:5433`. A shared volume holds uploads.

```bash
docker compose -f docker-compose.local.yml build
docker compose -f docker-compose.local.yml up -d db
docker compose -f docker-compose.local.yml run --rm web pnpm db:migrate
docker compose -f docker-compose.local.yml run --rm web pnpm db:seed
docker compose -f docker-compose.local.yml up -d
```

Open [http://localhost:3000](http://localhost:3000). This image runs with `NODE_ENV=production`, so sign-up/reset email still requires a Resend key and approved sender. Mock AI/payment do not mock email. Use development mode for console-only email.

## Cloudflare R2 CORS

Keep public bucket access disabled. Browser asset URLs expire after one hour; other callers can request shorter signed-URL lifetimes. The bucket must allow the application's exact origin for canvas image editing.

With env injected in the deployed container:

```bash
pnpm cors:setup --print
pnpm cors:setup
```

For a local operator using `.env.production`, load it explicitly (these CLI scripts otherwise try `.env.local`):

```bash
pnpm exec tsx --env-file=.env.production scripts/setup-r2-cors.ts --print
pnpm exec tsx --env-file=.env.production scripts/setup-r2-cors.ts
```

Review the printed policy before applying it. Set `R2_CORS_ORIGINS` as comma-separated origins or append origins as CLI arguments. This command **replaces** the bucket CORS policy; list every required origin explicitly. Leave legacy `R2_PUBLIC_URL` empty for new deployments.

## Database and release checks

Generate and review migration SQL after schema changes, commit it, then use `pnpm db:migrate` to apply it. Test migrations on staging and back up production before destructive changes. Integration/E2E tests must use a separate disposable database.

After deployment, check:

- HTTPS and `/api/health` (`ok: true` confirms a database query, not all external services).
- A real render moves from queued to completed; web and worker share configuration.
- Sign-up, verification, password reset, payments, and Midtrans webhooks.
- Private R2 assets, browser canvas editing, and refund behavior for failed renders.
- Pricing matches the intended seeded catalog; admin access and support links work.
- CSS, fonts, public images, and security headers are served correctly.
