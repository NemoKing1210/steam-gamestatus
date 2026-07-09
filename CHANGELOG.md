# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

- Crack status badges on Steam store game cards and game pages
- Rich hover tooltips with protection, crack date, hardware specs, and links
- Lazy loading via `IntersectionObserver` and request queue (max 4 concurrent)
- Local response cache with positive (6 h) and negative (24 h) TTL
- UI localization for 10 languages based on browser locale (fallback: English)
- Tampermonkey / Violentmonkey / Greasemonkey-compatible metadata and auto-update URLs

[1.1.0]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.1.0
[1.1.0]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.1.0
[1.0.0]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.0.0
