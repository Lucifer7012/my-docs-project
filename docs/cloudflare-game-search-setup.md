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

Add these environment variables in the Cloudflare Pages dashboard:

* `GOOGLE_CSE_API_KEY`
* `GOOGLE_CSE_CX`

## 3. Google Programmable Search Engine

Create a Google Programmable Search Engine and get:

* API key
* Search engine ID (`cx`)

Recommended setup:

* Search the entire web
* Use the API from the Cloudflare Function
* Let the function narrow specific domains with `siteSearch`

## 4. Current Search Sources

The backend currently aggregates from:

* Google Play via Google Custom Search JSON API
* Apple App Store via iTunes Search API
* TapTap via Google Custom Search JSON API domain filtering
* APKPure via Google Custom Search JSON API domain filtering

## 5. Important Note

If Google changes Custom Search availability later, the Cloudflare Function is the only place you need to swap the provider. The frontend page can stay the same.
