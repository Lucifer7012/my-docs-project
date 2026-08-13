# Changelog

This file records feature changes, fixes, verification, and deployment notes for the UgPhone Help Center project.

Do not record API keys, passwords, tokens, cookies, or other secrets here.

## 2026-08-13

### Fixed

- Added a curated Thailand title mapping for package `com.thedragons.and` so the full game title now resolves the same result as package-name search.

### Verification

- Confirmed `com.thedragons.and` resolves to package `com.thedragons.and`.
- Confirmed the full Thailand title resolves to the same curated result instead of falling back to no match.

## 2026-08-05

### Fixed

- Added curated `Rasalas` and `라살라스` mappings so both names resolve to their intended Google Play packages instead of failing live lookup.
- Hardened the Game Search backend so network-level fetch failures against Google Play, DuckDuckGo, or the App Store degrade gracefully instead of returning a `500` error.

### Verification

- Confirmed `rasalas` resolves to `Rasalas` with package `com.lepor.aos.rasalas.asean`.
- Confirmed `라살라스` resolves to `라살라스` with package `com.itoxi.aos.rasalas`.
- Confirmed a missing query now returns a no-result response instead of `fetch failed`.

### Follow-up

- Limited the `카발RED` mapping to the Korean title only, while keeping package `com.estgames.cabalr.kr.ls`.

### Follow-up Verification

- Confirmed `카발RED` resolves to package `com.estgames.cabalr.kr.ls`.

## 2026-07-30

### Fixed

- Added a curated global `Roblox` mapping so searching `roblox` no longer depends on a live Google Play search response.
- Changed the Game Search backend so Google Play search `429` and temporary `5xx` responses degrade gracefully instead of returning a full-page search error.

### Verification

- Confirmed the curated override list now includes:
  - `Roblox`
  - package `com.roblox.client`
- Confirmed the backend no longer throws an error immediately when the Google Play search endpoint responds with `429`.

## 2026-07-29

### Changed

- Added `SoulGuardians 2 PLUS - GranAge` to the Game Support compatibility list.

### Verification

- Confirmed `docs/data/supported-games.json` and `site/data/supported-games.json` both contain `SoulGuardians 2 PLUS - GranAge`.

## 2026-07-27

### Changed

- Renamed the supported game entry `Three Kingdoms All-star : Idle` to `Three Kingdoms All-Star : RPG` in the Game Support compatibility list.

### Verification

- Confirmed `docs/data/supported-games.json` and `site/data/supported-games.json` both contain `Three Kingdoms All-Star : RPG`.
- Confirmed neither file still contains `Three Kingdoms All-star : Idle`.

## 2026-07-21

### Changed

- Updated the Game Support compatibility list:
  - split the combined CookieRun entry into:
    - `CookieRun India: Party Game`
    - `Cookierun：tower of adventures`
    - `Cookie Run: Kingdom`
  - added:
    - `DK Mobile:Reborn`
    - `Albion Online - Sandbox MMORPG`
    - `Evil Sword`
    - `chaos world`
    - `CookieRun: OvenSmash`
    - `CookieRun Classic`
    - `SOL: enchant`
    - `Kingshot`
    - `Whiteout Survival`
- Replaced the legacy GitHub Pages site behavior with redirect entry pages that send visitors to the primary Cloudflare Pages site at `https://my-docs-project.pages.dev/`.

### Verification

- Confirmed `docs/data/supported-games.json` and `site/data/supported-games.json` both contain the three separate CookieRun titles.
- Confirmed both files contain all nine newly added supported games.
- Confirmed neither file still contains the old combined CookieRun entry.
- Confirmed the legacy GitHub Pages URLs now use redirect pages so old links can forward to the matching `pages.dev` route.

## 2026-07-20

### Added

- Added another batch of curated Vietnam martial-arts/MMORPG mappings for the Game Search Tool, including:
  - `Kiem Chi Giang Ho: Khai Thien`
  - `Tan Thien Long Mobile`
  - `Thien Long Bat Bo VNG`
  - `Thien Long Bat Bo 2 - VNG`
  - `Giang Ho: Bat Phai Phan Tranh`
  - `Nhat Kiem Giang Ho Mobile`
  - `Giang Ho Ky Ngo - Vplay`

### Verification

- Confirmed local curated matching works for representative queries including:
  - `Kiem Chi Giang Ho`
  - `kiem chi giang ho`
  - `Tan Thien Long Mobile`
  - `Thien Long Bat Bo 2`
  - `Nhat Kiem Giang Ho`
  - `giang ho ky ngo`
  - `com.xyvn.az`
  - `com.vtcmobile.ghbp`

## 2026-07-09

### Added

- Added a new `Date Add Days Calculator` page at `docs/date-add-days.md`.
- Added a simple datetime tool that calculates the result after adding a number of days to a starting datetime.
- Pre-filled the page with the example `2026-07-15 07:40:00 + 180 days = 2027-01-11 07:40:00`.
- Added the new calculator page to the MkDocs navigation and homepage quick links.
- Added a dedicated `Game Search Tool` page at `docs/game-search.md`.
- Added a Cloudflare Pages Function backend at `functions/api/game-search.js` with live route `/api/game-search?q=...`.
- Added a curated override dataset at `functions/data/curated-game-overrides.js` for exact package-name matches, region variants, delisted games, and shorthand aliases.
- Added direct package-name search support, icon copy actions, icon-link copy actions, and multi-channel download links in search results.
- Added curated mappings for frequently requested searches including:
  - `Pixel Heroes Idle`
  - `Rogue with the Dead`
  - `ONE PIECE Bounty Rush`
  - `ARES / Ares TW`
  - `TOSM Extreme / Tree of Savior M: Extreme`

### Verification

- Confirmed by calculation that `2026-07-15 07:40:00 + 180 days` returns `2027-01-11 07:40:00`.
- Rebuilt the MkDocs site so the generated page is available at `site/date-add-days/index.html`.
- Confirmed the generated site contains the new page title `Date Add Days Calculator`.
- Confirmed the live API returns curated results for:
  - `Pixel Heroes Idle`
  - `com.ztogames.ppki`
  - `Ares TW / Chinese-region title`
  - `Tree of Savior M: Extreme`
- Confirmed direct package-name lookup returns the expected curated package match instead of a loose Google Play fallback.

### Changed

- Simplified the Game Search page layout so the search box and results area are the main focus, with helper content collapsed.
- Updated the search flow so submitting a query scrolls the user directly to the results area.
- Replaced screenshot-derived local icon files with public-source icons, primarily APKPure/store-hosted icon URLs.
- Switched the live search deployment workflow from static-only GitHub Pages behavior to Cloudflare Pages with Functions support.

### Fixed

- Restored `Game Search Tool` to the shared MkDocs navigation after hiding it from the source nav also removed the page entry from `https://my-docs-project.pages.dev/game-search/`.
- Restored the homepage quick link for `Game Search Tool` so the Cloudflare Pages site keeps a direct entry to the live search page.
- Tightened Google Play fallback title matching so near-name mismatches are rejected instead of being shown as the best result.
- Reduced stale-result problems by adding cache-busting requests and `_headers` rules for the Game Search page and API route.
- Fixed icon copy behavior so the UI gives clearer feedback when the browser only allows copying the icon URL.
- Fixed several region-version searches that previously returned the wrong global app or no result at all.

### Commits

- `d855165` - Add Cloudflare-backed game search tool
- `fc24347` - Remove Google CSE dependency from game search
- `4d60b6a` - Support direct package name search
- `d7e2522` - Tighten Google Play title matching
- `607fb25` - Reduce stale cache on game search page
- `2ff1838` - Add ARES TW curated search mapping
- `375e153` - Add TOSM Extreme curated search mapping

## 2026-07-06

### Changed

- Added `MIR4` to the Game Support compatibility list.

### Verification

- Confirmed `docs/data/supported-games.json` and `site/data/supported-games.json` both contain `MIR4`.

## 2026-06-29

### Changed

- Updated the Game Support data list:
  - removed `Free fire`
  - added `Pokemon Champions`

### Verification

- Confirmed `docs/data/supported-games.json` and `site/data/supported-games.json` now contain `Pokemon Champions`.
- Confirmed neither file contains `Free fire`.

## 2026-06-25

### Changed

- Refactored the Game Support page so the searchable game list is loaded from `docs/data/supported-games.json` instead of being hardcoded inside `docs/support.md`.
- Kept the page search logic in `docs/support.md` and made the data format extensible:
  - plain string entries work for simple game names
  - object entries with `name` and optional `aliases` can be added later without changing page code
- Improved matching so searches ignore spacing and punctuation more reliably.

### Verification

- Extracted the existing supported games list and migrated it into `docs/data/supported-games.json`.
- Confirmed the support page script now renders the full list from the JSON data source and searches against the loaded entries.
- Synced the generated static support page and JSON data under `site/` for deployment.
- Deployed the updated support page and JSON data file to `gh-pages` for public testing.

### Commits

- `dec36a9` - Refactor game support data source
- `794ae37` - Deploy game support JSON data source

## 2026-05-27

### Added

- Added supported games to the Game Support compatibility list:
  - `Let's Go Legends`
  - `Zeny Classic`
  - `rasalas`
  - `Royale`

### Verification

- Confirmed the supported games array syntax is valid.
- Rebuilt the MkDocs site so the generated support page and search index include the updated game list.
- Excluded project maintenance records from the public MkDocs build with `exclude_docs`.

### Commits

- `4c7dc7c` - Update supported games list
- `615644b` - Deploy supported games update

## 2026-05-20

### Added

- Added `Expiry Time` mode to the Equipment Upgrade Calculator.
- Added `Existing Target Expiry Time` input in expiry mode so an upgraded target device duration can be merged with an already existing target device.
- Added Standard and Promotion result cards that show:
  - upgraded duration
  - upgraded expiry time
  - existing target remaining time, when provided
  - merged duration, when provided
  - final merged expiry time, when provided
- Added 2-day minimum remaining-time validation for both remaining-days input and expiry-time input.

### Fixed

- Removed incorrectly uploaded root-level files from GitHub:
  - `calculator.md`
  - `index.html`
  - `search_index.json`
  - `sitemap.xml.gz`
- Deployed calculator changes to the actual GitHub Pages branch, `gh-pages`, after confirming the public site was not served from `main`.

### Verification

- Verified by script that:
  - `1.5` remaining days is rejected.
  - `20` remaining days still returns Standard `16d 0h` and Promotion `18d 0h`.
  - expiry mode without an existing target expiry returns upgraded expiry times.
  - expiry mode with an existing target expiry returns merged final expiry times.
- Confirmed the public GitHub Pages HTML contains `Existing Target Expiry Time` and `Merged expiry`.

### Commits

- `58b7f44` - Update upgrade calculator expiry mode
- `96686bd` - Deploy calculator expiry mode
- `53182fd` - Add target expiry merge calculator
- `3a451ee` - Deploy target expiry merge calculator
