# Contributing to Steam GameStatus

Thanks for helping out. This project is a vanilla-JS userscript with a Vite
build — small surface, but Steam's DOM is full of traps, so please read the
workflow below before opening a pull request.

## Ground rules

- Be kind and stay on topic: one issue/PR per problem or feature.
- This project is **not affiliated** with Valve, Steam, or GameStatus.info.
  Do not add copy, badges, or metadata that imply otherwise.
- By contributing you agree your work is licensed under the repo's
  [MIT license](LICENSE).

## Prerequisites

- Node.js 22 (see `.nvmrc`) and npm.
- A userscript manager for testing: Violentmonkey (recommended, tracks local
  files) or Tampermonkey.
- Skim [AGENTS.md](AGENTS.md) — it documents the module layout, import
  direction, Steam DOM gotchas, and the settings/i18n contracts.

## Setup

```bash
git clone https://github.com/NemoKing1210/steam-gamestatus.git
cd steam-gamestatus
npm install
npm run ci   # build + verify artifacts; must pass before you start
```

## Development workflow

1. Create a branch from `main` (`feat/…`, `fix/…`, `docs/…`).
2. Edit files under `src/` only. **Never hand-edit** the generated
   `steam-gamestatus.user.js` / `steam-gamestatus.meta.js` — they are build
   output.
3. Rebuild and verify after every change:
   ```bash
   npm run build              # regenerates root .user.js / .meta.js
   npm run verify:artifacts   # dist/ ↔ root must match
   ```
4. Test on live Steam pages (store listings, search, wishlist, sale charts,
   and an `/app/{id}` game page — see "Testing checklist").
5. Run `npm run ci` before pushing.

### Conventions

- Vanilla JavaScript ESM; no frameworks, no TypeScript, no new dependencies
  without discussion.
- Import userscript APIs (`GM_xmlhttpRequest`, `GM_getValue`, …) from `'$'`.
- Respect the import direction `utils ← core ← api ← features`
  (details in [AGENTS.md](AGENTS.md)); route all API traffic through
  `loadGame()` so cache + queue + dedup stay in one path.
- Keep injected UI Steam-native (`.app_tag`-like badges, dark tooltips) and
  escape all external text/URLs (`utils/html.js`).
- Keep `@connect`, `@match`, and GM grants minimal — do not expand them
  "just in case".

### Localization

UI strings live in `src/i18n/locales/*.js` (one file per locale). Every new
user-facing string must be added to **all ten** locales (`en`, `ru`, `zh`,
`es`, `pt`, `de`, `fr`, `ja`, `ko`, `pl`) with identical key order — machine
translation is acceptable for a first pass, mark it as such in the PR.
If you change what the script does (product description), update the
localized `@name` / `@description` tags in `vite.config.js` too.

### Versioning and changelog

- Maintainers bump versions at release time, but your PR should include a
  `CHANGELOG.md` entry under `## [Unreleased]` (Keep a Changelog format:
  `Added` / `Changed` / `Fixed`).
- Version numbers follow SemVer (`package.json` is the source of truth):
  incompatible/storage changes → major, features → minor, fixes/docs →
  patch.

## Testing checklist

Mention in the PR what you covered:

- [ ] `npm run ci` passes.
- [ ] Root `.user.js` / `.meta.js` regenerated (`git status` shows them
      updated, `verify:artifacts` green).
- [ ] Store listing cards show correct badges (spot-check search, wishlist,
      and a sale/chart page — App IDs must match the card, no stacked
      badges on multi-app capsules).
- [ ] Featured carousel: badge visible only on the focused slide.
- [ ] Game page (`/app/{id}`) header chip renders next to the hub links.
- [ ] Tooltip opens on hover/focus with cover, chips, scores, hardware where
      available; missing games show "not in database" (or stay unmarked when
      that setting is off).
- [ ] Settings panel: changes persist across reload; header dot reflects
      customized state; cache clear reports the count.
- [ ] New strings appear in all ten locales (or the gap is noted).

## Reporting issues

Include: script version (`@version` in the installed file or the settings
panel), manager + version, browser + version, the exact Steam URL, what you
expected vs. what happened, and a screenshot where visual. For wrong/missing
game data, open the badge tooltip and paste the "Checked URLs" footer — it
shows exactly which API lookups were attempted.

## Pull request process

1. Fork, branch, commit with clear messages.
2. Keep PRs focused; unrelated drive-by refactors will be asked to split out.
3. Fill in the testing checklist above.
4. A maintainer reviews; CI must be green. Version bumps and releases are
   handled by maintainers unless asked otherwise.
