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
cp .env.example .env
npm run dev                # http://localhost:5173
```

The frontend proxies `/api/*` to `VITE_PROXY_TARGET` from `.env` (the example
points at `http://localhost:3000`), so no CORS setup is needed in development.

### Alternative: backend in watch mode (development)

```bash
cd BE
cp .env.example .env
npm install
npm run dev                # starts Postgres + both mocks, then Nest with hot reload
```

## AI Collaboration Narrative

I used an AI coding agent (OpenCode) as a drafting partner, not as the author of
record. The rule was simple: the agent proposes, I decide, and nothing is done
until a command proves it. Repository rules live in `AGENTS.md`, so every session
starts from the same constraints instead of a fresh prompt.

### How I directed the work

- **Constraints first.** Before the first prompt I fixed the scenario, the stack
  and the boundaries: one endpoint, two mocked systems, audit-only persistence,
  no extra infrastructure.
- **Design before code.** The agent drafted
  [RFC-0001](Docs/rfc/0001-documents-aggregation.md), three ADRs, the
  [API contract](Docs/contracts/documents-api.md) and a
  [10-phase plan](Docs/plan/phases.md) with a Definition of Done per phase. I
  reviewed those documents before implementation started.
- **Small tasks, explicit scope.** Each phase was implemented and verified on its
  own. Work outside the phase was rejected or sent back as a separate task.
- The design-phase detail is in
  [system-design.md §8](Docs/system-design.md#8-how-genai-was-used-in-the-design-phase).

### How I verified the output

Nothing was accepted because it looked right. Each phase ended with a command:

| Check | Command | Result |
| --- | --- | --- |
| Backend unit | `cd BE && npm test` | 32 tests |
| Backend e2e | `cd BE && npm run test:e2e` | 8 tests, real Postgres and HTTP |
| Frontend unit | `cd FE && npm test` | 17 tests |
| Browser flow | `cd FE && npx playwright test` | 3 tests against the running stack |
| Full stack | `docker compose up -d --build` | 4 healthy containers, `COMPLETE` with 6 documents |

Review was not only "do the tests pass". After implementation I compared the
written claims with the code and corrected 12 documentation files in one pass:
wrong claims about the correlation id and the mock stack, a health check
attributed to the wrong endpoint, stale test counts, and a reference to a
retention note that did not exist.

### What the process caught

- **Duplicate validation message.** The required rule and the format validator
  both fired on an empty VIN. Found while exercising the form, fixed so one rule
  owns the empty case, and covered by two component tests.
- **A dev command that could not run.** `npm run dev` started the API container
  and then failed to bind port 3000. Reproduced with a real bind attempt, then
  the script was split so local watch mode leaves that port to the local process.
- **A local mode that returned `502`.** The API on the host called
  `localhost:4001`, but the Docker mocks were not published to the host. Two port
  mappings later, the same request returned `COMPLETE` with six documents.
- **A fresh install that returned `502`.** `docker compose up` starts the stack
  but does not load the mock schemas. The seed step is now part of the quick
  start, with a Docker-only command and an npm shortcut.

### What I did not accept

The agent's default answer to "system design" is to add components. I kept the
system small on purpose:

- No Redis cache: documents belong to the upstream systems, and a cache would
  create a staleness contract the brief never asks for (ADR-0003).
- No circuit breaker or retry: a per-call deadline is enough for two sources.
  Both are listed as future work, each with the trigger that would justify it.
- No second database: the one table this service owns lives in the same
  PostgreSQL instance, in its own schema.

Every box in the architecture diagram exists and runs. The alternatives are
recorded, with the reason they were rejected, in
[ADR-0003](Docs/adr/0003-audit-only-persistence.md) and
[system-design.md §10](Docs/system-design.md#10-future-work).

### Bottom line

AI made the drafts faster and the checks cheaper. What made the result
trustworthy was the process around it: written decisions, a Definition of Done
per phase, and a refusal to call anything done until a command showed it.

## Commands (the only ones you need)

| What | Command |
| --- | --- |
| Start API + DB + mocks in Docker | `docker compose up -d --build` |
| Follow API logs | `docker compose logs -f api` |
| Stop everything | `docker compose down` |
| Start API + DB + mocks in watch mode | `cd BE && npm run dev` |
| Start UI | `cd FE && npm run dev` |
| Run backend tests | `cd BE && npm test && npm run test:e2e` (Postgres up and seeded) |
| Run frontend unit tests | `cd FE && npm test` |
| Run browser tests | `cd FE && npx playwright test` (API, mocks and seeded database up) |
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
