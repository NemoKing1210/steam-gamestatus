# Architecture

How Steam GameStatus works under the hood. User-facing docs live in
[README.md](../README.md); contributor workflow in
[../CONTRIBUTING.md](../CONTRIBUTING.md); agent instructions in
[../AGENTS.md](../AGENTS.md).

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

The script does not call the GameStatus API by Steam App ID directly. It builds
one or more URL slugs from:

- The `/app/{id}/{slug}` segment in the link
- The game title from card DOM or page heading
- Canonical / Open Graph URLs on game pages
- If none of the above yield a slug (e.g. Personal Calendar capsules with
  `/app/{id}?…` only), the Steam Store `appdetails` name is fetched and
  slugified

Each slug is tried in order until a matching record is found (`steam_prod_id`
equals the Steam App ID). Invalid slugs (CDN hostnames, numeric-only segments,
etc.) are filtered out. See `src/api/gamestatus.js` (`resolveGame()`) and
`src/utils/steam-dom.js` (`buildSlugCandidates()`).

### Caching

Results are stored in Tampermonkey/Violentmonkey storage (`gs_steam_cache_v5`).
TTL is configurable in the settings panel (default **6 hours** for both found
and not-found results; `0` disables caching). Use **Clear cache** in settings
to drop all stored lookups.

Duplicate in-flight requests for the same App ID are deduplicated. See
`src/core/cache.js` and `src/core/queue.js`.

### Dynamic content

Steam loads many lists via AJAX (infinite scroll, tab switches). A filtered
`MutationObserver` watches for new game cards and schedules an incremental
debounced re-scan (`SCAN_DEBOUNCE_MS`). Hydration pauses during active
scrolling and resumes in small batches when scrolling stops. See
`src/main.js` and `src/features/cards/`.

## Repository layout

```text
steam-gamestatus/
├── src/                     # Sources (entry: src/main.js)
│   ├── core/                # Constants, settings, cache, request queue
│   ├── api/                 # GameStatus API + Steam appdetails fallback
│   ├── features/            # Cards, game page, badges/tooltips, settings
│   ├── i18n/locales/        # UI strings (one file per locale)
│   ├── styles/              # Injected CSS (app.css) and tokens
│   └── utils/               # Slug, Steam DOM, formatting, HTML helpers
├── docs/                    # Architecture, development guides
├── scripts/                 # Artifact copy/verify helpers
├── dist/                    # Build output (gitignored; copied to root)
├── steam-gamestatus.user.js   # Generated installable userscript (do not hand-edit)
├── steam-gamestatus.meta.js   # Generated metadata companion (do not hand-edit)
├── package.json             # Version source of truth
├── vite.config.js           # Build + userscript metadata
├── README.md                # User documentation and install instructions
├── CHANGELOG.md             # Version history
├── LICENSE                  # MIT license
└── .gitattributes             # GitHub linguist overrides
```

| File | Purpose |
|------|---------|
| `src/` | Sources; `src/main.js` is the userscript entry point |
| `steam-gamestatus.user.js` | Generated bundle served at `@downloadURL` / `@updateURL` |
| `steam-gamestatus.meta.js` | Generated metadata mirror; managers may fetch it instead of the full script when checking for updates |
| `package.json` | Version source of truth; `npm run build` regenerates the root artifacts |

## Script metadata

Key `// ==UserScript==` fields used by managers (declared in `vite.config.js`,
version generated from `package.json`):

| Field | Value |
|-------|-------|
| `@namespace` | `https://github.com/NemoKing1210/steam-gamestatus` |
| `@version` | Semantic version (bumped on every release) |
| `@updateURL` / `@downloadURL` | Raw GitHub URL of `steam-gamestatus.user.js` |
| `@homepageURL` | This repository |
| `@supportURL` | GitHub Issues |
| `@license` | MIT |
| `@grant` | `GM_xmlhttpRequest`, `GM_getValue`, `GM_setValue`, `GM_addStyle` |
| `@connect` | `gamestatus.info`, `cdn.gamestatus.info` |

Localized `@name` and `@description` tags are provided for en, ru, zh-CN, es,
pt-BR, de, fr, ja, ko, and pl.

## Required permissions

| Grant | Purpose |
|-------|---------|
| `GM_xmlhttpRequest` | Fetch game data from GameStatus.info (bypasses CORS) |
| `GM_getValue` / `GM_setValue` | Persist response cache between sessions |
| `GM_addStyle` | Inject badge and tooltip styles |

`@connect` is limited to `gamestatus.info` and `cdn.gamestatus.info`.
