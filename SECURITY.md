# Security Policy

Steam GameStatus is a userscript that runs inside Steam pages with the
privileges granted by your userscript manager. It fetches public game data
from GameStatus.info and renders Steam-like badges and tooltips. This page
explains which versions are supported and how to report a security issue
privately.

## Supported versions

Only the latest released version is supported. Userscript managers update the
script automatically from the `@updateURL` / `@downloadURL` metadata, so keep
the installed version current.

| Version | Supported |
|---------|-----------|
| Latest release (`1.x`) | Yes |
| Older releases | No |

## Reporting a vulnerability

**Do not open a public issue for a security problem.** Instead, use GitHub's
private vulnerability reporting:

1. Open the repository's **Security** tab.
2. Click **Report a vulnerability** (direct link:
   <https://github.com/NemoKing1210/steam-gamestatus/security/advisories/new>).
3. Describe the issue and, if possible, include a proof of concept.

If private reporting is unavailable, open a regular issue asking for a private
contact channel — without disclosing any details of the vulnerability.

Please include:

- Script version (visible in the settings panel or `@version` in the installed
  file) and how it was installed (manager + browser versions).
- The affected Steam page URL or a minimal reproduction page.
- Steps to reproduce and the observed impact (data exposure, code execution,
  requests to unexpected hosts, etc.).
- Any suggested fix, if you have one.

### What to expect

- Acknowledgement of your report within **7 days**.
- An assessment and, for confirmed issues, a fix released as soon as
  reasonably possible.
- Credit in the release notes if you want it. Coordinated disclosure is
  appreciated: please give the project time to ship a fix before publishing
  details.

## Scope

In scope:

- Cross-site scripting or HTML/URL injection through API responses, Steam DOM
  text, or settings values rendered by badges, tooltips, or the settings panel.
- Requests to hosts outside the declared `@connect` list, or any way the
  script could be tricked into sending data to an attacker-controlled origin.
- Cache poisoning or persistence issues in userscript storage that could
  misattribute a game or execute untrusted content.
- Permission or metadata changes (`@grant`, `@connect`, `@match`, update URLs)
  that widen the script's access beyond what it needs.
- Supply-chain issues in the build or release artifacts (for example, a
  compromised dependency or a published `.user.js` that differs from source).

Out of scope:

- Accuracy, completeness, or freshness of game data from GameStatus.info.
- Vulnerabilities in Steam, GameStatus.info, your browser, or the userscript
  manager itself.
- Issues requiring an already-compromised browser profile, a malicious
  userscript manager, or a modified copy of the script.
- Feature requests, UI/UX suggestions, and self-XSS.

## Security model

- The script runs in the page context via your userscript manager. Its grants
  are limited to `GM_xmlhttpRequest`, `GM_getValue`, `GM_setValue`, and
  `GM_addStyle`.
- Network access is limited to `gamestatus.info` and `cdn.gamestatus.info`
  (declared with `@connect`) plus the Steam Store `appdetails` endpoint fetched
  same-origin. The script does not contact analytics, advertising, or other
  third-party services.
- Settings and the game-lookup cache are stored in your userscript manager's
  storage (`gs_steam_settings`, `gs_steam_cache_v5`). They never leave your
  browser except as API lookups to the hosts above.
- The settings panel is local UI; it is not a remote control surface, and the
  script does not load remote code, stylesheets, or fonts at runtime.
- All external strings and URLs rendered into the page are escaped through
  `src/utils/html.js`.

## Installing safely

Install only from the official raw GitHub URL documented in
[README.md](README.md). Avoid repackaged copies from third-party sites and
review the script in your userscript manager before enabling it if you are
unsure of its origin.

## License

This project is released under the [MIT License](LICENSE). This policy does
not grant any rights beyond that license.
