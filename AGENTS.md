# AGENTS.md

## Project

This is a static HTML5 implementation of xkcd #1335, "Now". The app is intentionally minimal and should stay that way: one HTML file, one PNG, and a tiny Vite setup.

## What exists

- `artifacts/xkcd-now/index.html` — the entire app
- `artifacts/xkcd-now/public/now.png` — local base image
- `artifacts/xkcd-now/vite.config.ts` — dev server and static build config
- `dist/public/` — production build output

## Current structure rules

- Keep the repo static-first.
- Do not reintroduce databases, API servers, OpenAPI specs, Zod schemas, or shared backend libs.
- Avoid adding React, Tailwind, or other framework scaffolding unless explicitly requested.
- Prefer editing the existing single-file app over splitting it into components.

## App behavior

- The clock uses two clipped layers of the same image:
  - outer ring
  - inner map
- Rotation is calculated in JavaScript from UTC and the selected city.
- The app must remain fully offline after load.
- City dropdown includes flag emojis and timezone-based jumps.
- Dragging either ring should continue to work.
- Reset returns to local system time.

## Build and deploy

- Dev server: `pnpm --filter @workspace/xkcd-now run dev`
- Production build: `pnpm run build`
- Build output must stay in `dist/public/`
- Vite must keep using `PORT` and `BASE_PATH`

## Repository cleanup guidance

If more cleanup is needed, remove only unused static-scaffold leftovers. Do not add replacement infrastructure.

## Agent behavior

- Make small, direct edits.
- Preserve the current static deployment setup.
- If a request would require workflow, deployment, or major architecture changes, stop and ask for a larger-mode build instead.
- Keep documentation consistent with the actual repo state.
