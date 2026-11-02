# CarProject — Backend

NestJS 12 API on Node.js 24, PostgreSQL 18 via Prisma 7.

## Stack

| Concern | Choice | Version |
| --- | --- | --- |
| Runtime | Node.js LTS | 24.x |
| Framework | NestJS (ESM) | 12.x |
| Language | TypeScript | 6.x |
| ORM | Prisma + `@prisma/adapter-pg` | 7.10 |
| Database | PostgreSQL | 18 (Docker) |
| Validation | Zod | 4.x |
| Logging | nestjs-pino (structured JSON) | 5.x |
| Health checks | `@nestjs/terminus` | 12.x |
| API docs | `@nestjs/swagger` (OpenAPI 3.0) | 12.x |
| Tests | Vitest + Supertest | 4.x |
| Lint / format | Biome | 2.x |

## Prerequisites

- Docker — enough to run everything
- Node.js 24 LTS — only if you want local watch mode

## Quick start

### A. Everything in Docker (no Node.js needed)

From the **repository root**:

```bash
docker compose up -d --build
```

That starts PostgreSQL **and** the API. The API container applies pending Prisma
migrations on start, then runs the compiled build.

```bash
docker compose logs -f api     # follow API logs
docker compose down            # stop everything (data is kept)
```

### B. Local watch mode (for development)

```bash
cd BE
cp .env.example .env
npm install          # `postinstall` runs `prisma generate`
npm run dev          # starts Postgres (waits until healthy), then Nest in watch mode
```

> Do not run mode A and mode B at the same time — both bind port 3000.
> Stop the container first: `docker compose down`.

`npm run dev` is just `npm run db:up && nest start --watch`. If you only need the
database — for example to run `npm run test:e2e` — run `npm run db:up` on its own.

### Endpoints (both modes)

| URL | What |
| --- | --- |
| <http://localhost:3000/api/health/live> | Liveness — process only, no DB |
| <http://localhost:3000/api/health> | Readiness — includes a database round-trip |
| <http://localhost:3000/docs> | Swagger UI |
| <http://localhost:3000/docs-json> | OpenAPI 3.0 document |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | **The only command you need**: start Postgres (waits until healthy), then the API in watch mode |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run the compiled build (`node dist/main.js`) |
| `npm test` | Unit tests |
| `npm run test:e2e` | E2E tests (needs PostgreSQL running) |
| `npm run mock:sales` | Mock Sales system on `:4001` (reads `sales_system`) |
| `npm run mock:service` | Mock Service system on `:4002` (reads `service_system`) |
| `npm run lint` / `lint:fix` | Biome check / auto-fix |
| `npm run db:up` | Start PostgreSQL and wait until healthy |
| `npm run db:down` | Stop the container (data volume is kept) |
| `npm run db:reset` | Drop the container **and the data volume**, then recreate |
| `npm run db:migrate` | Create + apply a migration |
| `npm run db:seed` | Load mock upstream data (drops + recreates both mock schemas) |
| `npm run db:generate` | Regenerate the Prisma client |

## Structure

```
BE/
├── prisma/
│   ├── schema.prisma        # SearchAudit model, datasource, generator
│   └── migrations/          # SQL history; `migrate deploy` replays it
├── db/
│   └── seed.sql             # mock upstream schemas + 12 seed rows
├── mocks/
│   └── server.ts            # one process per system (MOCK_SYSTEM=sales|service)
├── prisma7.config.ts        # Prisma 7 config: schema path, migrations, DATABASE_URL
├── src/
│   ├── documents/           # the only feature module
│   │   ├── adapters/        # Sales/Service HTTP clients + DocumentSource port
│   │   ├── dto/             # Zod schemas: VIN, Document, response
│   │   ├── documents.service.ts
│   │   ├── search-audit.repository.ts
│   │   └── documents.module.ts
│   ├── config/              # env schema (Zod) + logger factory
│   ├── health/              # liveness + readiness endpoints
│   ├── prisma/              # PrismaService (driver adapter) + module
│   ├── generated/prisma/    # generated client — gitignored, do not edit
│   ├── app.module.ts
│   └── main.ts
└── test/                    # unit/ mirrors src/; e2e/ uses Supertest
```

## File naming

Suffixes follow the Nest CLI schematics and the Angular style guide (hyphenated
file names, the name states what is inside, tests end in `.spec.ts`):

| Suffix | Contains | Example |
| --- | --- | --- |
| `*.controller.ts` | HTTP controller | `documents.controller.ts` |
| `*.service.ts` | Nest provider with business logic | `documents.service.ts` |
| `*.adapter.ts` | class at a boundary | `sales.adapter.ts` |
| `*.repository.ts` | persistence | `search-audit.repository.ts` |
| `*.module.ts` | Nest module | `documents.module.ts` |
| `*.schema.ts` | Zod schema + inferred type | `vin.schema.ts` |
| `*.types.ts` | type-only declarations | `document-source.types.ts` |
| `*.health.ts` | Terminus health indicator | `prisma.health.ts` |
| `*.config.ts` | configuration factory | `logger.config.ts` |
| `*.spec.ts` | unit test | `vin.schema.spec.ts` |
| `*.e2e-spec.ts` | e2e test | `health.e2e-spec.ts` |
| plain `*.ts` | module exporting functions, or `main.ts` | `env.ts`, `upstream-client.ts` |

No invented suffixes. "Port" is still the concept (the contract a source must
implement), but the file is `document-source.types.ts` so the name describes the
contents rather than the architecture vocabulary. Symbol naming (types, classes,
functions, booleans) is in `AGENTS.md → Naming`.

## Tests

All tests live under `test/`, mirroring the `src/` tree:

```
test/
├── unit/
│   ├── config/env.spec.ts
│   └── documents/
│       ├── documents.service.spec.ts
│       ├── adapters/sales.adapter.spec.ts
│       ├── adapters/service.adapter.spec.ts
│       └── dto/vin.schema.spec.ts
└── e2e/health.e2e-spec.ts
```

| Level | Command | Location | Talks to |
| --- | --- | --- | --- |
| Unit | `npm test` | `test/unit/**/*.spec.ts` | mocks only |
| E2E | `npm run test:e2e` | `test/e2e/**/*.e2e-spec.ts` | real Postgres, real HTTP |

The two globs never overlap, so `npm test` cannot accidentally boot the app.

A test keeps the name of its subject: `test/unit/documents/adapters/sales.adapter.spec.ts`
tests `src/documents/adapters/sales.adapter.ts`. To find a test, take the source
path and swap `src/` for `test/unit/`.

Unit tests build the class through `Test.createTestingModule` and replace every
injected dependency with a mock — same wiring as the module, no network and no
database:

```ts
const moduleRef = await Test.createTestingModule({
  providers: [
    DocumentsService,
    { provide: SalesAdapter, useValue: salesMock },
    { provide: ServiceAdapter, useValue: serviceMock },
    { provide: SearchAuditRepository, useValue: auditMock },
  ],
}).compile()
```

Pure functions with no injected dependencies (Zod schemas, `validateEnv`) are
called directly; a testing module would only add noise.

## Prisma 7 notes

Prisma 7 removed the Rust query engine. Three things differ from older tutorials:

1. **A driver adapter is required.** `PrismaService` passes `new PrismaPg({ connectionString })`
   to the client; there is no `url` in `datasource`.
2. **The connection URL lives in `prisma7.config.ts`**, not in `schema.prisma`.
   The Prisma CLI does not auto-load `.env`; the config imports `dotenv/config` explicitly.
3. **The client is generated as TypeScript source** into `src/generated/prisma`
   (gitignored). Imports therefore use the `/client` entry point and the `.js` extension:

   ```ts
   import { PrismaClient } from '../generated/prisma/client.js'
   ```

## Gotcha: Biome `useImportType` breaks NestJS DI

NestJS resolves constructor dependencies through `emitDecoratorMetadata`. If a class used
only as a parameter type is imported with `import type`, TypeScript erases the import and
emits `design:paramtypes: [Function]` — the container then fails with
*"Nest can't resolve dependencies"*.

For that reason `style.useImportType` is **disabled** in `biome.json`. Keep constructor
parameter classes as value imports:

```ts
import { ConfigService } from '@nestjs/config'   // ✅
import type { ConfigService } from '@nestjs/config'  // ❌ breaks DI
```

Types that never appear in a constructor can stay `import type`.

## Environment variables

Validated at boot by `src/config/env.ts`; a missing or malformed value stops the process
with a readable message.

| Variable | Default | Notes |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development` \| `test` \| `production` |
| `PORT` | `3000` | |
| `DATABASE_URL` | — | required, must start with `postgresql://` |
| `LOG_LEVEL` | `info` | `fatal`…`trace` |
| `CORS_ORIGIN` | `http://localhost:5173` | |
| `SALES_API_URL` | `http://localhost:4001` | mock Sales system |
| `SERVICE_API_URL` | `http://localhost:4002` | mock Service system |
| `UPSTREAM_TIMEOUT_MS` | `1500` | deadline per upstream call |

## Known audit findings

`npm audit` reports 2 moderate advisories, both through `@nestjs/cli` →
`minimatch` (dev-only, used by the Nest CLI). No runtime dependency has an open
advisory. `npm audit fix --force` would change the Nest CLI major version, so the
finding is accepted and tracked here instead.
