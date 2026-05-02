# Threat Model

## Project Overview

XKCD Now is a static browser application that renders an interactive world clock based on xkcd #1335. The production deployment is a Vite-built static site rooted at `artifacts/xkcd-now/`, with `artifacts/xkcd-now/index.html` as the effective application entrypoint and `dist/public/` as the deployed output. The application has no backend, authentication, database, file upload, or third-party API integration, and in production it runs entirely in the user's browser.

## Assets

- **Integrity of the shipped client code and static assets** — `index.html` and `now.png` define all application behavior. Unexpected script injection or asset substitution would directly change what users execute.
- **User browser context** — even though the app does not manage accounts or secrets, any future DOM-based injection in the production page would execute in the origin of the deployed site.
- **Deployment configuration and build output** — because the app is fully static, the main security property is that the build only ships intended files and does not accidentally expose dev-only code or secrets.

## Trust Boundaries

- **Static site origin to browser runtime** — all production logic crosses from immutable deployed files into an untrusted browser environment. Browser inputs such as pointer events and local timezone information must not be treated as trusted content.
- **Production code to local browser APIs** — the app uses DOM APIs, timers, and timezone/date handling. Any HTML injection or unsafe use of browser sinks would cross this boundary and run script in the page.
- **Production vs dev-only code boundary** — `artifacts/xkcd-now/src/**`, attached assets, and local workspace state are present in the repository but are not part of the current deployed entrypoint. Future scans should ignore them unless the build entrypoint changes or production starts importing them.

## Scan Anchors

- **Production entrypoints:** `artifacts/xkcd-now/index.html`, `artifacts/xkcd-now/vite.config.ts`, `dist/public/index.html`
- **Highest-risk code area:** inline script in `artifacts/xkcd-now/index.html` because it contains all runtime logic and any DOM sink usage
- **Public surface:** the entire application is public; there are no authenticated or admin-only surfaces
- **Usually dev-only / out of production scope:** `artifacts/xkcd-now/src/**`, `attached_assets/**`, `.local/**`, Vite dev server settings, and other workspace-only files unless build wiring changes

## Threat Categories

### Tampering

The main tampering risk in this project is modification of the static client bundle or introducing future client logic that trusts unvalidated runtime inputs. Because there is no server-side state, an attacker cannot alter shared application data through the app itself, but changes to shipped JavaScript would immediately affect all users. The project must keep production behavior derived only from local calculations and vetted static assets, and future features must not trust client-provided values as authoritative application state.

### Information Disclosure

There is no database, account data, or server-side secret handling in the current production app, so the primary disclosure risk is accidental exposure of secrets or internal-only code in the static bundle. Production assets must not embed credentials, debug data, stack traces, or links to unpublished resources. Any future browser storage, analytics, or network features would materially expand this category and should trigger a threat model refresh.

### Elevation of Privilege

There are no roles, privileged actions, or authenticated sessions in the current architecture, so traditional authorization flaws do not apply. The relevant privilege concern is DOM-based code execution: if future code places user-controlled content into HTML or script-capable browser APIs, that would let an attacker execute code in the page origin. Production code must avoid user-controlled HTML injection and other script-capable sinks unless strict sanitization is added.
