---
status: accepted
date: 2026-11-02
decision-makers: candidate
---

# ADR-0002: Stack — NestJS, Prisma, PostgreSQL, React

## Context and Problem Statement

The stack must be familiar enough to finish in three days, while still producing
a design that reads as deliberate rather than accidental.

## Decision Drivers

- One language across FE and BE → a single source of truth for the API contract.
- Framework primitives should map to graded criteria (observability, validation,
  OpenAPI).
- Relational data with a JSONB escape hatch.
- No infrastructure the host machine cannot run easily.

## Considered Options

- NestJS 12 + Prisma 7 + PostgreSQL 18 + React 19
- Laravel 12 + Eloquent + MySQL + React
- Spring Boot 4 + JPA + PostgreSQL + React
- Deno + raw SQLite + Alpine.js

## Decision Outcome

Chosen option: **NestJS + Prisma + PostgreSQL + React**.

NestJS provides `Interceptor` (correlation id), `Pipe` (validation),
`@nestjs/terminus` (health), and `@nestjs/swagger` (OpenAPI) as first-class
primitives, so the observability criterion is satisfied by framework features
rather than bespoke code. TypeScript on both sides lets one Zod schema serve as
request validation, frontend form validation, and the OpenAPI source.

### Consequences

- Good: fastest path to a defensible architecture with the team's existing skill.
- Bad: NestJS 12 ships ESM, so relative imports need `.js` extensions.
- Bad: Prisma 7 requires a driver adapter (`@prisma/adapter-pg`) and a
  `prisma7.config.ts`; older tutorials do not apply.
- Bad: Biome's `useImportType` rule must stay disabled — see AGENTS.md.

### Confirmation

Versions are pinned in `BE/package.json` and `FE/package.json`; a clean
`npm ci && npm run build` in both packages, plus `docker compose up --build`,
confirms the stack.
