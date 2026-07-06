# Changelog

This file records feature changes, fixes, verification, and deployment notes for the UgPhone Help Center project.

Do not record API keys, passwords, tokens, cookies, or other secrets here.

## 2026-07-06

### Changed

- Added `MIR4` to the Game Support compatibility list.

### Verification

- Confirmed `docs/data/supported-games.json` and `site/data/supported-games.json` both contain `MIR4`.

## 2026-06-29

### Changed

- Updated the Game Support data list:
  - removed `Free fire`
  - added `Pokémon Champions`

### Verification

- Confirmed `docs/data/supported-games.json` and `site/data/supported-games.json` now contain `Pokémon Champions`.
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

## 2026-05-27

### Added

- Added supported games to the Game Support compatibility list:
  - `Let's Go Legends(레츠고레전드)`
  - `Zeny Classic`
  - `rasalas/라살라스`
  - `Royale`

### Verification

- Confirmed the supported games array syntax is valid.
- Rebuilt the MkDocs site so the generated support page and search index include the updated game list.
- Excluded project maintenance records from the public MkDocs build with `exclude_docs`.

### Commits

- `4c7dc7c` - Update supported games list
- `615644b` - Deploy supported games update
