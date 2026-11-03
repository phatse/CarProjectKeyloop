# CarProject — Keyloop Technical Assessment

Monorepo for the Keyloop coding challenge (Scenario D — Unified Document Viewer).

## Structure

```
CarProject/
├── FE/      React 19 + TypeScript SPA (Vite)
├── BE/      NestJS 12 + Prisma 7 + PostgreSQL 18
├── Docs/    System design, RFC, ADRs, API contract, phase plan, data model
└── docker-compose.yml   PostgreSQL + API + both mock systems
```

## Status

| Area | State |
| --- | --- |
| `FE/` | ✅ Document viewer — VIN search, aggregated list, source tags, degraded banner |
| `BE/` | ✅ NestJS 12 + Prisma 7 + Postgres; phases 1–9: audit table, seed, both mock systems, adapters, aggregation, endpoint, health checks, e2e |
| `Docs/` | ✅ RFC-0001, 3 ADRs, system design, phase plan, data model, API contract |
| `AGENTS.md` | ✅ Agent rules (auto-loaded by OpenCode / Codex / Cursor) |
| Root workspaces | ⬜ Not set up (each app installs independently) |
| Docker | ✅ API, Postgres and both mocks; mock data loaded with the seed command in Quick start |

## Quick start

### Backend + database in Docker (Node.js optional)

```bash
docker compose up -d --build
```

Then load the mock documents — first run only. Pick **one**:

**Only Docker installed:**

```bash
docker compose exec -T postgres psql -U carproject -d carproject \
  -v ON_ERROR_STOP=1 < BE/db/seed.sql
```

**Node/npm installed** (runs the project script, same SQL):

```bash
cd BE && npm run db:seed
```

Both create `sales_system` and `service_system` and insert the 12 mock documents
the two mock systems serve. Without this step every search returns `502`.
Re-running either command resets the mock data to those 12 rows.

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
npm run dev                # starts Postgres + both mocks, then Nest with hot reload
```

## Commands (the only ones you need)

| What | Command |
| --- | --- |
| Start API + DB + mocks in Docker | `docker compose up -d --build` |
| Follow API logs | `docker compose logs -f api` |
| Stop everything | `docker compose down` |
| Start API + DB + mocks in watch mode | `cd BE && npm run dev` |
| Start UI | `cd FE && npm run dev` |
| Run backend tests | `cd BE && npm test && npm run test:e2e` (Postgres must be up) |
| Run frontend unit tests | `cd FE && npm test` |
| Run browser tests | `cd FE && npx playwright test` (full stack must be up) |
| Load mock data | `cd BE && npm run db:seed` |
| Start mock Sales system | `cd BE && npm run mock:sales` (`:4001`) |
| Start mock Service system | `cd BE && npm run mock:service` (`:4002`) |
| Reset the database | `cd BE && npm run db:reset` |

The Docker stack already serves the mocks on `:4001` and `:4002`; run the two
`mock:*` commands only when the Docker mocks are stopped.

## Ports

| Service | Port |
| --- | --- |
| Frontend (Vite) | 5173 |
| Backend (NestJS) | 3000 |
| PostgreSQL | 5432 |
| Mock Sales system | 4001 |
| Mock Service system | 4002 |

See `FE/README.md` and `BE/README.md` for details.
