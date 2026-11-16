# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.14.1] - 2026-11-16

### Changed

- README now lists other userscripts by the same author: [Steam Plus](https://github.com/NemoKing1210/steam-plus) and [Steam Region Block Bypass](https://github.com/NemoKing1210/steam-region-block-bypass), in all ten translations
- Version badges in every README translation now match `package.json`

## [1.14.0] - 2026-11-16

### Added

- API outage guard: after a configurable number of consecutive failed GameStatus requests (default 3), the script pauses lookups for a cooldown (default 5 minutes), removes pending loaders, keeps cached badges visible, and warns with a toast that offers **Retry now**. After the cooldown it probes automatically, reopens on another failure, and shows a confirmation when the API recovers. State persists across reloads so a dead API is not hammered
- “API protection” settings section: enable/disable the guard, failure threshold (2–10), and pause duration (1–60 minutes), plus a live status row with the retry action
- Reusable toast component in the lower-left corner with an optional action button, auto-dismiss, and timer pause on hover/focus
- README translations into all ten supported interface languages (Russian, Chinese, Spanish, Portuguese, German, French, Japanese, Korean, Polish), with a language switcher linking every translation

### Fixed

- Transport/HTTP failures are no longer cached as “not in database” for the whole cache TTL: an outage leaves the lookup uncached so it is retried later
- README version badge showed an outdated version (`1.4.7`); it now matches `package.json`

## [1.13.0] - 2026-09-07

### Added

- Card position setting (Display section): which side of the game the GameStatus card prefers to open on, default Left. The chosen side is only a priority — without enough room in the viewport the card opens on the next side that fits, so placement stays adaptive across badge tooltips and all card display modes (new `cardPosition` setting, `cardPosition` / `cardPositionHint` keys in all locales)

## [1.12.5] - 2026-09-07

### Changed

- Settings tab switching animates: panes fade in with a slight rise, active-tab text and underline crossfade (disabled under `prefers-reduced-motion`)

## [1.12.4] - 2026-09-07

### Fixed

- Badge preview in General tab was invisible in non-badge display modes (hover / right-click / key+click): the badge-hiding page rule also hid the settings mock, now exempted

## [1.12.3] - 2026-09-07

### Changed

- General tab section icons replaced with Heroicons outline set (globe, monitor, tag, eye-off)

## [1.12.2] - 2026-09-07

### Changed

- Redesigned General settings tab: sections as cards with icons, live badge preview mock that follows size and position, visual corner picker replacing the two position dropdowns, missing-badge switch merged into one row card

### Fixed

- Trigger-key row no longer permanently visible: panel styles overrode the `hidden` attribute on flex fields
- Header dot again reflects the horizontal badge position setting

## [1.12.1] - 2026-09-07

### Fixed

- Settings tabs (Cache, About) no longer ignore clicks when a game tooltip is still visible: opening the panel now dismisses any stuck interactive tooltip, and the modal sits above the shared tooltip layer so it owns every click
- Cache entry links inside the settings panel are no longer treated as store cards: full rescans skip the panel UI instead of stamping badges and observation state into the stored-lookups list

## [1.12.0] - 2026-09-06

### Added

- “Reset to defaults” button in the panel footer (danger style, left side) restoring every setting, re-rendering the form, and re-scanning cards (new `resetSettings()` core helper, `resetSettings` key in all locales)

### Changed

- Hotkey display mode defaults to Shift instead of Space (new `displayKey` default `ShiftLeft`, matched via `e.shiftKey`)
- General tab regrouped: interface language, then a titled “Display” section (mode + trigger key recorder), then Badge, then show-missing (new `sectionDisplay` key in all locales)

### Fixed

- Hotkey trigger key no longer resets on Save: missing `normalizeCardDisplay`/`displayKey` imports crashed `fillPanelForm()` on panel open (blank key label, stale form state); `badgeSize` normalization restored in `saveSettings()`, display-key fallback now tracks the default

### Added

- Card display modes “Right-click” (suppresses the menu on cards, pins the tooltip until outside click/Escape) and “Left click + key” (configurable trigger key, Space by default; plain clicks still navigate). Key+click and right-click tooltips share the instant skeleton flow; badge-position/size settings stay gated on badge mode

## [1.10.2] - 2026-09-06

### Removed

- “Checked URLs” section from the “not in database” tooltip card, plus its dead `getTriedUrls` helper, `checkedUrls` locale keys, and orphaned styles

## [1.10.1] - 2026-09-06

### Fixed

- Hover display mode no longer hides the tooltip when the loaded card lands under the cursor: card and tooltip are treated as one hover region, hide fires only when the cursor is over neither, and shown cards are cached per App ID so moving between card and tooltip never flashes the skeleton
- Hover display mode always opens the card, even for games missing from the database (renders “not in database” instead of staying silent)

## [1.10.0] - 2026-09-06

### Changed

- General tab regrouped: card display mode moves above the Badge section, and badge position/size controls disable with a dimmed hint unless “Badge on cards” mode is selected (new `badgeDisabledHint` key in all locales)
- Hover display mode opens the tooltip instantly with the game title and shimmer skeleton rows while the lookup loads, then swaps in the full card

## [1.9.0] - 2026-09-06

### Added

- Card display mode setting (Badge section): always show badges on cards, or open the full GameStatus card only when hovering a game — no badges stamped in hover mode, lookups load lazily on first hover. Game page chips are unaffected (new `cardDisplay` setting, `cardDisplay*` keys in all locales)

## [1.8.5] - 2026-09-06

### Changed

- Tooltip game title links to the GameStatus game page (same URL as the badge)

## [1.8.4] - 2026-09-06

### Changed

- Settings opener button label without the gear icon (reverted)

## [1.8.3] - 2026-09-06

### Changed

- Settings opener button shows a gear icon and a "Settings · GameStatus" label (new `settingsWord` key in all locales)

## [1.8.2] - 2026-09-06

### Fixed

- Settings Cache pane was missing its closing tag, swallowing the About pane (About tab opened empty)
- Cache tab badge shows a bare fill percent without the "full" caption
- Settings modal clips its scroller so the scrollbar never laps onto the header/footer

## [1.8.1] - 2026-09-06

### Changed

- Cache tab badge shows fill percent instead of the entry count
- Stored lookups are collapsed by default behind a count toggle
- Panel header and footer pinned via sticky positioning

## [1.8.0] - 2026-09-06

### Changed

- Settings Badge tab renamed to General (`tabGeneral` in all locales)
- Richer Cache tab like Region Block Bypass: storage meter with found/not-found segments against a soft 2 MB budget, fill-percent badge on the tab, stored-lookup list (capped at 100) with per-entry remove; duration setting and clear-all kept

## [1.7.0] - 2026-09-06

### Added

- Settings interface language selector (Auto + 10 locales) at the top of the General tab — the panel retranslates instantly on change, badges/tooltips need a page reload

## [1.6.2] - 2026-09-06

### Changed

- About author card without the avatar image (`AUTHOR_AVATAR_URL` removed)

## [1.6.1] - 2026-09-06

### Changed

- Settings About tab renamed to "About the script" in all locales; About pane restyled with an author card (avatar + GitHub profile link via new `AUTHOR_URL` constant)

## [1.6.0] - 2026-09-06

### Changed

- Settings panel split into Badge / Cache / About tabs (labels reuse `sectionBadge` / `sectionCache`, new `tabAbout` + `aboutBlurb` keys in all locales); repo link moved from the footer into the About pane, footer keeps only Save actions

## [1.5.0] - 2026-09-06

### Changed

- Settings open like Steam Region Block Bypass: entry lives in the account dropdown menu (logged-in) with a compact header-button fallback (logged-out); the panel is now a centered modal over a dimmed overlay with a version badge in the header, body scroll lock, and close on overlay click / Escape instead of the floating popover near the header button

### Internal

- Monolith `steam-gamestatus.user.js` split into `src/` modules (core, api, features, i18n, utils, styles) with a Vite + `vite-plugin-monkey` build (`npm run build` regenerates the root `.user.js` / `.meta.js`); no user-visible changes

## [1.4.7] - 2026-07-13

### Added

- Tooltip popover footer: GitHub repository link with description below donate/API links, separated by a divider

## [1.4.6] - 2026-07-13

### Changed

- Settings footer: GitHub link moved below the action buttons, separated by a divider

## [1.4.5] - 2026-07-13

### Added

- Settings panel footer link to the GitHub repository with a short localized description

## [1.4.4] - 2026-07-13

### Changed

- Game page header badge uses the same solid Steam-tag style as card badges (status colors, shadow); size unchanged

## [1.4.3] - 2026-07-13

### Added

- Settings: card badge size — Small / Medium / Large / Very large (default Medium; game page header chip unchanged)

## [1.4.2] - 2026-07-13

### Changed

- Card badges (listings, charts, recommendation widgets) are ~20% larger; the game page header badge is unchanged

## [1.4.1] - 2026-07-13

### Fixed

- Game pages now scan recommendation / similar-game cards (e.g. SteamPeek), not only the header badge
- Capsules that put the wrong app id in `data-ds-appid` while linking to another `/app/{id}/` (SteamPeek) resolve and badge by the href App ID
- Image alts ending in “banner” / “capsule” / “header” are cleaned before slug lookup
- Page canonical/OG URL slugs are used only when resolving the current game, not sibling recommendation cards

## [1.4.0] - 2026-07-12

### Added

- Settings button in the Steam header (same style as Region Block Bypass) and a userscript manager menu command
- Settings panel: badge position (vertical + horizontal), show/hide “not in database” badges, cache duration (hours), and clear cache
- Settings are stored in `gs_steam_settings` and localized in all supported UI languages

### Changed

- Cache TTL is configurable (default remains 6 hours for all lookups, including not-found); set to 0 to disable caching
- Tooltips redesigned in a Steam-like popover style: cover image, status/protection/AAA chips, colored score badges, structured hardware block

## [1.3.2] - 2026-07-12

### Fixed

- Personal Calendar: Steam UI chrome (`ON WISHLIST`, badge “GameStatus…”) was used as the game title, producing junk slugs (`on-wishlist`, `gamestatus`) and skipping the Steam name lookup — chrome titles are ignored and GameStatus is resolved via Steam `appdetails` when needed

## [1.3.1] - 2026-07-12

### Fixed

- Personal Calendar and other capsules with `/app/{id}?…` links (no slug or title in the DOM): resolve the Steam store name via `appdetails`, then look up GameStatus by slug
- Card link matching no longer requires a trailing slash after the App ID (query-string-only hrefs work)

## [1.3.0] - 2026-07-12

### Changed

- Product naming and UI copy: statuses use Ready / Pending instead of Cracked / Not cracked; tooltip date label is Updated
- Userscript `@name` / `@description` (all locales) describe general GameStatus.info info, not crack status only
- Docs and changelog wording aligned with the softer status vocabulary

### Removed

- Torrent action button and related localization strings from tooltips

### Added

- `AGENTS.md` and `CLAUDE.md` for AI coding agents

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

- Scroll performance: incremental DOM scans, filtered MutationObserver, scroll-aware hydration batching, pause hydration during scroll
- API queue: max 2 concurrent requests with staggered starts (`REQUEST_DELAY_MS`), cache fast-path before enqueue
- In-memory cache with debounced persistence to `GM_setValue`
- Reduced prefetch margin (`80px` / `CARD_ROOT_MARGIN`), removed `backdrop-filter` on badges for lighter compositing
- Lazy tooltip binding on first hover/focus

### Fixed

- Scroll jank caused by full-page DOM rescans (`querySelectorAll`) on every Steam mutation
- Redundant cache parsing and queueing for already-cached games
- Main-thread blocking from synchronous cache read/write during rapid card hydration

## [1.0.0] - 2026-07-09

### Added

- Status badges on Steam store game cards and game pages (data from GameStatus.info)
- Rich hover tooltips with protection, dates, hardware specs, and links
- Lazy loading via `IntersectionObserver` and request queue (max 4 concurrent)
- UI localization for 10 languages based on browser locale (fallback: English)
- Tampermonkey / Violentmonkey / Greasemonkey-compatible metadata and auto-update URLs

[1.14.1]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.14.1
[1.14.0]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.14.0
[1.13.0]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.13.0
[1.12.5]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.12.5
[1.12.4]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.12.4
[1.12.3]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.12.3
[1.12.2]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.12.2
[1.12.1]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.12.1
[1.12.0]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.12.0
[1.11.0]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.11.0
[1.10.2]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.10.2
[1.10.1]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.10.1
[1.10.0]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.10.0
[1.9.0]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.9.0
[1.8.5]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.8.5
[1.8.4]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.8.4
[1.8.3]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.8.3
[1.8.2]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.8.2
[1.8.1]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.8.1
[1.8.0]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.8.0
[1.7.0]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.7.0
[1.6.2]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.6.2
[1.6.1]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.6.1
[1.6.0]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.6.0
[1.5.0]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.5.0
[1.4.7]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.4.7
[1.4.6]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.4.6
[1.4.5]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.4.5
[1.4.4]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.4.4
[1.4.3]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.4.3
[1.4.2]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.4.2
[1.4.1]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.4.1
[1.4.0]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.4.0
[1.3.0]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.3.0
[1.2.1]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.2.1
[1.2.0]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.2.0
[1.1.1]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.1.1
[1.1.0]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.1.0
[1.0.0]: https://github.com/NemoKing1210/steam-gamestatus/releases/tag/v1.0.0
