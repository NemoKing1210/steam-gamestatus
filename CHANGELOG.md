# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-09

### Added

- Crack status badges on Steam store game cards and game pages
- Rich hover tooltips with protection, crack date, hardware specs, and links
- Lazy loading via `IntersectionObserver` and request queue (max 4 concurrent)
- Local response cache with positive (6 h) and negative (24 h) TTL
- UI localization for 10 languages based on browser locale (fallback: English)
- Tampermonkey / Violentmonkey / Greasemonkey-compatible metadata and auto-update URLs

[1.0.0]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.0.0
