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

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### xkcd-now (previewPath: `/`)
Pure static HTML5 page — the XKCD "now" world clock with two independently-rotatable rings (time-of-day outer ring, world map inner circle). No React, no framework. Just `index.html` + `public/now.png`.

- **Dev**: Vite serves the static HTML directly
- **Build**: `pnpm --filter @workspace/xkcd-now run build` → `dist/public/` (9 kB, no JS bundles)
- **Deploy**: Static file serving from `dist/public/`
- **Source**: `artifacts/xkcd-now/index.html` + `artifacts/xkcd-now/public/now.png`
