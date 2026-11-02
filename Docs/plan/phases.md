# Implementation phases

Work in order. A phase starts only when the previous one's Definition of Done is
satisfied. Do not merge phases; do not skip.

Legend: `[ ]` not started · `[~]` in progress · `[x]` done

---

## Phase 1 — Database schema

- [x] `public.search_audit` model in `prisma/schema.prisma`
- [x] First migration committed
- [x] `BE/db/seed.sql` creates `sales_system` and `service_system` schemas + data
- [x] Seed is idempotent (`DROP SCHEMA IF EXISTS ... CASCADE` first)

**DoD** — `npm run db:migrate` succeeds; `psql -c '\dn'` lists three schemas;
`select count(*) from sales_system.document` returns 7 and `service_system` 5.
Migration `20261102134606_init`; seed applied with `npm run db:seed`.

---

## Phase 2 — Mock upstream systems

- [x] `BE/mocks/` runs two instances (`MOCK_SYSTEM=sales|service`)
- [x] `GET /documents?vin=` reads from its own schema
- [x] Fault injection: `?fail=true`, `?delay=<ms>`
- [x] Distinct payload shapes per system (different field names on purpose)

**DoD** — `curl` returns documents for a known VIN; `?fail=true` returns 500;
`?delay=1200` responded in 1.21 s. Both processes read only their own schema.

---

## Phase 3 — Contract and validation

- [x] `vin.schema.ts`, `document.schema.ts`, `response.schema.ts`
- [x] Types inferred from schemas (`z.infer`), no hand-written duplicates
- [x] Unit tests for VIN edge cases

**DoD** — `npm test` green; 7 VIN cases: valid, trim + lower-case, short,
long, letters I/O/Q, symbols, empty.

---

## Phase 4 — Upstream adapters

- [x] `DocumentSource` port
- [x] `SalesAdapter`, `ServiceAdapter`
- [x] Per-call `AbortSignal.timeout(1500)`, overridable with `UPSTREAM_TIMEOUT_MS`
- [x] Parse with Zod; malformed payload → `INVALID_PAYLOAD`, never throw
- [x] Unit tests with fixture payloads

**DoD** — adapter specs green; malformed fixture yields `INVALID_PAYLOAD`;
non-2xx yields `ERROR`; expired deadline yields `TIMEOUT`.

---

## Phase 5 — Aggregation service

- [x] `Promise.allSettled` over both sources
- [x] Merge → dedupe by `(source, externalId)` → sort `issuedAt` desc
- [x] Persist `search_audit` (failure to persist must not fail the request)
- [x] Build `meta.status` and `meta.sources`

**DoD** — 10 unit cases green, including "both calls run in parallel" (100 ms +
100 ms completes under 180 ms). Verified against the real mocks: 6 documents
`COMPLETE`, then with the Service mock stopped, 3 documents `PARTIAL`; both
searches left a `search_audit` row.

---

## Phase 6 — HTTP endpoint

- [ ] `GET /api/v1/vehicles/:vin/documents`
- [ ] `ZodValidationPipe` on the param → 400 before any upstream call
- [ ] 200 COMPLETE / 200 PARTIAL / 502 both failed
- [ ] Swagger annotations

**DoD** — `curl` shows the contract from `Docs/contracts/documents-api.md`;
`/docs` renders the endpoint.

---

## Phase 7 — Integration tests

- [ ] e2e: happy path, partial, invalid VIN, audit row
- [ ] Runs against real Postgres + real mock services

**DoD** — `npm run test:e2e` green with containers up.

---

## Phase 8 — Frontend

- [ ] `features/documents/` — api, hooks, components
- [ ] Route `app/routes/document-viewer.tsx`
- [ ] States: idle, loading, empty, error, partial (banner)
- [ ] Source badge per row

**DoD** — searching a known VIN renders the consolidated list in the browser;
killing the service mock shows the degraded banner.

---

## Phase 9 — Docker integration

- [ ] `mock-sales`, `mock-service` services in `docker-compose.yml`
- [x] `SALES_API_URL`, `SERVICE_API_URL`, `UPSTREAM_TIMEOUT_MS` in `config/env.ts`
- [ ] Seed runs automatically on first start

**DoD** — `docker compose up -d --build` → four healthy containers; full flow
works from the browser.

---

## Phase 10 — Documentation and demo

- [ ] `Docs/system-design.md` (architecture, data flow, tech justification,
      observability, GenAI section — the brief's Part 1 checklist)
- [ ] README: build/run/test + **AI Collaboration Narrative**
- [ ] Video script: intro, design, AI story, demo, lessons

**DoD** — a reviewer can clone, run two commands, and see the feature without
asking a question.
