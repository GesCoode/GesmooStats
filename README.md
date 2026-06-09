# Gesmoo Stats

Private dashboard for subscriber counts across Gesmoo websites.

## Stack

- SvelteKit + Node adapter
- Docker on port **3002**
- Reads MemLyra account totals from Postgres (`memlyra-db` on shared Docker network)

## Environment

Copy `.env.example` to `.env` on the server:

```env
SESSION_SECRET=long-random-string
STATS_ADMIN_PASSWORD=your-strong-password
MEMLYRA_DATABASE_URL=postgres://memlyra:YOUR_POSTGRES_PASSWORD@memlyra-db:5432/memlyra
```

Use the same Postgres password as MemLyra.

## Deploy (VPS)

```bash
cd ~/GesmooStats
git pull
docker compose up -d --build
```

Nginx + HTTPS: see `deploy/nginx/stats.gesmoo.com.conf` and run Certbot for `stats.gesmoo.com`.

## DNS

Cloudflare → `gesmoo.com` → A record `stats` → server IP.
