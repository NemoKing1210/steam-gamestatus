# Steam GameStatus

[![Install userscript](https://img.shields.io/badge/Install-userscript-66c0f4?style=for-the-badge)](https://raw.githubusercontent.com/NemoKing1210/steam-gamestatus/main/steam-gamestatus.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.4.7-green?style=for-the-badge)](CHANGELOG.md)

A userscript for the Steam store and Steam Community that adds extra game information from [GameStatus.info](https://gamestatus.info) — protection, release dates, scores, hardware specs, and more.

While browsing Steam, you see compact info badges on game cards and in the game page header — without leaving the store.

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

Managers compare the installed `@version` with the remote metadata to decide whether to offer an update.

## Features

- **Settings panel** — header button to set badge position, badge size, card position, cache duration, clear cache, and whether to show “not in database” badges
- **Status badges on game cards** — store home, search results, wishlists, sale pages, and other listings with `/app/{id}` links
- **Status badge on game pages** — compact status chip in `.apphub_OtherSiteInfo` next to Community Hub / Store Page links
- **Rich tooltips** — Steam-like popovers with cover art, status chips, colored scores, and hardware details
- **Color-coded statuses** — quick visual scan across a long list of games
- **Lazy loading** — badges load only when cards scroll into view
- **Smart caching** — responses are cached locally to reduce API load and speed up repeat visits
- **Steam-like UI** — badges styled like Steam `.app_tag`, tooltips like store hover popovers
- **10 UI languages** — English, Russian, Chinese, Spanish, Portuguese, German, French, Japanese, Korean, Polish (detected from browser locale)

## Supported pages

| Site | URL pattern |
|------|-------------|
| Steam Store | `https://store.steampowered.com/*` |
| Steam Community (app hub) | `https://steamcommunity.com/app/*` |

## Status colors

Each badge has a colored dot that reflects the game’s status on GameStatus.info:

| Color | Status | Meaning |
|-------|--------|---------|
| Green | Ready | Status indicates the game is ready / available |
| Orange | Pending (recent) | Pending status; released less than one month ago |
| Red | Pending (long wait) | Pending status; released more than one month ago |
| Orange | Protection bypass | Status indicates a protection bypass method |
| Blue | Release today | Game releases today; status may still be pending |
| Gray | Unknown / Not in database | Status unclear, or game not found on GameStatus.info |
| Blue (spinner) | Loading | Data is being fetched from the API |

Clicking a badge opens the game’s page on GameStatus.info (or the site homepage if the game was not found).

## Tooltip contents

Hovering a badge opens a Steam-like popover that may show:

- **Header** — cover image, title, status chip, AAA / protection / group chips
- **Dates** — release and status update dates, Steam ID, subscriptions
- **Scores** — GameStatus and Metacritic values with Metacritic-style colors (green ≥75, yellow ≥50, red below)
- **Hardware** — CPU, RAM, GPU, OS when available
- **Description** — short game description
- **Footer** — support button plus API / GameStatus links

If a game is not in the database, the popover shows a “not in database” chip and lists the API URLs tried during lookup.

## Settings

Open **GameStatus** in the Steam header (or the userscript manager menu) to configure:

| Setting | Default | Notes |
|---------|---------|--------|
| Badge position (vertical / horizontal) | Top / Left | Card badges only; game-page chips stay in the header |
| Card position | Left | Where the GameStatus card opens next to a game; flips to the next side with room |
| Badge size | Medium | Small / Medium / Large / Very large; card badges only |
| Show “not in database” badges | On | When off, unmatched cards stay unmarked |
| Cache duration (hours) | 6 | Applies to all cached lookups; max 168 (7 days) |
| Clear cache | — | Immediate; does not require Save |

## For developers

This section moved to dedicated guides:

- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — build, local testing, configuration, releasing
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — how it works, repository layout, metadata, permissions
- [CONTRIBUTING.md](CONTRIBUTING.md) — contributor workflow and PR checklist
- [AGENTS.md](AGENTS.md) — instructions for AI coding agents

## Data source

All game data comes from the public GameStatus.info API:

```
GET https://gamestatus.info/back/api/gameinfo/game/{slug}/
```

This project is **not affiliated** with Valve, Steam, or GameStatus.info. Status information is community-maintained and may be incomplete or outdated. Use it as a reference, not as a guarantee.

## License

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
