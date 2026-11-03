---
status: accepted
date: 2026-11-02
decision-makers: candidate
consulted: Keyloop assessment brief
---

# ADR-0001: Implement Scenario D (Unified Document Viewer)

## Context and Problem Statement

The assessment offers four scenarios (A scheduler, B inventory, C leads,
D document viewer). One must be chosen and defended in a 5–10 minute video.

## Decision Drivers

- Graded on system design and problem-solving, not on feature count.
- Must expose a persistent database and a REST API.
- Must produce meaningful tests and an observability story.
- Must be achievable within roughly three days.

## Considered Options

- A — Unified Service Scheduler
- B — Intelligent Inventory Dashboard
- C — Sales Lead Management Tool
- D — Unified Document Viewer

## Decision Outcome

Chosen option: **D — Unified Document Viewer**.

It is the only scenario with two *untrusted external dependencies*, which gives
real material for parallel I/O, per-source deadlines, partial failure, response
normalization, and per-source telemetry. Scenario C is CRUD with no business
logic to test; A adds interval arithmetic that consumes the time budget without
adding a new class of problem; B is mostly UI state.

### Consequences

- Good: every graded dimension has something concrete behind it.
- Bad: correctness depends on data we must invent ourselves (no fixtures are
  provided), so the mock dataset must be designed to exercise failure paths.
- Bad: more moving parts than C (two mock services to build and run).

### Confirmation

Traceability is recorded in the RFC acceptance criteria: each brief bullet maps
to a test in `BE/test/` (unit or e2e).
