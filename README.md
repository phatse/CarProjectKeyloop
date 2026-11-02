# CarProject — Keyloop Technical Assessment

Monorepo for the Keyloop coding challenge (Scenario D — Unified Document Viewer).

## Structure

```
CarProject/
├── FE/      React 19 + TypeScript SPA (Vite)
├── BE/      NestJS 12 + Prisma 7 + PostgreSQL 18
├── Docs/    System design document, ADRs, diagrams
└── docker-compose.yml   PostgreSQL + API (containerised)
```

## Status

| Area | State |
| --- | --- |
| `FE/` | ✅ Skeleton — Vite + React 19 + TS, libs installed, lint/test/build verified |
| `BE/` | ✅ Skeleton — NestJS 12 + Prisma 7 + Postgres; phases 1–5: audit table, seed, mocks, adapters, aggregation |
| `Docs/` | ✅ RFC-0001, 3 ADRs, phase plan, data model, API contract |
| `AGENTS.md` | ✅ Agent rules (auto-loaded by OpenCode / Codex / Cursor) |
| Root workspaces | ⬜ Not set up (each app installs independently) |
| Domain code | 🟨 Phases 1–5 done (DB, mocks, adapters, service). Next: Phase 6 (endpoint) |

## Quick start

### Backend + database in Docker (no Node.js needed)

```bash
docker compose up -d --build
```

| URL | What |
| --- | --- |
| <http://localhost:3000/docs> | Swagger UI |
| <http://localhost:3000/api/health> | Health (includes a DB round-trip) |

The API container applies pending Prisma migrations on start, then runs the
compiled build.

### Frontend on the host

```bash
cd FE
npm install
cp .env.example .env.local
npm run dev                # http://localhost:5173
```

The frontend proxies `/api/*` to `http://localhost:3000`, so no CORS setup is needed
in development.

### Alternative: backend in watch mode (development)

```bash
cd BE
cp .env.example .env
npm install
npm run dev                # starts Postgres, then Nest with hot reload
```

## Commands (the only ones you need)

| What | Command |
| --- | --- |
| Start API + DB in Docker | `docker compose up -d --build` |
| Follow API logs | `docker compose logs -f api` |
| Stop everything | `docker compose down` |
| Start API + DB in watch mode | `cd BE && npm run dev` |
| Start UI | `cd FE && npm run dev` |
| Run backend tests | `cd BE && npm test && npm run test:e2e` |
| Load mock data | `cd BE && npm run db:seed` |
| Start mock Sales system | `cd BE && npm run mock:sales` (`:4001`) |
| Start mock Service system | `cd BE && npm run mock:service` (`:4002`) |
| Reset the database | `cd BE && npm run db:reset` |

## Ports

| Service | Port |
| --- | --- |
| Frontend (Vite) | 5173 |
| Backend (NestJS) | 3000 |
| PostgreSQL | 5432 |

See `FE/README.md` and `BE/README.md` for details.
