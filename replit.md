# XKCD Now — Rotatable World Clock

A pure static HTML5 web app based on [xkcd #1335 "Now"](https://xkcd.com/now/) by Randall Munroe.

## What it does

Displays the xkcd world clock with two independently draggable rings:
- **Outer ring** — time of day (NOON/MIDNIGHT/6AM/6PM)
- **Inner circle** — world map synced to UTC
- **City picker** — jump to any timezone
- **Reset / double-click** — snap back to local time

## Structure

```
artifacts/xkcd-now/
  index.html          # The entire app — pure HTML/CSS/JS
  public/now.png      # The xkcd clock image
  vite.config.ts      # Minimal Vite config (dev server + static build)
  package.json        # Only vite + @types/node
dist/public/          # Production build output (served by deployment)
```

## Commands

- **Dev**: workflow `artifacts/xkcd-now: web` runs `pnpm --filter @workspace/xkcd-now run dev`
- **Build**: `pnpm --filter @workspace/xkcd-now run build` → outputs to `dist/public/`
- **Deploy**: static file serving from `dist/public/` (configured in `.replit` and `artifact.toml`)
