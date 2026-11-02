---
status: accepted
date: 2026-11-02
decision-makers: candidate
---

# ADR-0003: Persist search audit only, not document bodies

## Context and Problem Statement

Scenario D aggregates data owned by external systems, but the general backend
instructions require a persistent database. What exactly should we persist?

## Decision Drivers

- Brief: "Expose a RESTful API and use a persistent database."
- Data ownership: documents belong to the Sales and Service systems.
- Stale copies create a trust problem ("how old is this data?").
- The database must be visibly exercised, not decorative.

## Considered Options

1. **Audit only** — one table recording each search outcome.
2. **Document cache + audit** — copy normalized documents, serve them when an
   upstream is down.
3. **No database** — in-memory only.

## Decision Outcome

Chosen option: **1 — audit only**.

A `search_audit` row per search records the VIN, correlation id, per-source
status and latency, document count, and whether the response was degraded. It
satisfies the persistence requirement, makes production questions answerable
("why did this VIN fail yesterday?"), and avoids claiming ownership of data that
is not ours.

Option 2 was rejected because it introduces a staleness contract the brief never
asks for, plus a retention and privacy discussion, in exchange for a demo
nicety. It remains a documented future extension.

Option 3 violates the brief.

### Consequences

- Good: small schema, no cache invalidation, no stale-data semantics.
- Good: audit doubles as the evidence trail for the observability criterion.
- Bad: when an upstream is down we can only return partial live results; we
  cannot show "last known documents".
- Bad: the demo cannot show a cache hit — degraded mode is demonstrated through
  partial success instead.

### Confirmation

`BE/prisma/schema.prisma` contains `SearchAudit` and no document table.
`search_audit` rows are asserted in the e2e test after a search.
