# RenderAI

RenderAI is an open-source app for creating and managing AI-generated architectural visuals: interior/exterior renders, texture editing, project history, credits and Midtrans payments, email/password and optional Google sign-in, and an admin dashboard.

The app uses Next.js 16, React 19, TypeScript 7, Tailwind CSS 4, PostgreSQL, Drizzle ORM, Better Auth, fal.ai, Cloudflare R2, and Resend.

## Quick start

Use Node.js **24 LTS** and **pnpm 11.5.2** (pinned in `package.json`). PostgreSQL can run locally or in Docker (Compose 2.24+). CI uses PostgreSQL 17; the local Docker stack uses PostgreSQL 16.

```bash
git clone https://github.com/ardi-zanki/render.git renderai
cd renderai
pnpm install --frozen-lockfile
cp .env.example .env.local
```

Generate **two different secrets** by running `openssl rand -hex 32` twice. Set `BETTER_AUTH_SECRET` and `JWT_SECRET` in `.env.local`. The example already selects mock AI/payment, local storage, and inline processing, so external service credentials are unnecessary for development.

Start the local database, then migrate and seed:

```bash
docker compose -f docker-compose.local.yml up -d db
pnpm db:migrate
pnpm db:seed
pnpm dev
```

The example `DATABASE_URL` matches this Docker database at `localhost:5433`. Adjust it if you use another database. Open [http://localhost:3210](http://localhost:3210). Without `RESEND_API_KEY`, verification/reset email links are printed to the terminal in development.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the module map, dependency boundaries, render/payment flows, and where to add a feature.

## Configuration

[.env.example](.env.example) lists supported variables; [src/env.ts](src/env.ts) validates server configuration. Do not import it from client components.

- Next.js loads `.env.local` automatically. Database commands load it with `dotenv.config()`; worker/admin/smoke/CORS commands use Node's optional env-file loading. Existing process variables take precedence, so deployment-injected values are preserved.
- `pnpm worker` and `pnpm render:worker` are equivalent. Set `RENDER_PROCESSING_MODE=worker` for **both** web and worker to test the queue locally, and run them in separate terminals. Without a worker, jobs remain queued.
- `APP_URL` and `BETTER_AUTH_URL` should use the same public origin. Update both when changing the port or domain.
- Do not commit `.env.local`, `.env.docker`, `.env.production`, or real credentials. Copying the example does not configure a production deployment.

See [DEPLOYMENT.md](DEPLOYMENT.md) for production credentials, Docker, Render, and VPS instructions.

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Development server on port 3210 |
| `pnpm build` | Production standalone build; requires core env values and network access for Google fonts |
| `pnpm start` | Serve the completed standalone build on `PORT` (default 3000); inject production env first |
| `pnpm typecheck` | Run TypeScript 7 native compiler with no output |
| `pnpm lint` | Run ESLint |
| `pnpm check:design-system` | Check UI design constraints |
| `pnpm test` | Unit tests; no database needed |
| `pnpm test:integration` | Integration tests; requires a migrated, disposable test database |
| `pnpm test:e2e` | Chromium E2E tests; requires a migrated, disposable test database |
| `pnpm worker --once` | Process at most one queued render |
| `pnpm worker` | Run the render worker continuously |
| `pnpm db:generate` | Generate migration SQL after schema changes |
| `pnpm db:migrate` | Apply committed migrations |
| `pnpm db:seed` | Sync the payment package catalog, including prices and active status |

TypeScript uses two package aliases: `@typescript/native` resolves to compiler 7.0.2, while `typescript` resolves to `@typescript/typescript6` for tools that still need the JavaScript API (including ESLint). `pnpm typecheck` uses the native compiler; keep both aliases when updating tooling.

## Testing

CI runs migrations, lint, design checks, unit/integration tests, a production build, and the native typecheck. Unit and integration configs explicitly clear mock call history before each test. Unit tests also restore spies.

For integration/E2E tests, set `DATABASE_URL` in the shell to a **separate test database** before running migrations and tests. These suites create and remove records; they must not target production or a database containing data you need. Integration tests skip when no database URL is provided, so a green run alone does not prove database coverage.

Install the E2E browser once:

```bash
pnpm exec playwright install chromium
```

Playwright starts its own server and uses `.next-e2e`. If your development server is already on port 3210, use `PLAYWRIGHT_PORT=3211 pnpm test:e2e`. Playwright does not reuse an existing server. Tests force mock AI/payment, local storage, and disable rate limiting; configure test secrets and leave `RESEND_API_KEY` unset to avoid sending real email.

## Contributing

1. Fork the repository and create a branch.
2. Make your changes and add relevant tests.
3. Run `pnpm lint`, `pnpm typecheck`, and the tests appropriate to your change.
4. Open a pull request describing the behavior and validation.

## License

[Apache License 2.0](LICENSE).
