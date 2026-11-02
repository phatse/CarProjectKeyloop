# `src/` structure

Feature-based layout, adapted from
[bulletproof-react](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md).
The goal is one rule: **code that changes together lives together.**

```
src/
├── app/                    # application shell
│   └── routes/             # one file per route/page (composition only)
├── assets/                 # static files imported by the bundler
├── components/             # shared, feature-agnostic UI
│   ├── ui/                 # primitives: buttons, inputs, empty states
│   └── layouts/            # page shells: header, sidebar, content area
├── config/                 # env parsing (Zod) and app-wide constants
├── features/               # feature modules — where most code lives
│   └── documents/          # Scenario D: VIN search + aggregated documents
│       ├── api/            # request functions + query/mutation hooks
│       ├── components/     # components used only by this feature
│       ├── hooks/          # hooks used only by this feature
│       ├── types/          # types used only by this feature
│       └── utils/          # pure helpers used only by this feature
├── lib/                    # third-party libs preconfigured (http, query client)
└── test/                   # mirrors src/: one folder per feature under test
    ├── setup.ts
    ├── features/documents/ # tests for src/features/documents
    ├── mocks/
    └── utils/
```

## Import direction (enforced by review)

```
shared (components, lib, config, test)
        ↑
    features
        ↑
       app
```

- `app/` may import from `features/` and shared.
- `features/` may import from shared **only** — never from another feature.
- Shared may import from nothing above it.

If two features need the same thing, promote it to shared. If a feature needs
something from another feature, compose them in `app/` instead.

## Shared folders are created on demand

There is **no** `src/hooks/`, `src/utils/`, or `src/types/` yet. That is
deliberate: with a single feature, anything placed there has exactly one
consumer, and shared code with one consumer is just code in the wrong folder.

When a second feature needs the same helper, create the folder and move the
file. Not before.

## Hard rules

1. **No barrel files.** No `index.ts` that re-exports a folder. Import the file
   directly: `import { DocumentList } from '@/features/documents/components/document-list'`.
   Barrel files break tree-shaking and slow down Vite
   ([Vercel: optimizing package imports](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js)).
   Exception: `lib/` may expose a single configured instance (`lib/http.ts`).
2. **No cross-feature imports.** `features/a` never imports `features/b`.
3. **No global state for server data.** Server state lives in TanStack Query.
   There is intentionally no `stores/` folder — adding one invites duplicating
   query data into a client store.
4. **Business rules do not live in components.** A component renders and calls a
   hook; the rule lives in `utils/` or in the API layer.
5. **Tests live under `src/test/`, mirroring `src/`.** A test for
   `features/documents/components/DocumentList.tsx` is
   `test/features/documents/components/DocumentList.test.tsx`. Take the source
   path and swap `src/` for `src/test/`. `test/setup.ts` and `test/utils/` hold
   cross-cutting helpers only.
6. **Style through antd, not custom CSS.** Layout and colour come from antd
   component props and `ConfigProvider` tokens. No feature CSS files: a
   hand-written stylesheet drifts from the theme and is invisible to antd's
   design tokens.

## Where do I put …?

| I'm writing… | It goes in |
| --- | --- |
| A page/route | `app/routes/` |
| Router config, providers | `app/` |
| A button, input, empty state | `components/ui/` |
| A header/sidebar used by every page | `components/layouts/` |
| Fetch/mutate for one feature | `features/<x>/api/` |
| A component used by one feature only | `features/<x>/components/` |
| Env var parsing | `config/` |
| Axios instance, QueryClient | `lib/` |
| `formatDate`, `normalizeVin` | `features/<x>/utils/`; promote to `src/utils/` on the 2nd consumer |
| A type used in 2+ features | `src/types/` — create it when the 2nd feature appears |
| MSW handlers, custom `render()` | `test/mocks/`, `test/utils/` |

## Naming

| Kind | Convention | Example |
| --- | --- | --- |
| Component file | PascalCase, matches the export | `DocumentList.tsx` |
| Component export | function declaration, PascalCase | `export function DocumentList()` |
| Hook file | `use` + camelCase | `useVehicleDocuments.ts` |
| Non-component module | kebab-case | `get-documents.ts` |
| Type | PascalCase, `type` only | `type DocumentSource = 'SALES' \| 'SERVICE'` |
| Test | under `src/test/`, mirroring the source path | `src/test/features/documents/components/DocumentList.test.tsx` |

Per project rules, use `type` — never `interface`.
