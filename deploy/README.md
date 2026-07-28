# Deployment & Hardening (Phase 9)

Operational artifacts for running Social Forge in production. Everything here is
config/scripts — validate on a real Ubuntu host; nothing in this folder runs in
CI.

## Layout

| Path | Purpose |
| --- | --- |
| `../docker-compose.prod.yml` | Production overlay (built image, workers, Nginx, exporters) |
| `nginx/socialforge.conf` | Reverse proxy + TLS termination + security headers |
| `rls/setup-app-role.sql` | Create the dedicated non-superuser DB role that makes RLS enforce |
| `../monitoring/prometheus.yml` | Prometheus scrape config (app `/metrics` + exporters) |
| `../monitoring/grafana/dashboards/socialforge.json` | Grafana overview dashboard |
| `../scripts/backup.sh` | Nightly `pg_dump` + MinIO `mc mirror` with retention |
| `../load-test/k6-smoke.js` | k6 smoke / light load test |

## First deploy (outline)

1. **DNS + TLS**: point `app.` and `ws.` at the host; issue certs with
   `certbot --nginx -d app.example.com -d ws.example.com`.
2. **Env**: copy `.env.example` → `.env`, fill secrets. Set `NODE_ENV=production`,
   `APP_URL`, `CENTRIFUGO_WS_URL=wss://ws.example.com/connection/websocket`, and
   the Phase 9 vars (`METRICS_TOKEN`, optionally `TURNSTILE_*`, `ERROR_REPORTING_DSN`).
3. **Bring up**: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`.
4. **Migrate**: `docker compose exec app node ace migration:run --force`.
5. **Prometheus**: set the same `METRICS_TOKEN` in `monitoring/prometheus.yml`
   (`credentials:`) and import the Grafana dashboard JSON.

## Security hardening checklist

- [x] Per-IP throttle on auth endpoints (`start/limiter.ts`) and per-visitor
      throttle on webchat send.
- [x] Provider webhooks verified by per-channel secret / callback token; CSRF-exempt
      only where required.
- [x] Channel credentials encrypted at rest (`Channel.setCredential`).
- [x] Audit log of security-relevant actions (`audit_logs`, owner-visible).
- [x] CAPTCHA (Turnstile) on signup + webchat session — enable by setting
      `TURNSTILE_SECRET_KEY` / `TURNSTILE_SITE_KEY`.
- [x] `/metrics` (served by `@julr/adonisjs-prometheus`) restricted via its
      `ipsWhitelist` and blocked at the edge by Nginx.
- [ ] **RLS enforcement**: run `rls/setup-app-role.sql`, point `DB_USER` at the
      `socialforge_app` role, redeploy, then `node ace rls:check`. Until then RLS
      is a dormant backstop and tenant isolation relies on the app-level
      `TenantScoped` mixin (which is fully tested).

## Backups

Add to the host crontab:

```
0 3 * * * /opt/socialforge/scripts/backup.sh >> /var/log/sf-backup.log 2>&1
```

Restore a dump with: `gunzip -c socialforge-YYYYMMDD.sql.gz | psql -d socialforge`.

## Load test

```
BASE_URL=https://app.example.com WEBCHAT_CHANNEL_ID=<uuid> \
  k6 run --vus 50 --duration 2m load-test/k6-smoke.js
```

Thresholds: <1% errors, p95 < 500ms. Tune RabbitMQ prefetch and the per-channel
outbound rate limit (`OutboundDispatcher.RATE_LIMIT_PER_SECOND`) from the results.
