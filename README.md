# Steam GameStatus

[![Install userscript](https://img.shields.io/badge/Install-userscript-66c0f4?style=for-the-badge)](https://raw.githubusercontent.com/NemoKing1210/steam-gamestatus/main/steam-gamestatus.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.2.0-green?style=for-the-badge)](CHANGELOG.md)

A userscript for the Steam store and Steam Community that shows crack and DRM protection status for games using data from [GameStatus.info](https://gamestatus.info).

While browsing Steam, you see compact status badges on game cards and in the game page header — without leaving the store.

Compatible with [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), [Greasemonkey](https://www.greasespot.net/), ScriptCat, and other managers that support the `// ==UserScript==` metadata block.

## Quick install

1. Install a userscript manager (Tampermonkey or Violentmonkey recommended).
2. Click the install link below — your manager should open an installation prompt.

**Install URL:**

```
https://raw.githubusercontent.com/NemoKing1210/steam-gamestatus/main/steam-gamestatus.user.js
```

[![Install](https://img.shields.io/badge/⬇_Install-Steam_GameStatus-1b2838?style=for-the-badge&labelColor=66c0f4)](https://raw.githubusercontent.com/NemoKing1210/steam-gamestatus/main/steam-gamestatus.user.js)

### Install from URL (dashboard)

| Manager | Path |
|---------|------|
| Tampermonkey | Dashboard → **Utilities** → **Install from URL** |
| Violentmonkey | Dashboard → **+** → **Install from URL** |
| Greasemonkey | Add-on menu → **New User Script** → paste the raw URL |

Paste the [install URL](#quick-install) above.

### Manual install

1. Open [`steam-gamestatus.user.js`](steam-gamestatus.user.js) in this repository.
2. Copy the entire file contents.
3. In your userscript manager, create a new script and paste the code.
4. Save and enable the script.

## Updates

The script includes `@updateURL` and `@downloadURL` metadata pointing to the raw GitHub file. Supported managers check for updates automatically (Tampermonkey: Dashboard → check interval; Violentmonkey: similar).

**To release a new version:**

1. Bump `@version` in `steam-gamestatus.user.js` and `steam-gamestatus.meta.js`.
2. Add an entry to [`CHANGELOG.md`](CHANGELOG.md).
3. Push to `main` (or create a GitHub Release).

Managers compare the installed `@version` with the remote metadata to decide whether to offer an update.

## Features

- **Status badges on game cards** — store home, search results, wishlists, sale pages, and other listings with `/app/{id}` links
- **Status badge on game pages** — compact status chip in `.apphub_OtherSiteInfo` next to Community Hub / Store Page links
- **Rich tooltips** — hover a badge to see protection, crack date, release date, scores, hardware requirements, and more
- **Color-coded statuses** — quick visual scan across a long list of games
- **Lazy loading** — badges load only when cards scroll into view
- **Smart caching** — responses are cached locally to reduce API load and speed up repeat visits
- **Steam-like UI** — badges styled like Steam `.app_tag`, tooltips like dark store popovers (`#3D4450`)
- **10 UI languages** — English, Russian, Chinese, Spanish, Portuguese, German, French, Japanese, Korean, Polish (detected from browser locale)

## Supported pages

| Site | URL pattern |
|------|-------------|
| Steam Store | `https://store.steampowered.com/*` |
| Steam Community (app hub) | `https://steamcommunity.com/app/*` |

## Status colors

Each badge has a colored dot that reflects the game’s crack status:

| Color | Status | Meaning |
|-------|--------|---------|
| Green | Cracked | Game has been cracked; `crack_date` is set or status indicates a crack |
| Orange | Not cracked (recent) | Not cracked yet; released less than one month ago |
| Red | Not cracked (long wait) | Not cracked yet; released more than one month ago |
| Orange | Protection bypass | Bypass method (e.g. hypervisor bypass) rather than a traditional crack |
| Blue | Release today | Game releases today; crack status may still be pending |
| Gray | Unknown / Not in database | Status unclear, or game not found on GameStatus.info |
| Blue (spinner) | Loading | Data is being fetched from the API |

Clicking a badge opens the game’s page on GameStatus.info (or the site homepage if the game was not found).

## Tooltip contents

When you hover over a badge, a tooltip may show:

- **Status** — human-readable crack status
- **Protection** — DRM / anti-tamper (e.g. Denuvo, VMProtect)
- **Group** — scene or release group
- **Release** — official release date
- **Crack** — crack release date
- **Steam ID** — Steam application ID
- **Score** — user rating on GameStatus.info
- **Metacritic** — Metacritic score (if available)
- **Type** — AAA flag
- **Subscriptions** — subscriber count
- **Hardware** — minimum/recommended CPU, RAM, GPU, OS
- **Description** — short game description
- **Links** — API endpoint, GameStatus page, torrent link (when available)

If a game is not in the database, the tooltip lists the API URLs that were tried during lookup.

## How it works

```
Steam page loads
       │
       ▼
Scan DOM for links matching /app/{appId}/
       │
       ├── Game page? ──► Insert loader badge in `.apphub_OtherSiteInfo`
       │
       └── Listing page? ──► Find card containers, insert loader badges
                │
                ▼
       IntersectionObserver (cards near viewport only)
                │
                ▼
       Resolve game slug from URL, title, alt text, canonical link
                │
                ▼
       Check local cache (GM_getValue)
                │
       cache miss ──► GET gamestatus.info/back/api/gameinfo/game/{slug}/
                │         (up to 2 concurrent requests, slug fallback chain)
                ▼
       Match response by steam_prod_id, cache result
                │
                ▼
       Replace loader with colored badge + bind tooltip
```

### Game lookup

The script does not call the API by Steam App ID directly. It builds one or more URL slugs from:

- The `/app/{id}/{slug}` segment in the link
- The game title from card DOM or page heading
- Canonical / Open Graph URLs on game pages

Each slug is tried in order until a matching record is found (`steam_prod_id` equals the Steam App ID). Invalid slugs (CDN hostnames, numeric-only segments, etc.) are filtered out.

### Caching

Results are stored in Tampermonkey/Violentmonkey storage (`gs_steam_cache_v3`):

| Result | TTL |
|--------|-----|
| Game found | 6 hours |
| Game not found (negative cache) | 24 hours |

Duplicate in-flight requests for the same App ID are deduplicated.

### Dynamic content

Steam loads many lists via AJAX (infinite scroll, tab switches). A filtered `MutationObserver` watches for new game cards and schedules an incremental debounced re-scan (`SCAN_DEBOUNCE_MS`). Hydration pauses during active scrolling and resumes in small batches when scrolling stops.

## Repository layout

```text
steam-gamestatus/
├── steam-gamestatus.user.js   # Installable userscript (canonical distribution file)
├── steam-gamestatus.meta.js   # Metadata-only companion for faster update checks
├── README.md                  # Documentation and install instructions
├── CHANGELOG.md               # Version history
├── LICENSE                    # MIT license
└── .gitattributes             # GitHub linguist overrides
```

| File | Purpose |
|------|---------|
| `steam-gamestatus.user.js` | Full script served at `@downloadURL` / `@updateURL` |
| `steam-gamestatus.meta.js` | Lightweight metadata mirror; managers may fetch it instead of the full script when checking for updates |

## Script metadata

Key `// ==UserScript==` fields used by managers:

| Field | Value |
|-------|-------|
| `@namespace` | `https://github.com/NemoKing1210/steam-gamestatus` |
| `@version` | Semantic version (must be bumped on every release) |
| `@updateURL` / `@downloadURL` | Raw GitHub URL of `steam-gamestatus.user.js` |
| `@homepageURL` | This repository |
| `@supportURL` | GitHub Issues |
| `@license` | MIT |
| `@grant` | `GM_xmlhttpRequest`, `GM_getValue`, `GM_setValue`, `GM_addStyle` |
| `@connect` | `gamestatus.info`, `cdn.gamestatus.info` |

Localized `@name` and `@description` tags are provided for en, ru, zh-CN, es, pt-BR, de, fr, ja, ko, and pl.

## Required permissions

| Grant | Purpose |
|-------|---------|
| `GM_xmlhttpRequest` | Fetch game data from GameStatus.info (bypasses CORS) |
| `GM_getValue` / `GM_setValue` | Persist response cache between sessions |
| `GM_addStyle` | Inject badge and tooltip styles |

`@connect` is limited to `gamestatus.info` and `cdn.gamestatus.info`.

## Development

### Local workflow (Violentmonkey)

1. Clone this repository.
2. In Violentmonkey, install from the local `steam-gamestatus.user.js` file.
3. Enable **Track local file** before closing the install dialog.
4. Edit the file in your IDE — changes apply after a page reload.

### Local workflow (Tampermonkey)

Tampermonkey does not track local files natively. Options:

- Reinstall from URL after each change, or
- Use a local HTTP server and temporarily point `@updateURL` / `@downloadURL` to `http://localhost:...` during development (do not commit local URLs).

### Configuration

Constants near the top of `steam-gamestatus.user.js` can be adjusted:

| Constant | Default | Description |
|----------|---------|-------------|
| `MAX_CONCURRENT` | 2 | Parallel API requests |
| `REQUEST_DELAY_MS` | 75 ms | Delay between starting queued API tasks |
| `MAX_SLUG_ATTEMPTS` | 2 | Slug candidates tried per game lookup |
| `CACHE_TTL_MS` | 6 hours | Cache lifetime for found games |
| `NEGATIVE_CACHE_TTL_MS` | 24 hours | Cache lifetime for “not found” results |
| `CACHE_PERSIST_MS` | 1000 ms | Debounce interval for writing cache to storage |
| `CARD_ROOT_MARGIN` | `80px 0px` | How far ahead of the viewport to prefetch cards |
| `SCAN_DEBOUNCE_MS` | 450 ms | Debounce for DOM mutation rescans |
| `SCROLL_IDLE_MS` | 150 ms | Wait after scroll stops before hydrating cards |
| `HYDRATE_BATCH_SIZE` | 3 | Cards hydrated per animation frame |

API responses use the browser’s `Accept-Language` header (fallback `en-US`). Dates are formatted with `navigator.language`.

## Data source

All game data comes from the public GameStatus.info API:

```
GET https://gamestatus.info/back/api/gameinfo/game/{slug}/
```

This project is **not affiliated** with Valve, Steam, or GameStatus.info. Status information is community-maintained and may be incomplete or outdated. Use it as a reference, not as a guarantee.

## License

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
