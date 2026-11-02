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
| `npm run lint` / `lint:fix` | Biome check / auto-fix |
| `npm run db:up` | Start PostgreSQL and wait until healthy |
| `npm run db:down` | Stop the container (data volume is kept) |
| `npm run db:reset` | Drop the container **and the data volume**, then recreate |
| `npm run db:migrate` | Create + apply a migration |
| `npm run db:generate` | Regenerate the Prisma client |

## Structure

```
BE/
├── prisma/
│   └── schema.prisma        # datasource + generator (models added per feature)
├── prisma7.config.ts        # Prisma 7 config: schema path, migrations, DATABASE_URL
├── src/
│   ├── common/pipes/        # cross-cutting pipes (ZodValidationPipe)
│   ├── config/              # env schema (Zod) + logger factory
│   ├── health/              # liveness + readiness endpoints
│   ├── prisma/              # PrismaService (driver adapter) + module
│   ├── generated/prisma/    # generated client — gitignored, do not edit
│   ├── app.module.ts
│   └── main.ts
└── test/                    # e2e specs
```

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

## Known audit findings

`npm audit` reports 7 advisories, all inside the Nest CLI's own dev tooling
(`@nestjs/cli` → `minimatch`, `@nestjs/mau` → `inquirer`/`undici`, `external-editor` → `tmp`).
None are runtime dependencies of the API; `npm audit fix --force` would downgrade the
Nest CLI, so they are accepted and tracked here instead.
