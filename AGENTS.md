# AGENTS.md — Steam GameStatus

Instructions for AI coding agents working in this repository.

## Project

Userscript that adds GameStatus.info badges and tooltips on Steam Store and Steam Community app pages. Compatible with Tampermonkey, Violentmonkey, Greasemonkey, and similar managers.

- **Canonical script:** `steam-gamestatus.user.js` (also `@downloadURL` / `@updateURL`)
- **Metadata companion:** `steam-gamestatus.meta.js` (must stay in sync with the userscript header)
- **Docs:** `README.md`, `CHANGELOG.md` (Keep a Changelog + SemVer)
- **License:** MIT

No build step, bundler, tests, or package manager. Edit the `.user.js` file directly.

## Repository layout

```text
steam-gamestatus/
├── steam-gamestatus.user.js   # Full installable userscript
├── steam-gamestatus.meta.js   # Metadata-only mirror for update checks
├── README.md
├── CHANGELOG.md
├── LICENSE
├── AGENTS.md                  # This file (cross-tool agent instructions)
└── CLAUDE.md                  # Claude Code entry → imports AGENTS.md
```

## Architecture (high level)

1. Scan DOM for `/app/{appId}/` links (listings) or inject on game pages (`.apphub_OtherSiteInfo`).
2. Lazy-load via `IntersectionObserver`; re-scan dynamic Steam content with a filtered `MutationObserver`.
3. Resolve GameStatus slugs from URL segments, titles, and canonical/OG URLs — **not** by Steam App ID alone. When the DOM has no slug/title (e.g. Personal Calendar `/app/{id}?…`), fetch the Steam Store `appdetails` name and slugify it.
4. Fetch `GET https://gamestatus.info/back/api/gameinfo/game/{slug}/` via `GM_xmlhttpRequest`; match `steam_prod_id`.
5. Cache in `GM_getValue` / `GM_setValue` (`gs_steam_cache_v5`); TTL from settings (`gs_steam_settings`).
6. Render Steam-like badges + dark Steam-style popovers (chips, colored scores, cover); UI strings from `TRANSLATIONS` / browser locale.
7. Settings button in `#global_actions` (Steam header) + `GM_registerMenuCommand` — badge position, badge size, show missing, cache hours, clear cache.

Keep rate limits polite: `MAX_CONCURRENT`, `REQUEST_DELAY_MS`, slug attempt caps, scroll-idle hydration batches.

## Conventions

- Single IIFE with `'use strict'`; vanilla JS only (no frameworks).
- Prefer existing patterns: constants at top, locale maps, DOM helpers, cache, API queue, badge/tooltip UI.
- Match Steam UI where possible (`.app_tag`-like badges, `#3D4450` tooltips).
- Do not expand `@connect` or `@grant` beyond what is needed.
- Do not commit localhost `@updateURL` / `@downloadURL` values.
- Keep `steam-gamestatus.meta.js` identical to the `==UserScript==` block in the `.user.js` file (same fields/order/values).

## Releases

When shipping a user-visible change:

1. Bump `@version` in **both** `steam-gamestatus.user.js` and `steam-gamestatus.meta.js`.
2. Add a Keep a Changelog entry in `CHANGELOG.md`.
3. Update README version badge / docs if they mention the version or new behavior.

## Localization

UI locales: `en`, `ru`, `zh`, `es`, `pt`, `de`, `fr`, `ja`, `ko`, `pl`.

- Add every new user-facing string to **all** `TRANSLATIONS` locales.
- Keep localized `@name` / `@description` metadata tags aligned when changing the product description.

## Do not

- Add a build toolchain, TypeScript, or npm unless explicitly requested.
- Call the GameStatus API by App ID only (slug resolution + `steam_prod_id` match is required).
- Break carousel / multi-app capsule logic (wrong App ID or stacked badges).
- Imply affiliation with Valve, Steam, or GameStatus.info in docs or UI copy.

## Local testing

- **Violentmonkey:** install local file + enable Track local file; reload Steam after edits.
- **Tampermonkey:** reinstall from file/URL, or temporary local server URLs (do not commit them).
