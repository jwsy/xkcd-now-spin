# XKCD World Clock — Interactive App Spec (v2)
> Single-file HTML5 app using the actual xkcd "Now" comic imagery

---

## Background / Source Material

The xkcd comic #1335 "Now" is a world clock where the inner image rotates in real time.
Randall Munster hosts pre-rendered images at a predictable URL pattern:

```
https://imgs.xkcd.com/comics/now/{H}h{MM}m.png
```

Where `{H}` is the UTC hour (no leading zero) and `{MM}` is `00`, `15`, `30`, or `45`
(images are generated at 15-minute increments).

Examples:
- `https://imgs.xkcd.com/comics/now/0h00m.png`  → midnight UTC
- `https://imgs.xkcd.com/comics/now/18h30m.png` → 18:30 UTC
- `https://imgs.xkcd.com/comics/now/9h15m.png`  → 09:15 UTC

Each image is a full PNG of the complete graphic — both the outer ring AND the inner
regions/map — rendered as one flat image at that rotation state.

---

## Architecture: Two-Layer Compositing

Since we can't separate the outer ring from the inner image (it's one PNG), we
**composite two copies of the same image** on top of each other, clipped differently:

| Layer | What it shows | User can drag? |
|---|---|---|
| **Layer A — Outer Ring** | The outermost clock ring (gray/yellow/black bands, NOON/MIDNIGHT labels, hour ticks) | ✅ Yes — drag to rotate |
| **Layer B — Inner Circle** | Everything inside the outer ring: region arcs, world map | ✅ Yes — drag to rotate |

Both layers display the **same PNG** (or a computed variant), but each is clipped to
its respective zone using SVG `clipPath` elements:

- Layer A clip: annular region from ~88% radius to 100% radius (outer ring only)
- Layer B clip: circular region from 0 to ~88% radius (inner circle only)

The two layers are positioned in the same spot. Together they look like one seamless image.

---

## Image Source Strategy

### On Load
1. Get current UTC time.
2. Round down to the nearest 15-minute mark: `floor(minutes / 15) * 15` → `00 | 15 | 30 | 45`
3. Construct the URL: `https://imgs.xkcd.com/comics/now/{H}h{MM}m.png`
4. Load this image into both Layer A and Layer B (same `<img>` source or same SVG `<image>` href).

### Image Dimensions
The xkcd PNG is square. Determine its exact pixel size by loading it and reading
`naturalWidth` / `naturalHeight`. Use this to compute the exact center point and
radius for clipping. The outer ring occupies the outermost ~12% of the image radius.

### CORS Note
`imgs.xkcd.com` allows hotlinking. Load the image directly via `<img>` tags or SVG
`<image>` elements. If CORS issues arise with canvas operations, use CSS transforms
on `<img>` elements instead — no canvas required.

---

## On Load Behavior

### Outer Ring (Layer A) — Represents Local Time
The outer ring's NOON marker should point to the current **local time**.

The image is pre-rendered with NOON at top = a specific UTC moment. The ring must be
rotated so the tick matching local time is at the top.

**Calculation:**
```
utcOffsetHours = -(new Date().getTimezoneOffset() / 60)  // e.g. +9 for Korea
localHour      = new Date().getHours() + new Date().getMinutes() / 60

// The image's NOON position already represents 12:00 local time in the pre-rendered state.
// We want local current time to appear at the NOON (top) position.
// How far past noon is our local time?
hoursPastNoon  = localHour - 12   // e.g. 3:00 PM → +3, 9:00 AM → -3

// Each hour = 360/24 = 15 degrees
outerRingRotation = hoursPastNoon * 15  // degrees clockwise
```

Apply `outerRingRotation` as a CSS `rotate()` transform on Layer A around the image center.

### Inner Circle (Layer B) — Represents UTC / Real World Alignment
The inner image from xkcd is ALREADY correctly rotated for the current UTC time
(that's the whole point of the URL-based time encoding). So on load:

**Inner circle rotation = 0** (no additional rotation needed).

The two layers together show: outer ring rotated to local time, inner map correctly
showing UTC-based world regions. The user can then see their local time in the outer
ring aligning with the world regions that share that time zone.

---

## User Interaction

### Drag Outer Ring (Layer A)
- `pointerdown` on the outer annular region → begin drag
- Track angle delta from drag start: `atan2(y - cy, x - cx)`
- Apply delta as CSS `rotate()` transform to Layer A only
- Layer B does not move
- On release: update internal `outerRotationDeg` state variable

### Drag Inner Circle (Layer B)
- `pointerdown` on the inner circle region → begin drag
- Same angle-delta tracking
- Apply delta as CSS `rotate()` transform to Layer B only
- Layer A does not move
- On release: update internal `innerRotationDeg` state variable

### Hit Testing (which layer gets the drag)
Since the layers are stacked, use the pointer's distance from center to determine
which layer receives the drag:
```
dist = sqrt((px - cx)² + (py - cy)²)
if dist > 0.88 * radius  → drag outer ring (Layer A)
else                      → drag inner circle (Layer B)
```

### Reset Button
Small button below the clock. Clicking it:
1. Resets `outerRotationDeg` and `innerRotationDeg` to their on-load values
2. Applies CSS transitions (`transition: transform 0.5s ease`) for a smooth snap-back

### Double-Click
Double-clicking anywhere on the clock also resets to on-load state.

---

## Visual / Layout

### Container
```html
<div id="clock-container">
  <div id="layer-outer">  <!-- Layer A -->
    <img id="img-outer" src="..." />
  </div>
  <div id="layer-inner">  <!-- Layer B -->
    <img id="img-inner" src="..." />
  </div>
</div>
```

Both layers are `position: absolute` with `top: 0; left: 0`.

Clipping is done with CSS `clip-path`:
- Outer ring layer: `clip-path: path('...')` — annular shape (outer circle minus inner circle)
  - Use inline SVG `clipPath` referenced via `clip-path: url(#clip-outer)`
- Inner circle layer: `clip-path: circle(88% at center)` (CSS clip-path circle)

### Responsive Sizing
- Container is `min(90vw, 90vh)` square
- Both image elements fill the container: `width: 100%; height: 100%`
- Transform origin: `50% 50%` (image center)

### Cursor
- `grab` cursor when hovering over a draggable region
- `grabbing` cursor while dragging

---

## Time Display (Optional UI)
A small readout below the clock showing:
- "Local time shown: HH:MM" (derived from outer ring rotation + on-load reference time)
- "UTC: HH:MM" (live, updated every minute)

---

## File Structure

Single file: `index.html`

```
<html>
  <head>
    <style> /* all CSS inline */ </style>
  </head>
  <body>
    <div id="clock-container">
      <svg id="clip-defs" style="position:absolute;width:0;height:0">
        <defs>
          <clipPath id="clip-outer" clipPathUnits="objectBoundingBox">
            <!-- annular ring path: outer circle minus inner hole -->
          </clipPath>
        </defs>
      </svg>
      <div id="layer-outer"><img id="img-outer" /></div>
      <div id="layer-inner"><img id="img-inner" /></div>
    </div>
    <div id="controls">
      <button id="reset">↺ Reset</button>
      <span id="time-display"></span>
    </div>
    <script> /* all JS inline */ </script>
  </body>
</html>
```

---

## Key Implementation Notes for Claude Code

1. **Annular clip path** — SVG `clipPath` with `clipPathUnits="objectBoundingBox"` lets you
   define the path in 0–1 normalized coordinates, making it resolution-independent.
   The annular shape is: large circle (r=0.5, center 0.5,0.5) minus small circle (r=0.44).
   Use an SVG path with two arcs and `fill-rule: evenodd`.

2. **Rotation transform origin** — Both layers must rotate around the exact image center.
   Use `transform-origin: 50% 50%` in CSS and `transform: rotate(Xdeg)`.

3. **Angle calculation during drag**:
   ```js
   function getAngle(e, cx, cy) {
     const rect = container.getBoundingClientRect();
     return Math.atan2(e.clientY - rect.top - cy, e.clientX - rect.left - cx) * 180 / Math.PI;
   }
   // On pointerdown: startAngle = getAngle(e) - currentRotation
   // On pointermove: newRotation = getAngle(e) - startAngle
   ```

4. **Image URL construction**:
   ```js
   function getNowImageUrl() {
     const now = new Date();
     const utcH = now.getUTCHours();
     const utcM = Math.floor(now.getUTCMinutes() / 15) * 15;
     return `https://imgs.xkcd.com/comics/now/${utcH}h${String(utcM).padStart(2,'0')}m.png`;
   }
   ```

5. **Outer ring rotation on load**:
   ```js
   function getInitialOuterRotation() {
     const now = new Date();
     const localHour = now.getHours() + now.getMinutes() / 60;
     const hoursPastNoon = localHour - 12;
     return hoursPastNoon * (360 / 24);  // degrees
   }
   ```

6. **The xkcd image's "zero rotation" state**: The image at any given URL already shows
   the inner circle correctly positioned for that UTC time. The outer ring in the image
   always has NOON at top = the image's natural orientation. So outer ring rotation is
   purely a function of local time offset from noon, independent of UTC.

---

## Behavior Summary Table

| Scenario | Outer Ring | Inner Circle |
|---|---|---|
| On load, user in UTC+9 (Korea), time is 21:00 local | Rotated +135° (9 hrs past noon × 15°/hr) | 0° (image is pre-rotated by xkcd server) |
| User drags outer ring | Rotates freely | Stays put |
| User drags inner circle | Stays put | Rotates freely |
| User clicks Reset | Snaps back to on-load rotation | Snaps back to 0° |

---

## Out of Scope (v1)

- Live auto-updating as time passes (would require re-fetching image every 15 min)
- Tooltip showing region local times
- Touch-specific momentum/fling physics (pointer events handle touch, no fling needed)
