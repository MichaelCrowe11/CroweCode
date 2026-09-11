# CroweCode

CroweCode was a browser code editor and project dashboard built on Next.js: a Monaco editor, a web terminal, Git and Docker panels, and code help from third-party language models, all behind a login.

## Status

`archived`. Development stopped in September 2025. The 22 commits on `main` run from 2025-08-20 to 2025-09-22. The only later activity is Dependabot branches. The hosted web app is gone: `crowecode.com`, `www.crowecode.com`, `docs.crowecode.com` and the Fly.io app name in `fly.toml` did not resolve when checked on 2026-09-10. The code is kept for reference.

## Install and first run

Not maintained. For reference, this is what ran on 2026-09-10 with Node 26.5.0 and npm 11.17.0:

```
npm ci --ignore-scripts
# fails: ERESOLVE, @testing-library/react@14.3.1 does not accept react@19.1.0

npm ci --ignore-scripts --legacy-peer-deps
# added 1768 packages in 18s

npx prisma generate
# ok

npm test
# Test Files  1 failed | 1 passed (2)
# Tests  6 passed (6)
# tests/unit/auth.test.ts passes. tests/e2e/smoke.test.ts is a Playwright file that vitest collects and cannot run.

npm run build
# Failed to compile. Module not found: '@/components/ui/card', '@/components/ui/button', '@/lib/utils'

npx next dev -p 3124
# Ready in 1134ms
# GET / -> 200 (landing page)
# GET /api/health -> 200 {"status":"healthy", "checks":{"database":"not_configured","redis":"not_configured"}}
# GET /ide -> 307 redirect to login
```

The dev server serves the landing page and the health route with no database. The editor, terminal and dashboard routes redirect to `/login`, and there is no database to log in against. The production build does not compile.

## What runs today

Nothing is maintained.

- `tests/unit/auth.test.ts`: six tests for password hashing and JWT signing in `src/lib/auth.ts` pass.
- `npx next dev` starts and serves `/` and `/api/health`.
- `next build` fails. `src/app/dashboard/billing/page.tsx`, `src/components/billing/CheckoutButton.tsx`, `src/components/ui/badge.tsx` and `src/components/ui/progress.tsx` import files that are not in the repository.
- `src/middleware.ts` line 113 blocks requests whose user agent matches `wget` or `curl` with HTTP 403.

## Limits

- This is not a hosted service. Nothing here is for sale, and the prices on the page under `src/app/pricing` are not an offer.
- The previous README claimed a proprietary model, a 256K context window, 94% code accuracy, no data retention, and SOC 2, HIPAA and GDPR compliance. None of that is supported by the code. The model calls in `src/lib` go to third-party APIs (Anthropic, OpenAI, xAI, Google Vertex) with keys read from the environment.
- Do not run this with real credentials. `env.example` lists 59 variables, and no part of the repository was audited for how it handles them.
- The many deploy scripts and guides in the repository root (Fly.io, GCP, Railway, Render, Vercel, Oracle, VPS) describe hosts that no longer exist.

## License and contact

No LICENSE file. `package.json` declares no license and marks the package private. No license is granted.

Contact: michael@crowelogic.com
