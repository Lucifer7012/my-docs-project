# Changelog

This file records feature changes, fixes, verification, and deployment notes for the UgPhone Help Center project.

Do not record API keys, passwords, tokens, cookies, or other secrets here.

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
