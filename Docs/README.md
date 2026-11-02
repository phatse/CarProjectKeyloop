# Docs

Design documentation for the Keyloop assessment (Scenario D — Unified Document
Viewer).

## Reading order

```
1. Docs/plan/phases.md        what to build next, in order
2. Docs/rfc/0001-*.md         the feature spec
3. Docs/contracts/*.md        exact request/response shapes
4. Docs/plan/data-model.md    tables, columns, indexes, seed data
5. Docs/adr/*.md              why a decision was made (do not re-litigate)
```

If the RFC and the code disagree, the RFC wins until it is updated deliberately.

## Principles

- **The brief is the contract.** Every non-trivial decision traces to a line in
  the brief or to an assumption recorded in the RFC.
- **Upstreams are untrusted.** Every call has a deadline; every response has a
  partial-failure representation.
- **Persistence has an owner.** We store what we generate (search audit), not
  documents owned by other systems (ADR-0003).
- **Verify, never assume.** A phase is done when a command proves it. Reading
  the code is not evidence.
- **Boring technology.** REST, Postgres, a modular monolith. Anything added must
  map to a graded criterion.
- **The AI proposes, the human disposes.** Every generated change is reviewed
  against this folder and a real verification command; that narrative is a
  deliverable.

## Index

| File | Purpose |
| --- | --- |
| `plan/phases.md` | 10 phases with Definition of Done |
| `plan/data-model.md` | 3 schemas, columns, indexes, seed matrix |
| `rfc/0001-documents-aggregation.md` | The only feature in Scenario D |
| `contracts/documents-api.md` | HTTP contract, status codes, and why |
| `adr/0001-scenario-d.md` | Why Scenario D |
| `adr/0002-stack.md` | Why NestJS / Prisma / Postgres / React |
| `adr/0003-audit-only-persistence.md` | Why audit only, no document cache |

## Format conventions

**RFC** — a feature spec: context, scope, design, failure semantics, acceptance
criteria, test plan. One file per feature.

**ADR** — one decision, immutable once accepted. To change a decision, write a
new ADR that supersedes the old one; never edit history.

**Contract** — the exact HTTP shapes plus the rationale behind them. If code and
contract disagree, the contract is the bug report.

## Current state

| Area | State |
| --- | --- |
| Scenario chosen | D — Unified Document Viewer |
| Infrastructure | Done (FE skeleton, BE skeleton, Postgres + API in Docker) |
| Phase 1 — database | Done: `search_audit` + 2 mock schemas, 12 seed rows |
| Phase 2 — mock APIs | Done: `:4001` sales, `:4002` service, `?fail` / `?delay` |
| Phases 3–5 — domain | Done: VIN schema, adapters, aggregation + audit |
| Next | Phase 6 — HTTP endpoint |
