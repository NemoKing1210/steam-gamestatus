# AGENTS.md — Steam GameStatus

Instructions for AI coding agents working in this repository.

## Project

Userscript that adds GameStatus.info badges and tooltips on Steam Store
(`store.steampowered.com`) and Steam Community app pages
(`steamcommunity.com/app/*`). Built with Vite and `vite-plugin-monkey` for
Tampermonkey, Violentmonkey, Greasemonkey, ScriptCat, and compatible managers.

- Source entry point: `src/main.js`
- Version source of truth: `package.json`
- Generated install artifacts: `steam-gamestatus.user.js` and
  `steam-gamestatus.meta.js` (produced only by `npm run build`)
- Docs: `README.md`, `CHANGELOG.md` (Keep a Changelog + SemVer)
- License: MIT

Edit files under `src/`. Never hand-edit generated `.user.js` or `.meta.js`
files; regenerate them with `npm run build`.

## Repository layout

```text
steam-gamestatus/
├── src/
│   ├── main.js                # Entry: init, MutationObserver, scan pipeline
│   ├── core/
│   │   ├── constants.js       # URLs, storage keys, defaults, timings, CSS class
│   │   ├── settings.js        # Settings state, validation, persistence
│   │   ├── cache.js           # Game-lookup cache (memory-first, GM-backed)
│   │   └── queue.js           # API request throttle
│   ├── api/
│   │   ├── gamestatus.js      # Slug resolution → GameStatus API → match
│   │   └── steam.js           # Store appdetails fallback titles
│   ├── features/
│   │   ├── index.js           # pageFeatures scan registry
│   │   ├── cards/             # Listing cards: discovery, lazy-load, hydration
│   │   ├── game-page/         # Header chip on /app/{id} pages
│   │   ├── badge/             # Badge + tooltip rendering, status taxonomy
│   │   └── settings/          # Header button + settings panel
│   ├── i18n/
│   │   ├── index.js           # configureLocale / getLocale / t
│   │   ├── meta.js            # SUPPORTED_LOCALES, aliases, native names
│   │   └── locales/*.js       # One file per locale (en, ru, zh, es, pt,
│   │                           # de, fr, ja, ko, pl)
│   ├── utils/
│   │   ├── slug.js            # slugify, /app/{id} parsing, slug validation
│   │   ├── steam-dom.js       # Title extraction, slug candidates, page helpers
│   │   ├── format.js          # Dates, scores, localized API fields
│   │   ├── placement.js       # Viewport-adaptive popover card placement
│   │   └── html.js            # escapeHtml / escapeAttr
│   └── styles/
│       ├── app.css            # All injected styles (GM_addStyle via build)
│       └── tokens.css         # Shared :root design tokens
├── scripts/
│   ├── lib/artifacts.mjs      # ARTIFACT_FILES list (single source of truth)
│   ├── copy-dist.mjs          # dist/ → root artifact copy
│   └── verify-artifacts.mjs   # dist/ ↔ root byte-identity check
├── dist/                      # Build output (gitignored)
├── steam-gamestatus.user.js   # Generated bundle (do not hand-edit)
├── steam-gamestatus.meta.js   # Generated metadata (do not hand-edit)
├── vite.config.js             # Build + userscript metadata
├── package.json               # Version source of truth
└── .github/workflows/ci.yml   # Build + verify gate
```

## Module reference

### `src/main.js` — ownership and scan pipeline

Owns the single page-level `MutationObserver` and the debounced scan loop:

- `init()`: `configureLocale(getSettings().language ?? 'auto')` →
  `applyBadgeAppearance()` → `loadMemoryCache()` → `pagehide` persist hook →
  `ensureSettingsButton()` → `observeHeader()` → `GM_registerMenuCommand` →
  initial `scheduleScan()` → observer attach with `MUTATION_OBSERVER_OPTIONS`.
- `runScan()` drains `pendingScanNodes` and calls each `pageFeatures` hook
  with the node list (empty array = full scan; first run forces full scan via
  `hasInitialScan`).
- Hands the observer instance to the cards module via `setMutationObserver()`
  so `observeCardsMap()` can pause/resume it while stamping badges (avoids
  self-triggered rescan storms). Own-UI mutations (`#gs-panel-overlay`,
  `#gs-settings-btn`, `.gs-steam-badge__tooltip`) are additionally dropped by
  `collectRelevantMutations()`.

### `src/features/index.js` — scan registry

`pageFeatures` is an ordered array of `{ scan(nodes) }` hooks:

1. Settings-button guard (re-create `#gs-settings-btn` if Steam removed it).
2. `renderGamePage()` (no-op off `/app/{id}` pages).
3. Cards: `observeCardsFromNodes(nodes)` for incremental rescans,
   `observeCards()` for full scans.

`openSettings` is re-exported for the menu command.

### `src/core/constants.js`

Single place for magic values. Notable entries:

- `API_BASE` (`…/back/api/gameinfo/game`), `SITE_BASE`, `DONATE_URL`,
  `REPO_URL`; `CACHE_KEY = 'gs_steam_cache_v5'`;
  `SETTINGS_KEY = 'gs_steam_settings'`.
- `DEFAULT_SETTINGS`: `cacheHours: 6`, `badgeVertical: 'top'`,
  `badgeHorizontal: 'left'`, `badgeSize: 'medium'`, `cardDisplay: 'badge'`,
  `cardPosition: 'left'`, `displayKey: 'ShiftLeft'`, `showMissingBadge: true`.
- Throttle/shape timings: `MAX_CONCURRENT = 2`, `REQUEST_DELAY_MS = 75`,
  `MAX_SLUG_ATTEMPTS = 2`, `HYDRATE_BATCH_SIZE = 3`,
  `CARD_ROOT_MARGIN = '80px 0px'`, `SCAN_DEBOUNCE_MS = 450`,
  `SCROLL_IDLE_MS = 150`, `CACHE_PERSIST_MS = 1000`,
  `CACHE_HOURS_MAX = 168`.
- `BADGE_CLASS = 'gs-steam-badge'` (also interpolated into CSS at build time
  as the literal class name — never rename one side only).
- `STEAM_APPDETAILS_URL` (Store `appdetails` endpoint).
- `MUTATION_OBSERVER_OPTIONS`: `childList + subtree + attributes`, filtered to
  `data-ds-appid`, `data-sub-id`, `class`.
- `SCRIPT_VERSION` reads `package.json` via `import … with { type: 'json' }`.

### `src/core/settings.js`

Module-level `settings` object loaded once at import (`loadSettings()`).
Public API: `loadSettings`, `getSettings`, `saveSettings`,
`setSettingsChangeListener`, `getCacheTtlMs`, `applyBadgeAppearance`, plus the
`normalize*` validators (`normalizeCacheHours` clamps to `0..168`,
`normalizeBadgeVertical/Horizontal/Size`, `normalizeCardPosition` fall back to
defaults on junk).

Two wiring details that must survive refactors:

- `saveSettings()` calls `applyBadgeAppearance()` and then the registered
  `settingsChangeListener` — it never touches feature modules directly.
- `src/features/settings/index.js` registers `updateSettingsButtonState` as
  that listener. This one-way hook is what keeps the `core → features` import
  direction acyclic (see "Import direction" below).

`applyBadgeAppearance()` toggles `gs-badge-v-top/bottom`,
`gs-badge-h-left/right`, `gs-badge-size-sm/md/lg/xl` classes on
`<html>`; card badges follow them, the game-page chip does not.

### `src/core/cache.js`

Memory-first cache over `GM_getValue`/`GM_setValue`:

- `loadMemoryCache()` lazily parses `CACHE_KEY` once; `readCache()` returns
  the live object. Writes go to memory immediately and persist debounced via
  `scheduleCachePersist()` (`CACHE_PERSIST_MS`); `persistCacheNow()` flushes
  (also bound to `pagehide` in `main.js`).
- `getCached(appId)` / `setCached(appId, payload)` enforce the TTL from
  `getCacheTtlMs()`; `cacheHours: 0` disables both directions. Entries carry
  `{ data, slug, slugs, triedUrls, apiUrl, missing, ts }` — **not-found
  results are cached too** (negative caching), so a miss costs one lookup per
  TTL window.
- `inflight` (exported `Map`) dedups concurrent `loadGame()` calls per app ID;
  `clearGameCache()` wipes memory + storage + `inflight` and returns the
  removed count for the panel confirmation message.
- `listGameCacheEntries()` (newest-first `{appId, title, missing, bytes, ts}`),
  `getGameCacheStats()` (found/missing counts+bytes vs `CACHE_SOFT_LIMIT_BYTES`)
  and `removeGameCacheEntry(appId)` back the Cache tab meter, entry list and
  per-entry remove in `features/settings/cache-pane.js`.

### `src/core/queue.js`

Single-flight throttle: `enqueue(task)` returns a promise; at most
`MAX_CONCURRENT` tasks run, and `drainQueue` resumes `REQUEST_DELAY_MS` after
each completion. All GameStatus API traffic funnels through here via
`loadGame()` — never call `resolveGame()` directly from features.

### `src/api/gamestatus.js` — resolution pipeline

Resolution order per app ID (see `resolveGame()`):

1. `getCached()` short-circuit.
2. `buildSlugCandidates(appId, link, title)` from DOM evidence (junk titles
   rejected via `isUiChromeTitle()`).
3. `tryResolveBySlugs()` tries at most `MAX_SLUG_ATTEMPTS` slugs:
   `GET {API_BASE}/{slug}/` → accept only if `isMatchingGame()` passes.
4. If the DOM yielded no slugs (e.g. Personal Calendar `/app/{id}?…` capsules
   exposing only "ON WISHLIST" chrome), fetch the Store title via
   `fetchSteamAppTitle()` and retry from it.
5. If DOM slugs failed but a distinct Store title exists, retry once more from
   the Store title (guards against junk slugs from wishlist flags/badge text).
6. Otherwise store a `missing: true` entry (with `triedUrls` for the tooltip
   footer) and return it.

`isMatchingGame()` accepts responses without `steam_prod_id` and otherwise
requires an exact string match — **never resolve by App ID alone**.
`loadGame()` adds the `getCached()` fast path plus `inflight` + `enqueue()`
dedup around `resolveGame()`. `requestJson()` sends `GM_xmlhttpRequest` with
the browser `Accept-Language` (fallback `en-US`).

### `src/api/steam.js` — title fallback

`fetchSteamAppTitle(appId)` calls
`{STEAM_APPDETAILS_URL}?appids={id}&filters=basic` via `fetch()` (not
`GM_xmlhttpRequest`): `same-origin` credentials on
`store.steampowered.com`, `omit` elsewhere. Results (including `null`) are
memoized in `steamTitleCache`; concurrent callers share `steamTitleInflight`.
Failures resolve to `null` — never throw into the resolution pipeline.

### `src/utils/slug.js`

- `slugify()`: lowercase, NFKD strip diacritics, drop `™®©'"”:`, non
  `[a-z0-9]` → `-`, collapse/trim dashes.
- `extractAppIdFromHref()` (`/app/(\d+)`), `extractSlugFromHref()`
  (slugifies the `/app/{id}/{slug}` segment, `_` → `-`), `hrefMatchesAppId()`,
  `findAppAnchor(root, appId, { includeClosest })` (root itself → closest
  wrapping link → descendant links).
- `isDsAppCapsule()` — shared `data-ds-appid` predicate (single definition;
  both `cards` and `steam-dom` import it from here).
- `isValidSlug()` + `INVALID_SLUG_RE`: rejects Steam-CDN/hosting slugs,
  wishlist/game-pass chrome, `gamestatus`, digit-only slugs, and slugs that
  are >50% numeric segments. Extend the regex when new junk slugs appear
  (attempted slugs persist as entry `triedUrls` in GM storage).

### `src/utils/steam-dom.js` — title and candidate extraction

- `getCardTitle(card, link, resolveLink)` source priority: `TITLE_SELECTORS`
  hits (`.tab_item_title`, search titles, sale widget titles, …) → for
  `data-ds-appid` capsules the `img[alt]` (banner/capsule/header suffixes
  stripped) plus slug-from-href words → generic capsule `img[alt]` →
  `aria-label` (discount suffix stripped) → slug-from-href words → first
  non-chrome text line of the link clone (badge/flag/wishlist nodes removed).
  Every candidate is filtered through `isUiChromeTitle()` (UI chrome regex +
  `game status` prefix) and `looksLikePriceText()` (prices, discounts, dates).
  Returns the first surviving source or `''`.
- `buildSlugCandidates(appId, link, title)`: link-href slug, then **only on the
  page's own game** (`isGamePage()` + ID match) the pathname, canonical URL,
  and `og:url` slugs, then the title plus a truncated-at-separator variant.
- `getPageAppId()`: pathname → `window.g_rgAppData.appid` → `[data-appid]`.
- `getPageTitle()`: `.apphub_AppName` → `#appHubAppName` → `document.title`
  minus the ` on Steam…` suffix.

### `src/utils/format.js`

- `getLocalizedGroup()` / `getLocalizedDescription()`: Russian UI prefers the
  native fields, everything else prefers `*_en`. Both read the live locale via
  `getLocale()` — never snapshot `LOCALE` at import.
- `getApiLanguage()`: `navigator.language || 'en-US'` (request header +
  `formatDate()` locale).
- `truncateText()` (140 chars + `…`), `parseGameDate()` (null-safe),
  `formatScore()` (number passthrough, null-safe).

### `src/utils/placement.js` — adaptive popover placement

Pure geometry (no DOM/GM — Node-smoke-testable). `cardPosition` is only a
preference: `tooltipSideOrder()` yields preferred → opposite → perpendicular
pair; `resolveTooltipPlacement()` returns the first side whose placement fits
fully inside the padded viewport (`TOOLTIP_PAD`/`TOOLTIP_GAP`), else clamps
the side with the largest visible area. Left/right sides center vertically on
the anchor, top/bottom center horizontally. `showTooltipHtml()` in
`features/badge` feeds it the anchor rect and measured tooltip size.

### `src/i18n`

- `meta.js`: `SUPPORTED_LOCALES` (`en ru zh es pt de fr ja ko pl`),
  `LOCALE_ALIASES` (e.g. `zh-cn`/`zh-hans` → `zh`, `pt-br` → `pt`),
  `LOCALE_NATIVE_NAMES`.
- `index.js`: `configureLocale(preference = 'auto')` matches
  `navigator.languages` through aliases with base-language fallback, else
  `'en'`; `getLocale()` exposes it; `t(key, vars)` falls back
  `active → en → key` and interpolates `{name}` placeholders.
- `locales/*.js`: one `export default { … }` map per locale, all with
  identical key order; `locales/index.js` freezes the combined
  `TRANSLATIONS`. Add every new key to **all ten** files.

### `src/features/cards/` — listings

Card discovery and lazy hydration. Key exports: `collectCards`,
`collectCardsFromNodes`, `collectRelevantMutations`, `observeCards`,
`observeCardsFromNodes`, `hydrateCard`, `resetBadgeAnchor`,
`shouldRenderMissingBadge`, `setMutationObserver` /
`pauseMutationObserver` / `resumeMutationObserver`.

- **Discovery** (`tryAddCardFromLink` → `collectCardsFromRoot`): skips own
  badges and `.home_content_reason` links; resolves the owning container via
  `findCardContainer()` (chart `<tr>` → `data-ds-appid` capsule → generic
  card). Keyed by app ID in a `Map`.
- **Anchor selection** (`getBadgeAnchor()`): chart rows mount inside the price
  widget container; home gamelinks and capsule images have dedicated anchors;
  otherwise the card itself. `ensureRelativePosition()` (imported from
  `../badge`) is applied to non-chart anchors only.
- **Carousel rule**: `.carousel_wide_mode .store_main_capsule:not(.focus)`
  badges stay hidden (CSS) and `isCarouselBadgeVisible()` gates hydration;
  `class`-attribute mutations on wide-carousel slides re-trigger a scan when
  the focused slide gains a verified badge.
- **Multi-app capsules**: `cleanupMisplaced*()` removes badges whose anchor
  App ID no longer matches (`verifyBadgeAppId()`); `hasMultipleGames()` /
  `countDistinctAppIds()` detect group containers.
- **Observe** (`observeCardsMap()`): pauses the page observer, stamps loader
  badges, records the `gsObserved / gsAppId / gsTitle` dataset protocol,
  subscribes anchors to `visibilityObserver`
  (`rootMargin: 80px`, `threshold: 0.05`), then resumes the observer. Installs
  the scroll listener once (owned here, not by `main.js`).
- **Hydrate**: intersecting anchors go to `enqueueHydration()` →
  `flushHydrationQueue()` batches `HYDRATE_BATCH_SIZE` per animation frame,
  paused while `isScrolling` (resumes `SCROLL_IDLE_MS` after scroll stops).
  `hydrateCard()` re-resolves App ID/link/title at flush time, awaits
  `loadGame()`, and re-checks `dataset.gsAppId` before/after (plus inside
  `requestAnimationFrame` for the hide-missing path) so recycled Steam nodes
  never paint a stale game. Honors `showMissingBadge` via
  `shouldRenderMissingBadge()`; load failures render the `loadError` badge
  only when missing badges are enabled.
- **Filter** (`collectRelevantMutations()`): attribute mutations only for
  `data-ds-appid` capsules (stale-badge reset) and carousel focus changes;
  added nodes via `isRelevantAddedNode()` (drops `#gs-panel`,
  `#gs-settings-btn`, own tooltip/badges). Falls back to a full `document.body`
  rescan when a reset happened with no nodes.

### `src/features/game-page/` — game pages

`renderGamePage()` mounts one chip into `.apphub_OtherSiteInfo`, guarded by
`dataset.gsPageProcessed` and an existing-badge check. Link resolution:
`findAppAnchor(document, appId)` → `a[href*="/app/{id}"]` → pathname
fallback. Same `loadGame()` path as cards (cache + queue + slug resolution);
missing/error handling mirrors `hydrateCard()` with `{ isPage: true }`
rendering. Game-page chips ignore badge position/size settings by design.

### `src/features/badge/` — status taxonomy and rendering

- `getStatusType(game)`: `missing` (no data) → `release-today` (status text) →
  `bypass` (groups/status mention bypass) → `not-cracked-recent` /
  `not-cracked-old` (split at one month before/after `release_date`; dateless
  games count as recent) → `cracked` (`crack_date` or status match) →
  `unknown`.
- `getStatusLabel()` prefers the API's `readable_status`, else localized
  fallbacks (`cracked`, `notCracked`, `protectionBypass`, `releaseToday`,
  `unknownStatus`, `notInDatabase`).
- `formatTooltip(game)`: header (cover, title, status/group chips) → date rows
  (release, updated, Steam ID, subscriptions) → score badges
  (`getScoreTone()`: `high ≥ 75`, `mid ≥ 50`, `low`, percent = `≤10 → ×10`) →
  hardware rows (CPU/RAM/GPU/OS) → truncated description → footer (donate,
  API/GameStatus links, repo link). Missing games show `gameNotFound` with no
  URL list by design.
- `renderBadge(entry, { isPage, isChart, appId })` and `createLoaderBadge()`
  build badge nodes; `bindTooltip()` lazily fills a **singleton**
  `.gs-steam-badge__tooltip` on hover/focus. `showTooltipHtml()` places the
  popover through `resolveTooltipPlacement()` (`utils/placement.js`) — the
  `cardPosition` side is a preference, placement flips to the next side with
  viewport room. All external strings/URLs pass
  through `escapeHtml`/`escapeAttr`.
- `ensureRelativePosition()` is defined here and imported by `cards` (single
  definition).

### `src/features/settings/` — header button and panel

- `ensureSettingsButton()`: waits up to 20 s for `#global_actions`, then
  injects `#gs-settings-btn` as a `popup_menu_item` into the account dropdown
  (`#account_dropdown .popup_body.popup_menu`, logged-in) or as a compact
  header button (logged-out fallback). Both carry a "`settingsWord` ·
  GameStatus" label. `observeHeader()` re-creates the
  button if Steam's header re-renders and upgrades the fallback to the menu
  item once the dropdown appears. Clicks hide the Steam dropdown via `HideMenu`
  and open the modal.
- Panel (`ensurePanel()` + `fillPanelForm()` / `persistPanelForm()` /
  `togglePanel()` / `switchPanelTab()` + body scroll lock): centered `#gs-panel`
  modal over a dimmed `#gs-panel-overlay`, header with `v{SCRIPT_VERSION}` badge,
  tab bar (`data-gs-tab`: general / cache / about, labels `tabGeneral` /
  `sectionCache` + `tabAbout`) over a scrollable `.gs-panel__body` with matching
  `data-gs-pane` panes — General (interface language with live panel retranslate,
  Display section: card display mode select, card-position select for the popover
  card, plus the hotkey recorder button (`syncDisplayControls()`
  gates badge controls + `recordDisplayKey()` capture listener), badge position/size,
  show-missing pill with hint), Cache (usage meter with
  found/missing segments + count badge on the tab via `cache-pane.js`
  `paintCachePane()`, stored-lookup list capped at 100 with per-entry remove,
  duration hours with hint, clear-all with `{count}` confirmation via
  `clearGameCache()`, `cacheEmpty` state), About (hero + `aboutBlurb` + author
  card linking to `AUTHOR_URL` + repo link button). Footer: danger "reset to
  defaults" (`resetSettings()` + refill + rescan) on the left, Save actions on
  the right; close on overlay click / `Escape`. `openSettings()` chains
  `ensureSettingsButton().then(() => togglePanel(true))` for the menu command.

### `src/styles/`

- `app.css`: the full injected stylesheet (badges, tooltip, header button,
  panel, carousel suppression), imported by `main.js` and applied as
  `GM_addStyle` by the build. `${BADGE_CLASS}` from the old monolith is
  baked in as the literal `gs-steam-badge` — keep the constant and the CSS
  in sync.
- `tokens.css`: shared `:root` custom properties (accent, surfaces, text,
  badge sizing) plus a `prefers-reduced-motion` guard.

## Import direction

`utils ← core ← api ← features`, with two deliberate exceptions:

- `core/cache.js` imports `getCacheTtlMs` from `core/settings.js`
  (`settings.js` must never import `cache.js`).
- `core/settings.js` notifies features only through the
  `setSettingsChangeListener()` hook (no `core → features` imports).

`features/badge` is imported by `cards` and `game-page` (rendering helpers)
and by `settings` (`dismissTooltip()` on panel open — a stuck interactive
tooltip floats above the modal at the same z-index and swallows tab clicks);
`features/cards` exports `shouldRenderMissingBadge` for `game-page`.
`main.js` may import from anywhere but must not own feature state — the
`MutationObserver` handoff via `setMutationObserver()` is the only
shared-mutable bridge.

Additional rules:

- GM APIs (`GM_xmlhttpRequest`, `GM_getValue`, `GM_setValue`,
  `GM_registerMenuCommand`) are imported from `'$'`; `GM_addStyle` is implicit
  via CSS imports — never call it directly.
- The request path is always `hydrateCard`/`renderGamePage` → `loadGame()` →
  `enqueue()` → `resolveGame()`; features never bypass the queue or the cache.
- `getCardTitle()` takes the link resolver as a parameter (`resolveLink`) so
  `utils/steam-dom.js` never imports `features/cards` (would cycle).

## End-to-end data flow

DOM mutation → `collectRelevantMutations()` → debounced `runScan()` →
`observeCardsMap()` stamps loaders + subscribes anchors →
`IntersectionObserver` → scroll-idle `flushHydrationQueue()` →
`hydrateCard()` → `loadGame()` (memory cache → `inflight` dedup → queue →
`resolveGame()` slug attempts → GameStatus API with `steam_prod_id` match,
Store-title fallback on weak DOM evidence) → `setCached()` →
`renderBadge()` + `bindTooltip()`.

## Steam DOM gotchas

- Featured carousels reuse coordinates across slides: only the `.focus` slide
  may show a badge; both CSS and `isCarouselBadgeVisible()` enforce this.
- `data-ds-appid` capsules (wishlist, SteamPeek overlays) may carry the page's
  App ID instead of the card's — always re-resolve from the link href
  (`resolveCardAppId`, `verifyBadgeAppId`) before painting.
- Chart/table rows need the price-widget anchor, not the `<tr>` itself.
- Group containers with several App IDs must not accumulate one shared badge;
  the `cleanupMisplaced*()` family handles this.
- Steam recycles card nodes during scrolling/filtering: every async boundary
  in `hydrateCard()` re-validates `dataset.gsAppId`.
- Wishlist flags, discount labels, prices, and our own badge text leak into
  `textContent` — title extraction filters them explicitly; when adding
  selectors, extend `TITLE_SELECTORS` / `UI_CHROME_TITLE_RE` /
  `INVALID_SLUG_RE` rather than special-casing call sites.

## Settings

Stored under `gs_steam_settings` (`getSettings()` is the only reader;
`saveSettings()` the only writer).

| Key | Default | Notes |
|-----|---------|-------|
| `cacheHours` | `6` | `0` disables cache; clamped to `0..168` |
| `badgeVertical` | `'top'` | `'top'` / `'bottom'`; cards only |
| `badgeHorizontal` | `'left'` | `'left'` / `'right'`; cards only |
| `badgeSize` | `'medium'` | `'small'` / `'medium'` / `'large'` / `'xlarge'`; cards only |
| `cardDisplay` | `'badge'` | `'badge'` / `'hover'` / `'context'` / `'hotkey'`; non-badge modes hide card badges |
| `cardPosition` | `'left'` | `'left'` / `'right'` / `'top'` / `'bottom'`; preferred side for the popover card — placement flips to the next side with room |
| `displayKey` | `'ShiftLeft'` | `e.code` for the hotkey mode (`ShiftLeft` matches `e.shiftKey`) |
| `showMissingBadge` | `true` | `false` leaves unmatched cards unmarked; hover/click modes always show the card |
| `language` | `'auto'` | `'auto'` (browser) or a `SUPPORTED_LOCALES` code; panel live-retranslates, badges need reload |

Add new keys to `DEFAULT_SETTINGS`, a `normalize*` validator, the panel form
(`fillPanelForm` / `persistPanelForm`), and the header-dot comparison in
`updateSettingsButtonState()` together — a setting missing from any of the
four is a bug.

## Localization

UI locales: `en`, `ru`, `zh`, `es`, `pt`, `de`, `fr`, `ja`, `ko`, `pl`.
`configureLocale('auto')` matches `navigator.languages` via
`LOCALE_ALIASES` (covers `zh-CN`/`zh-Hans` → `zh`, `pt-BR` → `pt`, base-language
fallback) with English fallback.

- Add every new user-facing string to **all ten** `src/i18n/locales/*.js`
  files, keeping key order identical (verified by smoke test).
- Keep localized `@name` / `@description` metadata tags in `vite.config.js`
  aligned when changing the product description.
- API-facing localization stays separate: requests use `Accept-Language`
  (`getApiLanguage()`), dates format with `navigator.language`
  (`formatDate()`), group/description fields switch on `getLocale()`.

## Versioning

Update the project version with every user-visible change. Follow Semantic
Versioning:

- **Major** (`X.0.0`) for incompatible behavior, storage migrations, or
  breaking changes that require user action.
- **Minor** (`0.X.0`) for new backward-compatible features or substantial
  enhancements.
- **Patch** (`0.0.X`) for bug fixes, styling adjustments, documentation,
  maintenance, and other backward-compatible small changes.

Keep the version synchronized in `package.json` and `package-lock.json`.
`CHANGELOG.md` versions with it: record every user-visible change under
`[Unreleased]`; when bumping the version, move those bullets into a new
`## [X.Y.Z] - YYYY-MM-DD` section (with a matching link reference at the
bottom) and leave `[Unreleased]` empty.
The userscript metadata is generated from `package.json`; run
`npm run build` after bumping the version to refresh both root artifacts.

## Build and verification

Requires Node.js 22.

```bash
npm install
npm run dev                # vite-plugin-monkey dev server (dev: prefix)
npm run build              # vite build + copy dist/ → root artifacts
npm run verify:artifacts   # fail if dist/ and root artifacts differ
npm run ci                 # build + verify (CI gate, also in GitHub Actions)
```

Build facts agents need to know:

- `vite.config.js` declares `entry: src/main.js`, the full `==UserScript==`
  block (names/descriptions in all locales, `match`, `connect`,
  `run-at: document-idle`, `noframes`), `server.prefix: 'dev:'`, and
  `build.fileName: steam-gamestatus.user.js` with `metaFileName: true`.
  Grants are auto-detected from `'$'` imports plus the CSS import.
- `scripts/copy-dist.mjs` copies `ARTIFACT_FILES` from `dist/` to root;
  `verify-artifacts.mjs` enforces byte identity (CI fails on drift).
- `dist/` and `node_modules/` are gitignored; `package-lock.json` is
  committed.

After every source, style, metadata, or version change, run `npm run build` so
the root install artifacts stay synchronized. Before finishing, run
`npm run ci` and check diagnostics for edited files.

## Debugging

- Hover a badge and read the tooltip footer links (API / GameStatus) to verify
  slug resolution; attempted slugs persist as entry `triedUrls` in GM storage.
- `gsAppId` / `gsObserved` / `gsTitle` attributes in the Elements panel show
  what each anchor resolved to; `gsPageProcessed` marks game-page anchors.
- Set cache hours to `0` (or Clear cache) to force live lookups while
  iterating; re-enable before shipping verification.
- Logic-only smoke tests run in Node without a DOM: pure modules
  (`utils/slug.js`, `utils/format.js` except `getApiLanguage`/`formatDate`,
  `i18n/locales`) import cleanly; `main.js` and feature modules need the
  userscript sandbox.

## Local testing

- **Violentmonkey:** `npm run build`, install the local root `.user.js` +
  enable Track local file; rebuild + reload Steam after edits.
- **Tampermonkey:** reinstall from file/URL, or temporary local server URLs
  (do not commit them).

## Do not

- Hand-edit `steam-gamestatus.user.js` or `steam-gamestatus.meta.js`.
- Commit `node_modules/`, `dist/`, or development-only update URLs.
- Call the GameStatus API by App ID only (slug resolution +
  `steam_prod_id` match is required).
- Scrape aggressively, retry indefinitely, or cache request failures as valid
  results.
- Bypass `loadGame()` / `enqueue()` for API traffic.
- Break carousel / multi-app capsule logic (wrong App ID or stacked badges).
- Break Steam navigation, header menus, or responsive layout.
- Imply affiliation with Valve, Steam, or GameStatus.info in docs or UI copy.
