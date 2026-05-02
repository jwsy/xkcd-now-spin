# XKCD World Clock — Interactive App Spec (Offline v2)

> Single-file HTML5 app using a locally downloaded xkcd "Now" comic image, calculating dynamic rotation mathematically to provide a fully offline world clock.

---

## Background / Source Material

The xkcd comic #1335 "Now" is a world clock where the inner image rotates in real time. 
We've discovered two critical details about these images:
1. They are offset by exactly 12 hours from standard UTC time.
2. Because the outer ring is fixed and the inner map simply rotates against it as time passes, we do not need to fetch images every 15 minutes. We can achieve a 100% offline, fully continuous world clock by using just **one** static base image and calculating the rotation manually.

### The Base Image (`now.png`)
We download the image for 12:00 UTC (which is `imgs.xkcd.com/comics/now/00h00m.png` due to the 12-hour offset) and save it locally as `now.png`.
In this specific image:
- The **Outer Ring** is fixed with NOON at the very top (0 degrees).
- The **Inner Map** is aligned such that London (UTC+0) is at the very top (0 degrees), because at 12:00 UTC it is NOON in London.

---

## Architecture: Two-Layer Compositing

Since we can't separate the outer ring from the inner image (it's one PNG), we composite two copies of the same image on top of each other, clipped differently:

| Layer | What it shows | User can drag? |
|---|---|---|
| **Layer A — Outer Ring** | The outermost clock ring (gray/yellow/black bands, NOON/MIDNIGHT labels, hour ticks) | ✅ Yes — drag to rotate |
| **Layer B — Inner Circle** | Everything inside the outer ring: region arcs, world map | ✅ Yes — drag to rotate |

Both layers display the **same local `now.png` image**, but each is clipped to its respective zone.

### Clipping Paths
To cleanly separate the inner text (region labels like "MOSCOW") from the outer text (labels like "NOON" and "MIDNIGHT"), the precise boundary is a radius of **41.8%** of the diameter (which equals 83.6% of the radius).

- **Outer ring (Layer A)**: SVG `clipPath` with `clipPathUnits="objectBoundingBox"` defining an annular shape from a 41.8% radius cutout to the edges.
- **Inner circle (Layer B)**: CSS `clip-path: circle(41.8% at 50% 50%)`.
*(Both layers use `-webkit-clip-path` for maximum compatibility).*

---

## Offline Rotation Strategy

Instead of fetching pre-rotated images from xkcd, we rotate the inner map relative to the outer ring in JavaScript.

### 1. Base UTC Sync Rotation (Inner Map Offset)
To simulate the Earth's rotation, the inner map must be offset based on the current UTC time:
```javascript
const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
baseUtcSyncRotation = (utcHours - 12) * 15; // degrees
```
When we apply `baseUtcSyncRotation` to Layer B, the map perfectly synchronizes with the outer ring to represent the *current* real-world moment.

### 2. View Rotation (User/City Positioning)
By default, we want the user's local timezone (or a selected city) to sit at the top of the clock (0 degrees).
If a selected city's current local time is `cityLocalHour`:
```javascript
currentViewRotation = -(cityLocalHour - 12) * 15; // degrees
```
We apply `currentViewRotation` to **both** the inner map and the outer ring. This rotates the entire synchronized clock so that the desired region moves to the top, and the outer ring correctly shows that region's local time at the top.

### Final Transforms
- Layer A (Outer Ring) rotation = `currentViewRotation`
- Layer B (Inner Map) rotation = `baseUtcSyncRotation + currentViewRotation`

This logic is updated every 60 seconds to keep the inner map naturally turning, just like the real Earth.

---

## User Interaction

### City Dropdown
A dropdown menu allows the user to select major global cities (e.g., Tokyo, London, New York).
When a city is selected:
1. Calculate its local time using `toLocaleString("en-US", {timeZone: tz})`.
2. Update `currentViewRotation` to put that city at the top.
3. Both layers rotate together, maintaining their precise UTC synchronization.

### Dragging (Manual Override)
Users can grab and spin either layer to explore time zones:
- **Hit testing**:
  `dist = sqrt((px - cx)² + (py - cy)²)`
  If `dist > 0.836 * radius` → Drag outer ring (Layer A)
  Else → Drag inner circle (Layer B)
- **Angle calculation**: `atan2(y - cy, x - cx)`
- When dragging the outer ring, `currentViewRotation` updates synchronously so the time display reads the newly rotated outer value.

### Reset Button
Clicking "Reset" clears the city dropdown, recalculates the user's local system time, and restores `currentViewRotation` so the user's home timezone is perfectly back at the top.

---

## Time Display UI
A small readout below the clock dynamically reflects the time pointed to at the very top (0 degrees) of the outer ring.
```javascript
// Because the outer ring's NOON (12:00) is at 0 degrees when unrotated:
let currentShownHours = 12 - (currentViewRotation / 15);
```
This is formatted as `HH:MM` and displayed alongside the live UTC time.
