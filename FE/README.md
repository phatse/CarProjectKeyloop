# CarProject — Frontend

React + TypeScript SPA for the Keyloop technical assessment.

## Stack

| Concern | Choice | Version |
| --- | --- | --- |
| Runtime | Node.js LTS | 24.x (`.nvmrc`) |
| Build tool | Vite | 8.x |
| UI | React | 19.x |
| Language | TypeScript | 7.x |
| Routing | React Router (data router) | 7.x |
| Server state | TanStack Query | 5.x |
| Component library | Ant Design | 6.x |
| HTTP client | Axios | 1.x |
| Forms | React Hook Form + Zod | 7.x / 4.x |
| Unit / component tests | Vitest + Testing Library | 5.x / 16.x |
| Lint + format | Biome | 2.x |

## Requirements

- Node.js 24 LTS (`nvm use`)
- npm 11+

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app runs on <http://localhost:5173>.

### Backend proxy

Requests to `/api/*` are proxied by Vite to `VITE_PROXY_TARGET`
(default `http://localhost:3000`). The frontend therefore always calls
relative paths (`/api/v1/...`) and never hardcodes a backend origin — no CORS
configuration is needed in development, and production can sit behind the same
reverse proxy.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) then build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` / `lint:fix` | Biome check / auto-fix |
| `npm run test` | Run the test suite once |
| `npm run test:coverage` | Run tests with V8 coverage |

## Path aliases

`@/*` maps to `src/*` in both TypeScript and Vite, so imports stay stable:

```ts
import { httpClient } from '@/lib/http'
```

## Directory convention

```
src/
├── app/          # shell: router, providers, routes
├── features/     # feature modules — most code lives here
├── lib/          # preconfigured third-party (http client, query client)
└── test/         # test setup, feature tests, e2e/ (Playwright)
```

`src/components/`, `src/assets/`, `src/config/`, `src/hooks/`, `src/utils/`
and `src/types/` are **not created yet** — they appear only when a second
feature needs the same code.

**Full rules — import direction, "where do I put X", naming — are in
[`src/README.md`](./src/README.md).** Read it before adding a new folder.

Two rules that matter most:

- **No cross-feature imports.** `features/a` never imports `features/b`; compose
  them in `app/` instead.
- **No barrel files.** Import the concrete file, not a folder `index.ts`.

## Testing notes

- Unit and component tests: `npm test` (Vitest, `jsdom`, globals enabled).
  17 tests in 5 files, under `src/test/features/`, mirroring `src/features/`.
- `@testing-library/jest-dom` matchers are registered in `src/test/setup.ts`.
- Browser tests: `npx playwright test`, three specs in `src/test/e2e/`. They
  need the API, both mock systems and the seeded database running, plus
  `npx playwright install chromium` once per machine. Playwright starts the Vite
  dev server itself (`webServer` in `playwright.config.ts`).
- Coverage: `npm run test:coverage`.
