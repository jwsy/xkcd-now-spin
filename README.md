# xkcd now dynamic World Clock 🌀🕰️

### 🖇️ <https://jwsy.github.io/xkcd-now-spin> or 🔗 <https://xkcd-now-spin.replit.app/>

An interactive world clock based on [xkcd #1335 "Now"](https://xkcd.com/now/) by Randall Munroe. Runs entirely offline in the browser — no network requests, no frameworks, no databases. Just one HTML file and one PNG. Inspired by [@Mixolyde](https://github.com/Mixolyde)!!

Referenced by this Medium article: <https://itnext.io/howto-build-a-dynamic-xkcd-now-clock-that-spins-with-claude-antigravity-and-replit-ca4f5d7206f3>

<img width="240" height="222" alt="xkcd-now-240w" src="https://github.com/user-attachments/assets/6fdbbeb5-b829-46c0-9255-60ea5b1c855a" />

---

## How it works

The xkcd "Now" comic is a clock where the inner world map rotates in real time against a fixed outer ring. Rather than fetching a new image every 15 minutes (as xkcd does), this app uses a single static base image and calculates the correct rotation mathematically in JavaScript.

**Key insight:** The base image `now.png` is the 12:00 UTC frame (`00h00m.png` from xkcd, which is offset by 12 hours). In this frame, NOON is at the top of the outer ring, and London (UTC+0) is at the top of the inner map — perfectly aligned. From that known starting position, every other moment in time is just a rotation.

### Two-layer compositing

Because the xkcd image is a single PNG (outer ring and inner map are not separate files), the app renders **two copies** of the same image clipped to different regions:

| Layer | What it shows | Draggable? |
|---|---|---|
| **Outer ring** | NOON/MIDNIGHT labels, hour ticks, the gray/yellow/black bands | Yes |
| **Inner circle** | World map, region arcs, city labels | Yes |

The boundary between layers is a radius of **41.8%** of the image diameter — the precise point where the outer ring text (NOON, MIDNIGHT) meets the inner region labels (MOSCOW, etc.). The outer ring uses an SVG `clipPath` annular cutout; the inner circle uses `clip-path: circle(41.8%)`.

### Rotation math

Two rotations are composed at all times:

```
Outer ring rotation  = currentViewRotation
Inner map rotation   = baseUtcSyncRotation + currentViewRotation
```

**`baseUtcSyncRotation`** keeps the map synchronized to Earth's actual rotation:
```javascript
const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
baseUtcSyncRotation = (utcHours - 12) * 15; // degrees
```

**`currentViewRotation`** positions a chosen city or timezone at the top of the clock:
```javascript
currentViewRotation = -(cityLocalHour - 12) * 15; // degrees
```

Applying `currentViewRotation` to both layers together rotates the entire synchronized clock so the chosen city sits at the top, while the outer ring continues to correctly show that city's local time.

The map updates every 60 seconds to reflect Earth's real rotation.

---

## Features

- **City picker** with flag emojis — jump to any major timezone (Tokyo, Seoul, Sydney, Dubai, Kyiv, Jerusalem, Lagos, London, Reykjavik, New York, Chicago, Mexico City, Los Angeles, and more)
- **Drag either ring** independently — grab the outer ring or the inner map and spin them by hand
- **Hit testing** determines which layer you're dragging: outside 83.6% of the radius → outer ring; inside → inner map
- **Time readout** below the clock shows the time currently pointed at the top of the outer ring alongside live UTC
- **Reset button** snaps everything back to your local system timezone
- **Double-click** anywhere on the clock also resets to local time
- **Fully offline** — no external requests after the initial page load

---

## Project structure

```
artifacts/xkcd-now/
  index.html          # The entire app — all HTML, CSS, and JS in one file
  public/now.png      # The base xkcd clock image (12:00 UTC frame)
  vite.config.ts      # Minimal Vite config (dev server + static build)
  package.json        # Two dev dependencies: vite and @types/node

dist/public/          # Production build output (served by deployment)
pnpm-workspace.yaml   # Workspace config (single artifact)
package.json          # Root build script
```

No React. No Tailwind. No database. No API server. The entire application is the `index.html` — 298 lines including styles and logic.

---

## Development

```bash
# Install dependencies
pnpm install

# Start dev server (auto-reloads on save)
pnpm --filter @workspace/xkcd-now run dev

# Build for production
pnpm run build
# → outputs to dist/public/
```

The app is deployed as a static site. The build output (`dist/public/`) is served directly with no server-side logic.

---

## Credits

- Original comic and concept: [Randall Munroe — xkcd #1335](https://xkcd.com/1335/)
- Image source: `imgs.xkcd.com/comics/now/00h00m.png` (used under [xkcd's license](https://xkcd.com/license.html))
