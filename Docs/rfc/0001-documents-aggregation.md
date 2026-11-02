---
number: 0001
title: Aggregate vehicle documents from two upstream systems
status: accepted
date: 2026-11-02
related: ADR-0001, ADR-0002, ADR-0003
---

## 1. Context

Brief, Scenario D (Domain: Operate):

> Build a Unified Document Viewer to provide a single view of all documents
> related to a vehicle by connecting to two different (mocked) dealership
> systems.

Three required behaviours: unified VIN search, parallel aggregation from two
mocked APIs, consolidated view labelled by source.

## 2. Scope

**In scope**

- VIN validation and normalisation.
- Two mock upstream systems, backed by their own Postgres schemas.
- Parallel fetch with per-source deadline.
- Normalisation of two incompatible payload shapes into one `Document`.
- Merge, de-duplicate, sort.
- Partial-failure representation.
- Audit persistence per search.
- One frontend screen with four states.

**Out of scope**

- Authentication and roles (brief has none).
- Document upload, preview, or storage of file bodies.
- Caching document bodies (ADR-0003).
- Real-time updates / WebSockets (brief requires REST only).
- Pagination (a vehicle has tens of documents, not thousands).

## 3. Functional requirements

| # | Requirement | Source | Acceptance criterion |
| --- | --- | --- | --- |
| FR-1 | Accept a VIN from a single search field | brief D.1 | `GET /api/v1/vehicles/{vin}/documents` responds for a valid VIN |
| FR-2 | Call both upstreams in parallel | brief D.2 | Total latency ≈ max(source latencies), not sum; asserted in unit test |
| FR-3 | Consolidate results into one list | brief D.3 | Response contains documents from both sources in one array |
| FR-4 | Label every document with its source | brief D.3 | Every item has `source: "SALES" \| "SERVICE"` |
| FR-5 | Persist each search | brief Part 2 | A `search_audit` row exists after every successful/partial search |
| FR-6 | Survive one upstream failing | design | Response is `200` with `meta.status = "PARTIAL"` |
| FR-7 | Reject malformed VIN without calling upstream | design | `400`, and no upstream request is made |

## 4. Design

```
Controller          validates VIN (Zod pipe), delegates, maps errors
   │
Service             orchestrates: parallel fetch → merge → dedupe → sort → audit
   │
Adapters            one per source; own HTTP shape, own parser, own timeout
   │
Mock systems        Express/Fastify apps reading their own Postgres schema
```

Responsibilities:

| Component | Owns | Must not |
| --- | --- | --- |
| `DocumentsController` | HTTP mapping | contain business rules |
| `DocumentsService` | Aggregation rules, failure policy | know HTTP details of upstreams |
| `SalesAdapter` / `ServiceAdapter` | Wire format, timeout, parsing | merge or persist |
| `SearchAuditRepository` | Persistence | know about HTTP |

Each adapter implements `DocumentSource`:

```ts
type SourceResult = {
  source: 'SALES' | 'SERVICE'
  status: 'OK' | 'TIMEOUT' | 'ERROR' | 'INVALID_PAYLOAD'
  documents: Document[]
  latencyMs: number
}

type DocumentSource = {
  readonly name: 'SALES' | 'SERVICE'
  fetch(vin: string): Promise<SourceResult>
}
```

Adapters never throw for upstream problems — they return a `SourceResult`.
Throwing is reserved for programmer errors.

## 5. Data model

- `public.search_audit` — owned by this service (ADR-0003).
- `sales_system.document`, `service_system.document` — mock data owned by the
  simulated external systems; this service only reads them through HTTP.

Details: `Docs/plan/data-model.md`.

## 6. API

`Docs/contracts/documents-api.md`.

## 7. Failure semantics

| Situation | Upstream result | HTTP | `meta.status` |
| --- | --- | --- | --- |
| Both return documents | OK / OK | 200 | COMPLETE |
| Both return nothing | OK / OK | 200 | COMPLETE (empty) |
| One times out | TIMEOUT / OK | 200 | PARTIAL |
| One returns 5xx | ERROR / OK | 200 | PARTIAL |
| One returns unparsable body | INVALID_PAYLOAD / OK | 200 | PARTIAL |
| Both fail | TIMEOUT+ERROR | 502 | — |
| VIN malformed | not called | 400 | — |

Dedupe rule: two documents are the same when `(source, externalId)` match.
Cross-source duplicates are **not** merged — they are distinct records in
distinct systems and both are shown.

## 8. Assumptions

1. VIN is 17 characters from `[A-HJ-NPR-Z0-9]` (ISO 3779); input is trimmed and
   upper-cased before validation.
2. One vehicle has a bounded number of documents (< 100), so no pagination.
3. Upstream latency p99 is under 1.5 s; the deadline is 1.5 s per source,
   configurable through `UPSTREAM_TIMEOUT_MS` (default 1500) so tests can shrink
   it without waiting for the real deadline.
4. The mock systems' data shapes are fixed and versioned in this repository.
5. A search with no results is a valid outcome, not an error.

## 9. Test plan

| Level | Case | File |
| --- | --- | --- |
| unit | VIN schema: valid, too short, illegal chars, lowercase | `vin.schema.spec.ts` |
| unit | Sales adapter maps payload; malformed → INVALID_PAYLOAD | `sales.adapter.spec.ts` |
| unit | Service adapter maps payload; malformed → INVALID_PAYLOAD | `service.adapter.spec.ts` |
| unit | Aggregator: both OK, one ERROR, one TIMEOUT, both fail, dedupe, empty, ordering | `documents.service.spec.ts` |
| unit | Parallelism: total time ≈ max, not sum | `documents.service.spec.ts` |
| e2e | happy path → 200 COMPLETE, 6 documents, both sources present | `test/documents.e2e-spec.ts` |
| e2e | service mock down → 200 PARTIAL, sales documents only | `test/documents.e2e-spec.ts` |
| e2e | malformed VIN → 400, no upstream call | `test/documents.e2e-spec.ts` |
| e2e | audit row written for each search | `test/documents.e2e-spec.ts` |

## 10. Verification

```bash
cd BE
npm run lint && npx tsc --noEmit
npm test
docker compose up -d
npm run test:e2e
curl -s localhost:3000/api/v1/vehicles/1HGCM82633A004352/documents | jq
```

## 11. Open questions

- None blocking. Cache/backfill deliberately deferred (ADR-0003).
