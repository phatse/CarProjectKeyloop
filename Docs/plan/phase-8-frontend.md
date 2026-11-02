# Phase 8 — Document viewer

**Goal:** one screen where a reviewer types a VIN and sees the consolidated
document list, with the source labelled on every row and a banner when a
source is down.

**Architecture:** one route composes four components. Data fetching lives in
one hook over TanStack Query; validation lives in the form and mirrors the
backend rule. No new dependency, no custom CSS.

**Stack:** React 19, antd 6, TanStack Query 5, axios, Vitest 5 + Testing Library.

**Spec:** `Docs/contracts/documents-api.md`, `Docs/plan/phases.md` (Phase 8).

## Decisions already made

- Validate on both sides. The form blocks a malformed VIN before any request;
  the backend still returns 400 for direct callers.
- One route, four components (not one file, not a state-machine hook).
- antd only: `ConfigProvider` tokens for colour, component props for layout.
  No CSS files, no `react-hook-form`, no client store.
- File names follow the React docs: `PascalCase.tsx` for components,
  `useCamelCase.ts` for hooks. `FE/src/README.md` is updated to match.

## Files

```
FE/src/
├── lib/query-client.ts                     QueryClient (retry: false)
├── lib/http.ts                             axios instance, baseURL ''
├── app/providers.tsx                       QueryClientProvider + ConfigProvider
├── app/routes/DocumentViewer.tsx           composes the four components
├── features/documents/
│   ├── types/document.ts                   Document, DocumentsResponse
│   ├── api/get-documents.ts                axios call
│   ├── hooks/useVehicleDocuments.ts        useQuery wrapper
│   ├── utils/vin.ts                        VIN_PATTERN, isValidVin
│   └── components/
│       ├── VinSearchForm.tsx               Form + rules
│       ├── DocumentList.tsx                List
│       ├── SourceTag.tsx                   Tag
│       └── DegradedBanner.tsx              Alert
```

Empty placeholder folders (`api/`, `components/`, ...) already exist; the
`.gitkeep` files are removed as real files land.

## Naming

| Kind | Rule | Example |
| --- | --- | --- |
| Component file | PascalCase, matches the export | `DocumentList.tsx` |
| Component | function declaration, PascalCase | `export function DocumentList()` |
| Hook file | `use` + camelCase | `useVehicleDocuments.ts` |
| Non-component module | kebab-case | `get-documents.ts` |
| Type | PascalCase, `type` only | `Document` |
| Test | beside the file, `.test.tsx` | `VinSearchForm.test.tsx` |
| Boolean | `is`/`has` prefix | `isValidVin` |
| Event handler prop | `on` + noun | `onSearch` |
| Event handler | `handle` + noun | `handleFinish` |

## Screen states

| State | Condition | Renders |
| --- | --- | --- |
| idle | no search yet | form only |
| loading | query pending | `Skeleton` |
| error | request failed | `Alert` type error + the form |
| empty | `documents.length === 0` and COMPLETE | `Empty` |
| partial | `meta.status === 'PARTIAL'` | `DegradedBanner` + list |
| complete | `meta.status === 'COMPLETE'` | list |

The form stays visible in every state so the reviewer can search again.

## Verification

```bash
cd FE && npm run lint && npx tsc -b && npm test && npm run build
```

Then, with the backend and both mocks running, search `1HGCM82633A004352` in
the browser and confirm 6 rows; stop the service mock and confirm the banner.
