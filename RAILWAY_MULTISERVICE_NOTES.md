# Railway Multi-Service Viability & Strategy

## Summary

Railway's Nixpacks + single `railway.toml` works best for one process. Multi-service (web + websocket) inside one repo can be tricky because per-service custom start commands are limited. For predictable behavior you should either:

1. Use separate Railway projects/services (recommended for clear scaling) OR
2. Use a single container (Dockerfile) with a process manager (e.g. `node server.js` that internally forks or `pm2`) OR
3. Merge websocket into the Next.js custom server (simplest operationally) and expose `/socket.io` from the same port.

Currently we opted for a distinct websocket entrypoint plus service definition. If Railway does not start the websocket service correctly, choose one of the alternatives above.

## Recommended Next Step

Short-term: verify if Railway exposes both ports (3000, 8080). If not, consolidate.

## Consolidation Approach Outline

- Create a custom `server.ts` that boots Next.js, attaches an HTTP server, and mounts Socket.IO.
- Replace `start` script with `ts-node server.ts` (or compiled JS).
- Remove websocket service entry and rely on one port.

## Metrics & Observability

- Web metrics: `/api/metrics`
- Websocket metrics: `http://<ws-service>/metrics` (Prometheus format)
- Optional push gateway: configure `PUSHGATEWAY_URL` + `PROMETHEUS_JOB_NAME`

## Environment Variables (Websocket Specific)

- `WS_PORT` (defaults 8080)
- `JWT_SECRET` (enables auth if present)
- `WS_RATE_LIMIT_WINDOW_MS` (default 10000)
- `WS_RATE_LIMIT_MAX_ACTIONS` (default 100)
- `PUSHGATEWAY_URL` (optional)
- `METRICS_PUSH_INTERVAL_MS` (default 30000)

## Rollback Reminder

Use `scripts/rollback-railway.sh` to re-deploy from a prior commit if needed.

---

Generated on: 2025-09-17
