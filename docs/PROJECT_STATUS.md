# Project Status

## Project

- Name: UgPhone Help Center
- Local path: `C:\Users\OgCloud\Desktop\my-docs-project`
- GitHub repository: `Lucifer7012/my-docs-project`
- Public site: `https://lucifer7012.github.io/my-docs-project/`
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
- Game Support page with searchable compatibility list.

## Current Deployment State

- Calculator source and generated site files are committed on `main`.
- Calculator public site files are deployed to `gh-pages`.
- Latest deployed calculator feature: merge upgraded target expiry with existing target expiry.

## Known Local State

- `docs/support.md` and `site/support/index.html` have local uncommitted changes that are unrelated to the calculator work.
- These support changes were intentionally not included in calculator commits or `gh-pages` deployment.

## Maintenance Rules

- For every future project change, update:
  - `docs/CHANGELOG.md`
  - `docs/PROJECT_STATUS.md`, when current state changes
  - `C:\Users\OgCloud\Desktop\Codex-Worklog\WORKLOG.md`
- Do not record API keys, passwords, tokens, cookies, or other secrets.
