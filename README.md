# RenderAI

RenderAI is an open-source app for creating and managing AI-generated architectural visuals.

## Features

- AI interior and exterior rendering
- Texture editing and version history
- Project and render management
- Credit system with Midtrans payments
- Email/password and Google OAuth sign-in
- Local or Cloudflare R2 storage
- Admin dashboard, notifications, and audit logs

## Tech stack

- Next.js 16, React 19, and TypeScript
- Tailwind CSS 4
- PostgreSQL and Drizzle ORM
- Better Auth
- fal.ai, Cloudflare R2, Midtrans, and Resend
- Vitest and Playwright

## Quick start

### Requirements

- Node.js 22
- pnpm 11
- Docker, or a local PostgreSQL instance

### Setup

```bash
git clone https://github.com/ardi-zanki/render.git renderai
cd renderai
pnpm install
cp .env.example .env.local
```

To run PostgreSQL with Docker:

```bash
docker compose -f docker-compose.local.yml up -d db
```

Set these values in `.env.local`:

```env
DATABASE_URL=postgresql://renderai:renderai@localhost:5433/renderai
BETTER_AUTH_SECRET=<random secret, at least 16 characters>
JWT_SECRET=<another random secret, at least 16 characters>

AI_PROVIDER=mock
STORAGE_PROVIDER=local
PAYMENT_PROVIDER=mock
RENDER_PROCESSING_MODE=inline
```

Then prepare the database and start the app:

```bash
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open [http://localhost:3210](http://localhost:3210). In development, verification emails are printed to the terminal when `RESEND_API_KEY` is not set.

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Start the development server |
| `pnpm build` | Create a production build |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run unit tests |
| `pnpm test:integration` | Run integration tests |
| `pnpm test:e2e` | Run E2E tests locally |
| `pnpm worker` | Start the render worker |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:seed` | Load initial data |

## Render processing

The web app writes renders to a PostgreSQL queue. Renders are then processed either by the worker or by the web app itself, depending on `RENDER_PROCESSING_MODE`.

- `worker` is recommended for production and multi-instance deployments.
- `inline` is only suitable for development or a single web instance.

See [DEPLOYMENT.md](DEPLOYMENT.md) for production, Render.com, and VPS setup.

## Testing

GitHub Actions runs migrations, lint, design system checks, unit tests, integration tests, and a production build. E2E tests are meant to be run locally with Playwright.

## Contributing

Issues and pull requests are welcome.

1. Fork the repository and create a branch.
2. Make your changes along with relevant tests.
3. Run lint and tests.
4. Open a pull request with a short, clear description.

## License

RenderAI is available under the [Apache License 2.0](LICENSE).
