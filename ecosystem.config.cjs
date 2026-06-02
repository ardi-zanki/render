/**
 * pm2 process config for a VPS deploy (PRD §19 — render job must run in a
 * separate long-lived worker, not in the request lifecycle).
 *
 * Runs two processes from the same repo:
 *   - renderai-web    : the Next.js server (behind nginx/Caddy reverse proxy)
 *   - renderai-worker : the DB-backed render job worker
 *
 * Both read configuration from `.env.local` on the server (Next auto-loads it;
 * the worker loads it via `tsx --env-file` in the `render:worker` script), so
 * put PRODUCTION values in `.env.local` on the VPS (incl. NODE_ENV=production).
 *
 * Deploy:
 *   pnpm install --prod=false      # dev deps needed for `next build` + tsx
 *   pnpm build
 *   pnpm db:migrate                # apply schema
 *   pm2 start ecosystem.config.cjs
 *   pm2 save && pm2 startup        # restart on reboot
 */
module.exports = {
  apps: [
    {
      name: "renderai-web",
      script: "pnpm",
      args: "start",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      env: { NODE_ENV: "production" },
    },
    {
      name: "renderai-worker",
      script: "pnpm",
      args: "render:worker",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      // Keeps the queue moving even if the web process restarts.
      env: { NODE_ENV: "production" },
    },
  ],
};
