# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1] - 2026-07-09

### Fixed

- Featured carousel (`carousel_wide_mode`): badges no longer show the wrong game or stack on top of each other — slides share the same screen coordinates, so only the `.focus` slide displays a badge
- Carousel badge anchor moved to `.capsule_image_ctn` instead of the full capsule link
- Stale carousel badges reset when `data-ds-appid` changes or focus moves to another slide

## [1.2.0] - 2026-07-09

### Added

- Support donate button in tooltips (`gamestatus.info/#donate`) with localization
- External link button in tooltip actions (when available from API)
- Chart table rows (Top Sellers): badge in `StoreSalePriceWidgetContainer` next to price
- Pending-status badge colors by release age: orange (less than 1 month), red (more than 1 month)

### Changed

- Game page badge moved to `.apphub_OtherSiteInfo`, styled as `btnv6_blue_hoverfade btn_medium`
- Home content single cards: badge on capsule image, not in button bar
- Carousel / multi-game panels: one badge per `data-ds-appid` capsule

### Fixed

- Wrong game badge on home content singles (Stardew link in “recently played” reason)
- Wrong app ID and missing badges in carousel slides with multiple games
- Empty game title for capsule cards without visible title element

## [1.1.1] - 2026-07-09

### Changed

- Badge styling aligned with Steam `.app_tag` (flat `#384959` chips, `border-radius: 3px`, `box-shadow: 1px 1px 0 #000`)
- Status colors use Steam palette (`#BEEE11`/`#4c6b22` for ready, `#FFB321` bypass, `#67c1f5` accents)
- Tooltips restyled as dark store popovers (`#3D4450`, `border-radius: 2px`, `box-shadow: 0 0 3px #000`)
- Tooltip positioning defaults above the badge (Steam `tooltip.js` behavior)

## [1.1.0] - 2026-07-09

### Changed

- Scroll performance: incremental DOM scans, filtered MutationObserver, pause hydration during scroll
- API queue: max 2 concurrent requests with staggered starts, cache fast-path before enqueue
- In-memory cache with debounced persistence to `GM_setValue`
- Reduced prefetch margin (`80px`), removed `backdrop-filter` on badges for lighter compositing

### Fixed

- Scroll jank caused by full-page `querySelectorAll` on every DOM mutation
- Redundant cache parsing and queueing for already-cached games

## [1.1.0] - 2026-07-09

### Changed

- Scroll performance: incremental DOM scanning, filtered MutationObserver, scroll-aware hydration batching
- API queue: max 2 concurrent requests with staggered starts (`REQUEST_DELAY_MS`)
- In-memory cache with debounced persistence to `GM_setValue`
- Cache fast-path bypasses the request queue for hits
- Reduced prefetch margin (`CARD_ROOT_MARGIN`) and removed `backdrop-filter` from badges
- Lazy tooltip binding on first hover/focus

### Fixed

- Scroll jank caused by full-page DOM rescans on every Steam mutation
- Main-thread blocking from synchronous cache read/write during rapid card hydration

## [1.0.0] - 2026-07-09

### Added

- Status badges on Steam store game cards and game pages (data from GameStatus.info)
- Rich hover tooltips with protection, dates, hardware specs, and links
- Lazy loading via `IntersectionObserver` and request queue (max 4 concurrent)
- Local response cache with positive (6 h) and negative (24 h) TTL
- UI localization for 10 languages based on browser locale (fallback: English)
- Tampermonkey / Violentmonkey / Greasemonkey-compatible metadata and auto-update URLs

[1.2.1]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.2.1
[1.2.0]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.2.0
[1.1.1]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.1.1
[1.1.0]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.1.0
[1.0.0]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.0.0
