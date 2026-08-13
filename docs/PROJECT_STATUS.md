# Project Status

## Project

- Name: UgPhone Help Center
- Local path: `C:\Users\OgCloud\Desktop\my-docs-project`
- GitHub repository: `Lucifer7012/my-docs-project`
- Primary public site: `https://my-docs-project.pages.dev/`
- Legacy GitHub Pages redirect URL: `https://lucifer7012.github.io/my-docs-project/`
- Source branch: `main`
- GitHub Pages branch: `gh-pages`

## Current Features

- Rate table pages for equipment upgrade rates.
- Equipment Upgrade Calculator:
  - calculates upgraded remaining duration from remaining days
  - calculates upgraded expiry time from current device expiry time
  - supports Standard and Promotion rates
  - enforces minimum 2 days remaining before upgrade
  - can merge upgraded target-device time with an existing target-device expiry time
- Date Add Days Calculator:
  - calculates a new datetime after adding a number of days to a starting datetime
  - accepts `YYYY-MM-DD HH:MM:SS` input
  - includes the example `2026-07-15 07:40:00 + 180 days = 2027-01-11 07:40:00`
- Game Support page with a searchable compatibility list loaded from a dedicated JSON data file.
- Game Search Tool:
  - runs on a separate page from the Game Support list
  - uses a Cloudflare Pages Function backend at `/api/game-search`
  - supports searching by game title, alias, shorthand, and package name
  - returns title, icon, package name, and download/search links for Google Play, App Store, TapTap, and APKPure
  - includes curated mappings for region-specific releases, delisted titles, and frequently ambiguous searches
  - supports copying the package name, copying the icon, and copying the icon URL from result cards

## Current Deployment State

- Source docs, static assets, and Cloudflare Functions are committed on `main`.
- The live Game Search Tool is deployed through Cloudflare Pages.
- GitHub Pages now serves as a legacy redirect entry point to the Cloudflare Pages site instead of a separately maintained static copy.
- Latest calculator feature: Date Add Days Calculator.
- Latest deployed support refactor: the support page now loads games from `docs/data/supported-games.json` in source and `data/supported-games.json` in the published site.
- Latest support list change: added `SoulGuardians 2 PLUS - GranAge`.
- Latest related work:
  - source page: `docs/date-add-days.md`
  - generated page: `site/date-add-days/index.html`
- Latest related commits:
  - `a3280de` on `main` - add date add days calculator page
  - `e5d3491` on `gh-pages` - deploy date add days calculator
- Latest search-tool source files:
  - `docs/game-search.md`
  - `docs/_headers`
  - `functions/api/game-search.js`
  - `functions/data/curated-game-overrides.js`
- Latest search-tool fixes:
  - stronger Google Play fallback title validation
  - package-name search support
  - cache-reduction headers and request timestamping
  - replacement of screenshot-derived icons with public icon sources
  - expanded curated Vietnam martial-arts/MMORPG mappings for local-title searches
  - curated global `Roblox` fallback to avoid live Play-search failures on the plain `roblox` query
  - graceful fallback when Google Play search returns `429` or temporary `5xx` errors
  - curated `Rasalas` and `라살라스` mappings for the global and Korean package variants
  - graceful fallback when external search fetches fail before an HTTP response is returned
- Project maintenance docs are stored in `docs/` but excluded from the public MkDocs site build.

## Known Local State

- The supported games list now lives in `docs/data/supported-games.json`.
- `docs/support.md` now contains only the page UI and search logic.
- The Date Add Days Calculator source now lives in `docs/date-add-days.md`.
- The Game Search Tool frontend lives in `docs/game-search.md`.
- The live search backend lives in `functions/api/game-search.js`.
- Curated search aliases, package matches, and region overrides live in `functions/data/curated-game-overrides.js`.
- Cache rules for the Game Search page live in `docs/_headers`.
- The curated override list now includes additional Vietnam hot-game aliases such as `Kiem Chi Giang Ho: Khai Thien`, `Tan Thien Long Mobile`, `Thien Long Bat Bo VNG`, and `Giang Ho: Bat Phai Phan Tranh`.
- The curated override list now also includes a stable global `Roblox` entry for `com.roblox.client`.
- The curated override list now also includes `Rasalas` (`com.lepor.aos.rasalas.asean`) and `라살라스` (`com.itoxi.aos.rasalas`).

### Latest Follow-up

- Added `카발RED` (`com.estgames.cabalr.kr.ls`) as a Korean-title-only curated mapping.

### Latest Follow-up

- Added `เทียนหลง Origin - ปลุกยุทธภพ` (`com.thedragons.and`) so title search and package search return the same game.

## Maintenance Rules

- For every future project change, update:
  - `docs/CHANGELOG.md`
  - `docs/PROJECT_STATUS.md`, when current state changes
  - `C:\Users\OgCloud\Desktop\Codex-Worklog\WORKLOG.md`
- Do not record API keys, passwords, tokens, cookies, or other secrets.
