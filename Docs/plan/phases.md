# Implementation phases

Work in order. A phase starts only when the previous one's Definition of Done is
satisfied. Do not merge phases; do not skip.

Legend: `[ ]` not started · `[~]` in progress · `[x]` done

---

## Phase 1 — Database schema

- [ ] `public.search_audit` model in `prisma/schema.prisma`
- [ ] First migration committed
- [ ] `BE/db/seed.sql` creates `sales_system` and `service_system` schemas + data
- [ ] Seed is idempotent (`DROP SCHEMA IF EXISTS ... CASCADE` first)

**DoD** — `npm run db:migrate` succeeds; `psql -c '\dn'` lists three schemas;
`select count(*) from sales_system.document` returns 3.

---

## Phase 2 — Mock upstream systems

- [ ] `BE/mocks/` runs two instances (`MOCK_SYSTEM=sales|service`)
- [ ] `GET /documents?vin=` reads from its own schema
- [ ] Fault injection: `?fail=true`, `?delay=<ms>`
- [ ] Distinct payload shapes per system (different field names on purpose)

**DoD** — `curl` returns documents for a known VIN; `?fail=true` returns 500;
`?delay=5000` hangs past the deadline.

---

## Phase 3 — Contract and validation

- [ ] `vin.schema.ts`, `document.schema.ts`, `response.schema.ts`
- [ ] Types inferred from schemas (`z.infer`), no hand-written duplicates
- [ ] Unit tests for VIN edge cases

**DoD** — `npm test` green; VIN tests cover valid, short, long, illegal chars,
lowercase.

---

## Phase 4 — Upstream adapters

- [ ] `DocumentSource` port
- [ ] `SalesAdapter`, `ServiceAdapter`
- [ ] Per-call `AbortSignal.timeout(1500)`
- [ ] Parse with Zod; malformed payload → `INVALID_PAYLOAD`, never throw
- [ ] Unit tests with fixture payloads

**DoD** — adapter specs green; a malformed fixture yields `INVALID_PAYLOAD`.

---

## Phase 5 — Aggregation service

- [ ] `Promise.allSettled` over both sources
- [ ] Merge → dedupe by `(source, externalId)` → sort `issuedAt` desc
- [ ] Persist `search_audit` (failure to persist must not fail the request)
- [ ] Build `meta.status` and `meta.sources`

**DoD** — 7 unit cases green, including "total latency ≈ max, not sum".

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
- [ ] `SALES_API_URL`, `SERVICE_API_URL` in `config/env.ts`
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
