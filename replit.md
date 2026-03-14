# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── tax-tracker/        # Where My Tax Goes - React/Vite frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Where My Tax Goes App

### Purpose
An interactive web app that lets users estimate how their personal taxes are distributed across government spending categories.

### Pages
1. **Landing** (`/`) - Hero section with animated chart and feature cards
2. **Calculator** (`/calculator`) - Income input with progressive tax brackets, spending breakdown
3. **Breakdown** (`/breakdown`) - Full government budget distribution chart
4. **Simulator** (`/simulator`) - Interactive sliders to adjust budget allocations
5. **Share** (`/share`) - Downloadable/shareable result card via html2canvas

### Key Features
- Dark mode dashboard design with soft gradients
- Animated Chart.js doughnut charts (react-chartjs-2)
- Real API integration: POST /api/calculate-tax, GET /api/get-budget-data
- Progressive tax bracket calculation
- Budget simulator with live chart updates
- Shareable image export via html2canvas
- Framer Motion page transitions

### Budget Categories (budgetData.json)
- Healthcare (36%) - #10B981 green
- Welfare (18%) - #8B5CF6 purple
- Education (15%) - #3B82F6 blue
- Defence (10%) - #EF4444 red
- Infrastructure (9%) - #F97316 orange
- Admin (6%) - #6B7280 gray
- Other (6%) - #F59E0B yellow

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers
  - `src/routes/health.ts` — `GET /api/healthz`
  - `src/routes/tax.ts` — `POST /api/calculate-tax`, `GET /api/get-budget-data`
- Data: `src/data/budgetData.json` — government spending allocations
- Depends on: `@workspace/db`, `@workspace/api-zod`

### `artifacts/tax-tracker` (`@workspace/tax-tracker`)

React + Vite frontend for "Where My Tax Goes".

- Entry: `src/main.tsx`
- Pages: `src/pages/` — Home, Calculator, Breakdown, Simulator, Share
- Components: `src/components/` — Navbar, TaxDoughnut, CategoryCard, PageTransition
- Hooks: `src/hooks/use-tax-store.tsx` — global state for tax results
- Dependencies: chart.js, react-chartjs-2, framer-motion, html2canvas, tailwind-merge, clsx

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec in `openapi.yaml`. Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas: `HealthCheckResponse`, `CalculateTaxBody`, `CalculateTaxResponse`, `GetBudgetDataResponse`, `SpendingCategoryResponse`, `BudgetDataResponse`

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks: `useCalculateTax`, `useGetBudgetData`, `useHealthCheck`
