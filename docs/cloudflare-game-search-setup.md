# Cloudflare Game Search Setup

This project now includes a Cloudflare Pages Function for live game search:

* API route: `/api/game-search?q=your-query`
* Static site build command: `mkdocs build`
* Static site output directory: `site`

## 1. Cloudflare Pages

Create a Cloudflare Pages project and point it to this repository.

* Build command: `mkdocs build`
* Build output directory: `site`

Cloudflare will automatically detect the `functions/` directory and deploy the API route.

## 2. Required Environment Variables

The live search function does not require Google API keys anymore.

You only need this build variable in Cloudflare Pages:

* `PYTHON_VERSION=3.11`

## 3. Current Search Sources

The backend currently aggregates from:

* Google Play via direct web search parsing
* Apple App Store via iTunes Search API
* TapTap via search results link
* APKPure via search results link

## 4. Important Note

If Google Play changes their page structure later, the Cloudflare Function is the only place you need to update. The frontend page can stay the same.
