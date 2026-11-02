# Contract: documents API

Source of truth for the HTTP interface. If code disagrees with this file, the
code is wrong until this file is deliberately changed (and the ADR updated).

Base path: `/api/v1`

## `GET /api/v1/vehicles/{vin}/documents`

### Path parameters

| Name | Type | Rules |
| --- | --- | --- |
| `vin` | string | 17 chars, `[A-HJ-NPR-Z0-9]` after trim + upper-case |

### Responses

#### `200 OK` — complete

Both upstreams answered. `documents` may be empty.

```json
{
  "vin": "1HGCM82633A004352",
  "documents": [
    {
      "id": "SALES:SL-2024-001",
      "source": "SALES",
      "type": "CONTRACT",
      "title": "Vehicle Purchase Agreement",
      "issuedAt": "2024-03-12",
      "amount": 28500,
      "currency": "USD",
      "url": "https://sales.example.com/docs/SL-2024-001.pdf"
    },
    {
      "id": "SERVICE:SVC-88213",
      "source": "SERVICE",
      "type": "SERVICE_ORDER",
      "title": "10,000 km Service",
      "issuedAt": "2024-08-20",
      "amount": null,
      "currency": null,
      "url": "https://service.example.com/o/88213"
    }
  ],
  "meta": {
    "status": "COMPLETE",
    "sources": { "SALES": "OK", "SERVICE": "OK" },
    "durationMs": 812
  }
}
```

#### `200 OK` — partial

Exactly one upstream produced a usable response. Never a 5xx: usable data was
returned.

```json
{
  "vin": "4T1BF1FK5GU123789",
  "documents": [ { "id": "SALES:SL-2024-009", "source": "SALES", "...": "..." } ],
  "meta": {
    "status": "PARTIAL",
    "sources": { "SALES": "OK", "SERVICE": "TIMEOUT" },
    "durationMs": 1503
  }
}
```

#### `400 Bad Request` — invalid VIN

No upstream call is made.

```json
{
  "message": "Validation failed",
  "errors": [
    { "path": "vin", "message": "VIN must be 17 characters" }
  ]
}
```

#### `502 Bad Gateway` — both upstreams failed

```json
{
  "statusCode": 502,
  "message": "Both document sources are unavailable",
  "sources": { "SALES": "ERROR", "SERVICE": "TIMEOUT" }
}
```

## Source status values

| Value | Meaning |
| --- | --- |
| `OK` | HTTP 2xx and payload parsed successfully |
| `TIMEOUT` | deadline exceeded (1.5 s) |
| `ERROR` | connection failure or non-2xx response |
| `INVALID_PAYLOAD` | 2xx but the body did not match the expected schema |

## Ordering

`documents` is sorted by `issuedAt` descending. Ties are broken by `id`
ascending, so the response is deterministic and testable.

## Response headers

| Header | Value |
| --- | --- |
| `x-correlation-id` | echoed from the request (max 128 characters), or generated when absent |

## Why these choices

The brief specifies none of this, so each choice is recorded here.

| Decision | Chosen | Rejected | Reason |
| --- | --- | --- | --- |
| Route | `GET /api/v1/vehicles/{vin}/documents` | `GET /api/v1/documents/:vin` | Documents are a sub-resource of a vehicle; the versioned prefix allows breaking changes later. |
| Empty result | `200` with `documents: []` | `404 Not Found` | The collection exists and is empty. `404` would assert the vehicle does not exist, which we cannot know. |
| One source down | `200` with `meta.status = "PARTIAL"` | `5xx` | Usable data was returned; failing the whole request would hide it. |
| Both sources down | `502 Bad Gateway` | `503 Service Unavailable` | Our service is healthy; the upstream dependency failed. |
| Invalid VIN | `400`, before any upstream call | `200` with `[]` | Rejecting early avoids two useless network calls and distinguishes bad input from "no documents". |

Trade-off: a consumer of a partial response must read `meta`, not just the HTTP
status, to know the list is incomplete.
