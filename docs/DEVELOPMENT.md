# Development

Build, test, and release workflow for Steam GameStatus. Architecture details:
[ARCHITECTURE.md](ARCHITECTURE.md). Contributor rules and PR checklist:
[../CONTRIBUTING.md](../CONTRIBUTING.md).

## Requirements

Node.js 22 (see `.nvmrc`).

```bash
npm install
npm run dev      # userscript dev server
npm run build    # build + refresh root .user.js / .meta.js
npm run verify:artifacts  # check dist/ and root artifacts match
npm run ci       # build + verify (CI gate)
```

Edit files under `src/` and rebuild — the root `.user.js` / `.meta.js` files
are generated, never hand-edited.

## Local testing

### Violentmonkey

1. Clone this repository.
2. Run `npm install && npm run build`, then install from the local
   `steam-gamestatus.user.js` file.
3. Enable **Track local file** before closing the install dialog.
4. Edit `src/` in your IDE and rebuild — changes apply after a page reload.

### Tampermonkey

Tampermonkey does not track local files natively. Options:

- Reinstall the rebuilt file after each change, or
- Use a local HTTP server and temporarily point `@updateURL` / `@downloadURL`
  to `http://localhost:...` during development (do not commit local URLs).

## Configuration

Constants in `src/core/constants.js` can be adjusted:

| Constant | Default | Description |
|----------|---------|-------------|
| `MAX_CONCURRENT` | 2 | Parallel API requests |
| `REQUEST_DELAY_MS` | 75 ms | Delay between starting queued API tasks |
| `MAX_SLUG_ATTEMPTS` | 2 | Slug candidates tried per game lookup |
| `DEFAULT_SETTINGS.cacheHours` | 6 hours | Cache lifetime for all lookups (`0` disables) |
| `CACHE_HOURS_MAX` | 168 | Upper clamp for the cache duration setting |
| `CACHE_PERSIST_MS` | 1000 ms | Debounce interval for writing cache to storage |
| `CARD_ROOT_MARGIN` | `80px 0px` | How far ahead of the viewport to prefetch cards |
| `SCAN_DEBOUNCE_MS` | 450 ms | Debounce for DOM mutation rescans |
| `SCROLL_IDLE_MS` | 150 ms | Wait after scroll stops before hydrating cards |
| `HYDRATE_BATCH_SIZE` | 3 | Cards hydrated per animation frame |

API responses use the browser’s `Accept-Language` header (fallback `en-US`).
Dates are formatted with `navigator.language`.

## Releasing

1. Bump `version` in `package.json` (`npm install` refreshes the lockfile)
   and run `npm run build` to regenerate `steam-gamestatus.user.js` and
   `steam-gamestatus.meta.js`.
2. Add an entry to [`CHANGELOG.md`](../CHANGELOG.md).
3. Push to `main` (or create a GitHub Release).
