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

# Everything in Docker (API + DB + both mock systems)
docker compose up -d --build

# Checks — run before finishing any task
cd BE && npm run lint && npx tsc --noEmit && npm test && npm run test:e2e
cd FE && npm run lint && npm run build && npm test

# Database
cd BE && npm run db:migrate     # create + apply a migration
cd BE && npm run db:seed        # load mock upstream data (drops + recreates schemas)
cd BE && npm run db:generate    # regenerate Prisma client

# Mock upstream systems (two processes, two ports)
cd BE && npm run mock:sales     # :4001, reads sales_system
cd BE && npm run mock:service   # :4002, reads service_system
```

## Repository layout

```
FE/src/
├── app/routes/          route composition only
├── features/<name>/     api, components, hooks, types, utils
├── lib/                 configured instances (http client, query client)
└── test/                unit tests mirroring src/, e2e/ for Playwright
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
   Compose them in `app/`, or promote the shared part to `components/` once a
   second feature needs it.
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
8. **Naming follows the table in [Naming](#naming).** If a file or symbol does
   not fit an existing row, add a row before inventing a suffix.

## Naming

Rules for backend code. The frontend follows React conventions: PascalCase
component files (`App.tsx`), kebab-case for everything else.

### Files

`kebab-case`, with a dot-separated suffix that states what is inside. The
authority is the Nest CLI schematics (`nest g service x` → `x.service.ts`) and
the Angular style guide (a file name describes its contents; tests end in
`.spec.ts`).

| Suffix | Contains | Example |
| --- | --- | --- |
| `*.controller.ts` | HTTP controller | `documents.controller.ts` |
| `*.service.ts` | provider with business logic | `documents.service.ts` |
| `*.adapter.ts` | class at a boundary | `sales.adapter.ts` |
| `*.repository.ts` | persistence | `search-audit.repository.ts` |
| `*.module.ts` | Nest module | `documents.module.ts` |
| `*.pipe.ts` | Nest pipe | `zod-validation.pipe.ts` |
| `*.schema.ts` | Zod schema + inferred type | `vin.schema.ts` |
| `*.types.ts` | type-only file, zero runtime code | `document-source.types.ts` |
| `*.health.ts` | Terminus health indicator | `prisma.health.ts` |
| `*.config.ts` | configuration factory | `logger.config.ts` |
| `*.spec.ts` | unit test | `vin.schema.spec.ts` |
| `*.e2e-spec.ts` | e2e test | `health.e2e-spec.ts` |
| plain `*.ts` | module exporting functions, or `main.ts` | `env.ts`, `upstream-client.ts` |

Never invent a suffix (`.port.ts`, `.helper.ts`, `.manager.ts`). If a file is
100% types it is `.types.ts`; if it contains any runtime code it is not.
Tool-mandated names (`vitest.config.ts`, `prisma7.config.ts`, `tsconfig.json`)
keep the tool's name.

### Folders

Lowercase, no suffix, one business capability per folder. Inside a feature:
`dto/` for contracts, `adapters/` for boundaries. Do not add a subfolder that
holds one file unless it will grow. Tests mirror `src/` under `test/unit/`.

### Symbols

| Kind | Convention | Example |
| --- | --- | --- |
| Type | PascalCase, no `I` prefix, no `Type` suffix | `Document`, `SourceResult` |
| Class | PascalCase; the file suffix is the class role | `SalesAdapter` in `sales.adapter.ts`, `PrismaHealthIndicator` in `prisma.health.ts` |
| Zod schema | camelCase + `Schema`; the inferred type drops the suffix | `vinSchema` → `Vin` |
| Function | camelCase, verb first for actions; test fixtures may be noun factories | `fetchUpstream`, `mergeDocuments` |
| Boolean | `is` / `has` / `can` / `should` prefix | `isProduction` |
| Constant | UPPER_SNAKE_CASE, module-level only | `VIN_PATTERN` |
| Field | camelCase; `private readonly` when it never changes | `correlationId` |

Abbreviations only for domain terms: `VIN`, `URL`, `ID`.

## Working agreement

- Read `Docs/plan/phases.md` before starting work; complete phases in order.
- Read the relevant RFC in `Docs/rfc/` before implementing a feature.
- Do not add a dependency, table, or service that is not in the RFC. If it is
  needed, update the RFC first.
- Every phase ends with its Definition of Done satisfied and verified by a real
  command output — never "should work".
- Keep changes inside the phase scope. Do not refactor unrelated code.
- **Never commit or push unless the user explicitly asks.** Leave changes in the
  working tree, report what changed, and wait for the user to review.
- **Update the related docs in the same change.** If behaviour, a contract, a
  table, a command, or a phase status changes, fix the doc that describes it
  before reporting done.
- **Tests live under `BE/test/` and `FE/src/test/`, mirroring the source
  tree**: unit tests in `test/unit/<feature>/...` (BE) or
  `src/test/<feature>/...` (FE), e2e in `BE/test/e2e/` (BE) and
  `src/test/e2e/` (FE). Unit specs use
  `Test.createTestingModule` with every dependency mocked. See
  `BE/README.md → Tests` and `FE/src/README.md`.

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
