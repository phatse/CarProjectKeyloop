# AGENTS.md

Guidance for coding agents working in this repository.
Format: [agents.md](https://agents.md/). Detailed specs live in `Docs/`.

## Project

Keyloop technical assessment, **Scenario D — Unified Document Viewer**.
A user enters a VIN and gets one consolidated list of documents from two mocked
dealership systems (Sales, Service), each document labelled with its source.

## Stack

| Layer | Choice |
| --- | --- |
| Frontend | React 19 + Vite 8 + TypeScript 7, Ant Design 6, TanStack Query 5 |
| Backend | NestJS 12 (ESM) + TypeScript 6, Prisma 7, Zod 4 |
| Database | PostgreSQL 18 (Docker) |
| Tests | Vitest + Supertest (BE), Vitest + Testing Library (FE) |
| Lint/format | Biome 2 |

## Commands

```bash
# Backend (starts Postgres too)
cd BE && npm run dev

# Frontend
cd FE && npm run dev

# Everything in Docker (API + DB)
docker compose up -d --build

# Checks — run before finishing any task
cd BE && npm run lint && npx tsc --noEmit && npm test && npm run test:e2e
cd FE && npm run lint && npm run build && npm test

# Database
cd BE && npm run db:migrate     # create + apply a migration
cd BE && npm run db:generate    # regenerate Prisma client
```

## Repository layout

```
FE/src/
├── app/routes/          route composition only
├── features/<name>/     api, components, hooks, types, utils
├── components/ui|layouts
├── lib/ config/ test/
BE/src/
├── documents/           feature module (controller, service, adapters, dto)
├── health/ prisma/ config/ common/
BE/mocks/                two mock upstream systems (sales, service)
BE/prisma/               schema + migrations
Docs/                    RFCs, ADRs, plan, API contracts
```

## Architecture rules

1. **Feature-first.** One folder per business capability. Never group by
   technical layer (`controllers/`, `services/`).
2. **No cross-feature imports.** `features/a` never imports `features/b`.
   Share via `components/` or compose in `app/`.
3. **No barrel files.** Import the concrete file, never a folder `index.ts`.
   Exception: `lib/` may expose a single configured instance.
4. **`type`, never `interface`.** Project rule.
5. **Constructor parameter classes must be value imports.**
   `import { ConfigService } from '@nestjs/config'` — not `import type`.
   Biome's `useImportType` is disabled for this reason; re-enabling it breaks
   NestJS DI by erasing `design:paramtypes`.
6. **Env is parsed once.** Never read `process.env` outside `config/env.ts`.
7. **Business rules live in services, not controllers.** Controllers validate
   and delegate.

## Working agreement

- Read `Docs/plan/phases.md` before starting work; complete phases in order.
- Read the relevant RFC in `Docs/rfc/` before implementing a feature.
- Do not add a dependency, table, or service that is not in the RFC. If it is
  needed, update the RFC first.
- Every phase ends with its Definition of Done satisfied and verified by a real
  command output — never "should work".
- Keep changes inside the phase scope. Do not refactor unrelated code.

## Definition of done (per phase)

1. `npm run lint` passes.
2. Type check passes.
3. Tests for the new behaviour exist and pass.
4. The behaviour was verified by running it, not by reading code.
5. Docs updated if a contract, table, or assumption changed.

## Explicitly out of scope

Microservices, Kafka, Redis, GraphQL, WebSockets, Kubernetes, CQRS/event
sourcing. The brief requires a REST API; added infrastructure must justify
itself against a graded criterion or it is rejected.
