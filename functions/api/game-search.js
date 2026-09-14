import { CURATED_GAME_OVERRIDES } from "../data/curated-game-overrides.js";

// Deployment marker: 2026-08-05 rasalas refresh

const GOOGLE_PLAY_HOST = "play.google.com";
const APPLE_SEARCH_URL = "https://itunes.apple.com/search";
const EXTERNAL_FETCH_TIMEOUT_MS = 6000;

// Play search is country-scoped. Search several markets so regional listings
// are not hidden by the US result set.
const PLAY_LOCALES = [
    { id: "us", hl: "en_US", gl: "US", language: "en" },
    { id: "kr", hl: "ko", gl: "KR", language: "ko" },
    { id: "th", hl: "th", gl: "TH", language: "th" },
    { id: "vn", hl: "vi", gl: "VN", language: "vi" },
    { id: "jp", hl: "ja", gl: "JP", language: "ja" },
    { id: "tw", hl: "zh_TW", gl: "TW", language: "zh-TW" },
    { id: "sg", hl: "en_SG", gl: "SG", language: "en" },
    { id: "my", hl: "en_MY", gl: "MY", language: "en" }
];

const ARCHIVE_HOSTS = new Set([
    "apkpure.com",
    "www.apkpure.com",
    "appbrain.com",
    "www.appbrain.com",
    "uptodown.com",
    "www.uptodown.com"
]);

export async function onRequestGet(context) {
    const requestUrl = new URL(context.request.url);
    const query = (requestUrl.searchParams.get("q") || "").trim();

    if (!query) {
        return json(
            {
                error: "Missing query parameter. Use /api/game-search?q=game-name."
            },
            400
        );
    }

    if (query.length < 2) {
        return json(
            {
                error: "Query is too short. Please enter at least 2 characters."
            },
            400
        );
    }

    try {
        if (isLikelyPackageName(query)) {
            const curatedPackageOverride = findCuratedOverrideByPackage(query);
            if (curatedPackageOverride) {
                const curatedPackageResult = await resolveCuratedResult(curatedPackageOverride, query);

                return json(
                    {
                        query,
                        generatedAt: new Date().toISOString(),
                        message: `Best match found for "${query}".`,
                        result: curatedPackageResult,
                        results: [curatedPackageResult]
                    },
                    200
                );
            }

            const directPackageResult = await resolveDirectPackageLookup(query);
            if (directPackageResult) {
                return json(
                    {
                        query,
                        generatedAt: new Date().toISOString(),
                        message: `Best match found for "${query}".`,
                        result: directPackageResult,
                        results: [directPackageResult]
                    },
                    200
                );
            }

            const normalizedPackageQuery = normalizePackageName(query);
            if (normalizedPackageQuery !== query) {
                const normalizedCuratedOverride = findCuratedOverrideByPackage(normalizedPackageQuery);
                if (normalizedCuratedOverride) {
                    const normalizedCuratedResult = await resolveCuratedResult(normalizedCuratedOverride, normalizedPackageQuery);

                    return json(
                        {
                            query,
                            generatedAt: new Date().toISOString(),
                            message: `Best match found for "${query}".`,
                            result: normalizedCuratedResult,
                            results: [normalizedCuratedResult]
                        },
                        200
                    );
                }

                const normalizedPackageResult = await resolveDirectPackageLookup(normalizedPackageQuery);
                if (normalizedPackageResult) {
                    return json(
                        {
                            query,
                            generatedAt: new Date().toISOString(),
                            message: `Best match found for "${query}".`,
                            result: normalizedPackageResult,
                            results: [normalizedPackageResult]
                        },
                        200
                    );
                }
            }
        }

        const curatedOverride = findCuratedOverride(query);
        if (curatedOverride) {
            const curatedResult = await resolveCuratedResult(curatedOverride, query);

            return json(
                {
                    query,
                    generatedAt: new Date().toISOString(),
                    message: `Best match found for "${query}".`,
                    result: curatedResult,
                    results: [curatedResult]
                },
                200
            );
        }

        const candidates = await searchGooglePlayCandidates(query);

        if (!candidates.length) {
            const archiveResults = await searchArchiveResults(query);
            if (archiveResults.length) {
                const renderedArchiveResults = archiveResults.map(buildLiveResult);
                return json(
                    {
                        query,
                        generatedAt: new Date().toISOString(),
                        message: `${renderedArchiveResults.length} archive match${renderedArchiveResults.length === 1 ? "" : "es"} found for "${query}".`,
                        result: renderedArchiveResults[0],
                        results: renderedArchiveResults
                    },
                    200
                );
            }

            return json(
                {
                    query,
                    generatedAt: new Date().toISOString(),
                    message: "No Google Play match was found for this query.",
                    result: null,
                    results: []
                },
                200
            );
        }

        const rankedResults = await resolveGooglePlayResults(query, candidates);
        const bestResult = rankedResults[0];

        if (!bestResult) {
            const archiveResults = await searchArchiveResults(query);
            if (archiveResults.length) {
                const renderedArchiveResults = archiveResults.map(buildLiveResult);
                return json(
                    {
                        query,
                        generatedAt: new Date().toISOString(),
                        message: `${renderedArchiveResults.length} archive match${renderedArchiveResults.length === 1 ? "" : "es"} found for "${query}".`,
                        result: renderedArchiveResults[0],
                        results: renderedArchiveResults
                    },
                    200
                );
            }

            return json(
                {
                    query,
                    generatedAt: new Date().toISOString(),
                    message: "No valid Google Play result could be resolved.",
                    result: null,
                    results: []
                },
                200
            );
        }

        const results = await Promise.all(
            rankedResults.slice(0, 5).map(async (entry) => ({
                ...entry,
                appStoreMatch: await searchAppStore(cleanPlayTitle(entry.title || query), entry.locale?.gl || "US")
            }))
        );
        const renderedResults = results.map(buildLiveResult);

        return json(
            {
                query,
                generatedAt: new Date().toISOString(),
                message: `${renderedResults.length} match${renderedResults.length === 1 ? "" : "es"} found for "${query}".`,
                result: renderedResults[0],
                results: renderedResults
            },
            200
        );
    } catch (error) {
        return json(
            {
                error: error instanceof Error ? error.message : "Unexpected search failure."
            },
            500
        );
    }
}

function buildLiveResult(entry) {
    const title = cleanPlayTitle(entry.title || entry.packageName);
    const channels = dedupeChannels([
        {
            name: entry.sourceName || "Google Play",
            url: entry.url,
            note: entry.locale
                ? `Package: ${entry.packageName} · ${entry.locale.gl} version`
                : `Package: ${entry.packageName}`
        },
        entry.appStoreMatch
            ? {
                name: "App Store",
                url: entry.appStoreMatch.trackViewUrl,
                note: entry.appStoreMatch.bundleId || entry.appStoreMatch.trackName
            }
            : null,
        entry.website
            ? {
                name: "Official Site",
                url: entry.website,
                note: "Developer website"
            }
            : null,
        {
            name: "TapTap Search",
            url: `https://www.taptap.io/search/${encodeURIComponent(title)}?region=us`,
            note: "Search results page"
        },
        {
            name: "APKPure Search",
            url: `https://apkpure.com/search?q=${encodeURIComponent(entry.packageName || title)}`,
            note: "Search results page"
        }
    ]);

    return {
        title,
        packageName: entry.packageName,
        icon: entry.icon || (entry.appStoreMatch ? entry.appStoreMatch.artworkUrl512 : null),
        summary: summarizeText(entry.description || ""),
        matchSource: entry.locale ? `Google Play ${entry.locale.gl} Search` : "Google Play Web Search",
        channels,
        related: entry.related || []
    };
}

async function resolveCuratedResult(override, query) {
    const playUrl = override.googlePlayUrl || buildPlayDetailsUrl(override.packageName);
    const playMeta = override.skipPlayMetadata ? {} : await fetchPlayMetadata(playUrl);
    const title = cleanPlayTitle(playMeta.title || override.title || query);
    const channels = dedupeChannels([
        override.hideGooglePlay
            ? null
            : {
                name: override.googlePlayLabel || "Google Play",
                url: playUrl,
                note: override.googlePlayNote || `Package: ${override.packageName}`
            },
        override.officialSite
            ? {
                name: "Official Site",
                url: override.officialSite,
                note: "Official brand site"
            }
            : null,
        override.appStoreUrl
            ? {
                name: "App Store",
                url: override.appStoreUrl,
                note: override.appStoreNote || "Official iOS page"
            }
            : null,
        ...(Array.isArray(override.channels) ? override.channels : []),
        {
            name: "TapTap Search",
            url: `https://www.taptap.io/search/${encodeURIComponent(title)}?region=us`,
            note: "Search results page"
        },
        {
            name: "APKPure Search",
            url: `https://apkpure.com/search?q=${encodeURIComponent(override.packageName)}`,
            note: "Search results page"
        }
    ]);

    return {
        title,
        packageName: override.packageName,
        icon: playMeta.icon || override.icon || null,
        summary: summarizeText(playMeta.description || override.summary || ""),
        matchSource: "Curated Alias Match",
        channels,
        related: override.related || []
    };
}

async function searchGooglePlayCandidates(query) {
    const locales = rankPlayLocales(query);
    const variants = buildSearchQueryVariants(query);
    const batches = locales.flatMap((locale) => variants.map((searchTerm) => ({ locale, searchTerm })));
    const responses = await Promise.all(batches.map((batch) => fetchPlaySearchBatch(batch)));
    const candidates = new Map();

    for (const batch of responses) {
        for (const [index, packageName] of batch.packageNames.entries()) {
            const key = packageName.toLowerCase();
            const previous = candidates.get(key);
            const candidate = {
                packageName,
                locale: batch.locale,
                rank: index,
                url: buildPlayDetailsUrl(packageName, batch.locale)
            };

            if (!previous || compareCandidateSearchSignal(candidate, previous, query) < 0) {
                candidates.set(key, candidate);
            }
        }
    }

    const output = [...candidates.values()];
    if (output.length < 8) {
        const webIds = await searchWebDiscoveredPlayPackageIds(query);
        for (const packageName of webIds) {
            const key = packageName.toLowerCase();
            if (!candidates.has(key)) {
                output.push({
                    packageName,
                    locale: null,
                    rank: 20,
                    url: buildPlayDetailsUrl(packageName)
                });
            }
            if (output.length >= 12) {
                break;
            }
        }
    }

    return output.slice(0, 12);
}

async function fetchPlaySearchBatch({ locale, searchTerm }) {
    const searchUrl = `https://${GOOGLE_PLAY_HOST}/store/search?q=${encodeURIComponent(searchTerm)}&c=apps&hl=${encodeURIComponent(locale.hl)}&gl=${encodeURIComponent(locale.gl)}`;

    try {
        const response = await fetchWithTimeout(searchUrl, {
            headers: {
                "accept-language": `${locale.language},en;q=0.8`
            }
        });
        if (!response.ok) {
            return { locale, packageNames: [] };
        }

        return {
            locale,
            packageNames: extractPlayPackageIds(await response.text())
        };
    } catch {
        return { locale, packageNames: [] };
    }
}

function compareCandidateSearchSignal(left, right, query) {
    const localeRank = (candidate) => rankPlayLocales(query).findIndex((entry) => entry.id === candidate.locale?.id);
    const leftSignal = (left.rank * 10) + Math.max(0, localeRank(left));
    const rightSignal = (right.rank * 10) + Math.max(0, localeRank(right));
    return leftSignal - rightSignal;
}

async function searchWebDiscoveredPlayPackageIds(query) {
    const discoveredIds = [];
    const seen = new Set();

    for (const searchTerm of buildSearchQueryVariants(query)) {
        const webSearchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(searchTerm)}`;
        let response;

        try {
            response = await fetchWithTimeout(webSearchUrl, {
                headers: {
                    "accept-language": "en-US,en;q=0.9",
                    "user-agent": "Mozilla/5.0"
                }
            });
        } catch {
            continue;
        }

        if (!response.ok) {
            continue;
        }

        const html = await response.text();
        const urls = extractUrlsFromDuckDuckGoHtml(html);

        for (const url of urls) {
            const packageName = extractPackageNameFromUrl(url);
            if (!packageName || seen.has(packageName)) {
                continue;
            }

            seen.add(packageName);
            discoveredIds.push(packageName);

            if (discoveredIds.length >= 8) {
                return discoveredIds;
            }
        }
    }

    return discoveredIds;
}

async function resolveDirectPackageLookup(packageName) {
    const packageCandidates = await Promise.all(
        rankPlayLocales(packageName).map(async (locale) => ({
            locale,
            url: buildPlayDetailsUrl(packageName, locale),
            metadata: await fetchPlayMetadata(buildPlayDetailsUrl(packageName, locale))
        }))
    );
    const playCandidate = packageCandidates.find((candidate) =>
        candidate.metadata.title || candidate.metadata.icon || candidate.metadata.description
    );
    const archiveMetadata = playCandidate ? {} : await fetchArchivePackageMetadata(packageName);
    const playMeta = playCandidate?.metadata || archiveMetadata;
    const playUrl = playCandidate?.url || buildPlayDetailsUrl(packageName);
    const title = cleanPlayTitle(playMeta.title || archiveMetadata.title || packageName);

    // Even if a listing was delisted, the package itself is still useful to
    // the user. Return an archive-backed or package-only result instead of
    // dropping the lookup completely.

    const appStoreMatch = await searchAppStore(title, playCandidate?.locale?.gl || "US");
    const channels = dedupeChannels([
        {
            name: "Google Play",
            url: playUrl,
            note: `Package: ${packageName}${playCandidate?.locale ? ` · ${playCandidate.locale.gl} version` : " · page may be unavailable in the current region"}`
        },
        appStoreMatch
            ? {
                name: "App Store",
                url: appStoreMatch.trackViewUrl,
                note: appStoreMatch.bundleId || appStoreMatch.trackName
            }
            : null,
        playMeta.website
            ? {
                name: "Official Site",
                url: playMeta.website,
                note: "Developer website"
            }
            : null,
        archiveMetadata.archiveUrl
            ? {
                name: "Archive Listing",
                url: archiveMetadata.archiveUrl,
                note: "Archived Android listing"
            }
            : null,
        {
            name: "TapTap Search",
            url: `https://www.taptap.io/search/${encodeURIComponent(title)}?region=us`,
            note: "Search results page"
        },
        {
            name: "APKPure Search",
            url: `https://apkpure.com/search?q=${encodeURIComponent(packageName)}`,
            note: "Search results page"
        }
    ]);

    return {
        title,
        packageName,
        icon: playMeta.icon || (appStoreMatch ? appStoreMatch.artworkUrl512 : null),
        summary: summarizeText(playMeta.description || ""),
        matchSource: playCandidate
            ? `Direct Package Lookup · Google Play ${playCandidate.locale?.gl || ""}`.trim()
            : archiveMetadata.source || "Package Lookup",
        channels,
        related: []
    };
}

function extractPlayPackageIds(html) {
    const ids = [];
    const seen = new Set();
    const regex = /\/store\/apps\/details\?[^"'<>\s]*?\bid=([a-zA-Z0-9._]+)/g;
    let match;

    while ((match = regex.exec(html)) !== null) {
        const packageName = match[1];
        if (!packageName || seen.has(packageName)) {
            continue;
        }
        seen.add(packageName);
        ids.push(packageName);
    }

    return ids;
}

function extractUrlsFromDuckDuckGoHtml(html) {
    const urls = [];
    const seen = new Set();
    const regex = /uddg=([^"'<>\s]+)/g;
    let match;

    while ((match = regex.exec(html)) !== null) {
        const encodedUrl = String(match[1] || "")
            .split("&amp;rut=")[0]
            .split("&rut=")[0]
            .trim();
        let rawUrl;
        try {
            rawUrl = decodeURIComponent(encodedUrl).replace(/&amp;/g, "&").trim();
        } catch {
            rawUrl = encodedUrl.replace(/&amp;/g, "&").trim();
        }
        if (!rawUrl || seen.has(rawUrl)) {
            continue;
        }

        seen.add(rawUrl);
        urls.push(rawUrl);
    }

    return urls;
}

function extractPackageNameFromUrl(value) {
    try {
        const url = new URL(value);
        if (url.hostname !== GOOGLE_PLAY_HOST || !url.pathname.startsWith("/store/apps/details")) {
            return "";
        }

        return url.searchParams.get("id") || "";
    } catch {
        return "";
    }
}

async function resolveGooglePlayResults(query, candidates) {
    const queryTokens = normalizeText(query).split(" ").filter(Boolean);
    const preferredLocaleIds = new Set(rankPlayLocales(query).slice(0, 3).map((locale) => locale.id));
    const detailResults = await Promise.all(
        candidates.map(async (candidate) => {
            const details = await fetchPlayMetadata(candidate.url);
            const title = cleanPlayTitle(details.title || candidate.packageName);
            const strongTitleMatch = isStrongTitleMatch(query, title);
            const textScore = scoreTokens(queryTokens, `${title} ${details.description || ""} ${candidate.packageName}`);
            const reliableTextMatch = hasReliableTextMatch(
                queryTokens,
                `${title} ${details.description || ""} ${candidate.packageName}`
            );
            const rankScore = Math.max(0, 42 - (candidate.rank * 7));
            const localeScore = candidate.locale && preferredLocaleIds.has(candidate.locale.id) ? 8 : 0;
            const hasMetadata = Boolean(details.title || details.icon || details.description);

            return {
                title,
                packageName: candidate.packageName,
                url: candidate.url,
                locale: candidate.locale,
                icon: details.icon,
                website: details.website,
                description: details.description,
                score: textScore + rankScore + localeScore + (hasMetadata ? 5 : 0),
                strongTitleMatch,
                reliableTextMatch,
                hasMetadata,
                searchRank: candidate.rank
            };
        })
    );

    const ranked = detailResults
        .filter((entry) => {
            if (!entry.title || !entry.hasMetadata) {
                return false;
            }

            // A localized title may not share characters with an explicitly
            // regional query, but rank alone is not evidence of identity.
            // Requiring a regional hint prevents unrelated apps such as FGA
            // from being returned for the shorthand FGO.
            return entry.strongTitleMatch || entry.reliableTextMatch || (
                entry.locale &&
                isRegionalLocale(entry.locale) &&
                hasExplicitRegionHint(query) &&
                entry.searchRank <= 1
            );
        })
        .sort((left, right) => right.score - left.score);

    const unique = [];
    const seenPackages = new Set();
    for (const entry of ranked) {
        const key = entry.packageName.toLowerCase();
        if (seenPackages.has(key)) {
            continue;
        }
        seenPackages.add(key);
        unique.push(entry);
    }

    if (!unique.length) {
        return [];
    }

    unique[0].related = unique.slice(1, 4).map((entry) => ({
        title: entry.title,
        packageName: entry.packageName,
        url: entry.url
    }));
    return unique;
}

async function fetchPlayMetadata(playUrl) {
    let response;

    try {
        response = await fetchWithTimeout(playUrl, {
            headers: {
                "accept-language": "en-US,en;q=0.9"
            }
        });
    } catch {
        return {};
    }

    if (!response.ok) {
        return {};
    }

    const html = await response.text();
    return {
        title: readMetaContent(html, "property", "og:title") || readMetaContent(html, "name", "twitter:title") || readHtmlTitle(html),
        icon: readMetaContent(html, "property", "og:image") || readMetaContent(html, "name", "twitter:image"),
        description: readMetaContent(html, "name", "description") || readMetaContent(html, "property", "og:description"),
        website: readMetaContent(html, "property", "og:see_also")
    };
}

async function fetchArchivePackageMetadata(packageName) {
    const urls = new Set([
        `https://apkpure.com/search?q=${encodeURIComponent(packageName)}`,
        `https://www.appbrain.com/search?q=${encodeURIComponent(packageName)}`
    ]);

    const searchResponses = await Promise.all(
        [packageName, `site:apkpure.com ${packageName}`, `site:appbrain.com ${packageName}`]
            .map((searchTerm) => fetchText(`https://duckduckgo.com/html/?q=${encodeURIComponent(searchTerm)}`))
    );

    for (const response of searchResponses) {
        if (!response) {
            continue;
        }

        for (const url of extractUrlsFromDuckDuckGoHtml(response)) {
            if (isArchiveUrl(url)) {
                urls.add(url);
            }
        }
    }

    const pages = await Promise.all([...urls].slice(0, 6).map(async (url) => ({
        url,
        metadata: await fetchPageMetadata(url)
    })));
    const match = pages.find((page) =>
        isArchiveUrlForPackage(page.url, packageName) &&
        (page.metadata.title || page.metadata.icon || page.metadata.description)
    );

    if (!match) {
        return {};
    }

    return {
        ...match.metadata,
        archiveUrl: match.url,
        source: "Package Lookup · Archive Metadata"
    };
}

async function searchArchiveResults(query) {
    const urls = new Set();
    for (const searchTerm of buildSearchQueryVariants(query)) {
        const html = await fetchText(`https://duckduckgo.com/html/?q=${encodeURIComponent(`${searchTerm} android game`)}`);
        if (!html) {
            continue;
        }
        for (const url of extractUrlsFromDuckDuckGoHtml(html)) {
            if (isArchiveUrl(url)) {
                urls.add(url);
            }
        }
    }

    const matches = [];
    const seenPackages = new Set();
    const pages = await Promise.all([...urls].slice(0, 8).map(async (url) => ({
        url,
        metadata: await fetchPageMetadata(url)
    })));

    for (const page of pages) {
        const packageName = extractPackageNameFromArchiveUrl(page.url);
        if (!packageName || seenPackages.has(packageName.toLowerCase()) || !page.metadata.title) {
            continue;
        }
        const title = cleanArchiveTitle(page.metadata.title);
        const queryTokens = normalizeText(query).split(" ").filter(Boolean);
        if (!isStrongTitleMatch(query, title) && !hasReliableTextMatch(queryTokens, `${title} ${page.metadata.description || ""}`)) {
            continue;
        }
        seenPackages.add(packageName.toLowerCase());
        matches.push({
            title,
            packageName,
            url: page.url,
            sourceName: "Archive Listing",
            icon: page.metadata.icon,
            description: page.metadata.description,
            archiveUrl: page.url
        });
    }

    return matches.slice(0, 5);
}

async function fetchPageMetadata(url) {
    const html = await fetchText(url);
    if (!html) {
        return {};
    }

    return {
        title: cleanArchiveTitle(
            readMetaContent(html, "property", "og:title") ||
            readMetaContent(html, "name", "twitter:title") ||
            readHtmlTitle(html)
        ),
        icon: readMetaContent(html, "property", "og:image") || readMetaContent(html, "name", "twitter:image"),
        description: readMetaContent(html, "name", "description") || readMetaContent(html, "property", "og:description")
    };
}

async function fetchText(url) {
    try {
        const response = await fetchWithTimeout(url, {
            headers: {
                "accept-language": "en-US,en;q=0.8",
                "user-agent": "Mozilla/5.0"
            }
        });
        return response.ok ? await response.text() : "";
    } catch {
        return "";
    }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = EXTERNAL_FETCH_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, {
            ...options,
            signal: controller.signal
        });
    } finally {
        clearTimeout(timeoutId);
    }
}

function isArchiveUrl(value) {
    try {
        return ARCHIVE_HOSTS.has(new URL(value).hostname.toLowerCase());
    } catch {
        return false;
    }
}

function extractPackageNameFromArchiveUrl(value) {
    const match = String(value || "").match(/(?:^|[/_-])((?:com|net|org|jp|kr|vn|th|io|app|game)[a-zA-Z0-9_-]*(?:\.[a-zA-Z0-9_-]+)+)(?:[/#?]|$)/i);
    return match ? match[1] : "";
}

function isArchiveUrlForPackage(value, packageName) {
    const normalizedPackage = String(packageName || "").trim().toLowerCase();
    return Boolean(normalizedPackage) && extractPackageNameFromArchiveUrl(value).toLowerCase() === normalizedPackage;
}

function cleanArchiveTitle(value) {
    return String(value || "")
        .replace(/\s*[|\-–]\s*(APKPure|AppBrain|Uptodown).*$/iu, "")
        .trim();
}

function readHtmlTitle(html) {
    const match = String(html || "").match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    return match ? decodeHtml(match[1]).replace(/\s+/g, " ").trim() : "";
}

async function searchAppStore(query, country = "US") {
    const queryTokens = normalizeText(query).split(" ").filter(Boolean);
    const significantTokens = queryTokens.filter((token) => !GENERIC_SEARCH_TOKENS.has(token));
    const requestUrl = new URL(APPLE_SEARCH_URL);
    requestUrl.searchParams.set("term", query);
    requestUrl.searchParams.set("entity", "software");
    requestUrl.searchParams.set("country", String(country || "US").slice(0, 2).toLowerCase());
    requestUrl.searchParams.set("limit", "5");

    let response;

    try {
        response = await fetchWithTimeout(requestUrl.toString(), {
            headers: {
                "Accept": "application/json"
            }
        });
    } catch {
        return null;
    }

    if (!response.ok) {
        return null;
    }

    const payload = await response.json();
    const results = Array.isArray(payload.results) ? payload.results : [];
    const best = results
        .map((entry) => ({
            entry,
            score: scoreTokens(queryTokens, `${entry.trackName || ""} ${entry.bundleId || ""}`),
            matchedTokenCount: countMatchedTokens(queryTokens, `${entry.trackName || ""} ${entry.bundleId || ""}`)
        }))
        .sort((left, right) => right.score - left.score)[0];

    if (!best) {
        return null;
    }

    const requiredMatches = significantTokens.length
        ? significantTokens.length
        : Math.max(1, Math.min(3, queryTokens.length - 1));
    const significantMatches = countMatchedTokens(significantTokens, `${best.entry.trackName || ""} ${best.entry.bundleId || ""}`);

    return best.score > 0 && significantMatches >= requiredMatches ? best.entry : null;
}

function readMetaContent(html, attrName, attrValue) {
    const escapedAttrValue = escapeRegex(attrValue);
    const patternBefore = new RegExp(`<meta[^>]+${attrName}=["']${escapedAttrValue}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i");
    const patternAfter = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attrName}=["']${escapedAttrValue}["'][^>]*>`, "i");
    const beforeMatch = html.match(patternBefore);
    const afterMatch = html.match(patternAfter);
    const raw = beforeMatch?.[1] || afterMatch?.[1] || "";
    return decodeHtml(raw);
}

function cleanPlayTitle(value) {
    return String(value || "")
        .replace(/\s*-\s*(Apps on Google Play|Google Play 앱|Google Play \S+|[^-]{0,120}Google Play)\s*$/iu, "")
        .trim();
}

function normalizeText(value) {
    return String(value || "")
        .normalize("NFKC")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/([A-Za-z])(\d)/g, "$1 $2")
        .replace(/(\d)([A-Za-z])/g, "$1 $2")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim();
}

function buildSearchQueryVariants(query) {
    const raw = String(query || "").trim();
    const normalized = normalizeText(raw);
    const compact = normalized.replace(/\s+/g, "");
    return [...new Set([raw, normalized, compact].filter((value) => value && value.length >= 2))];
}

function buildPlayDetailsUrl(packageName, locale = PLAY_LOCALES[0]) {
    return `https://${GOOGLE_PLAY_HOST}/store/apps/details?id=${encodeURIComponent(packageName)}&hl=${encodeURIComponent(locale.hl)}&gl=${encodeURIComponent(locale.gl)}`;
}

function rankPlayLocales(query) {
    const normalized = normalizeText(query);
    const preferred = [];
    const add = (id) => {
        const locale = PLAY_LOCALES.find((entry) => entry.id === id);
        if (locale && !preferred.some((entry) => entry.id === id)) {
            preferred.push(locale);
        }
    };

    if (/[\uac00-\ud7af]/u.test(query) || /\b(kr|korea|korean)\b|한국|대한민국/iu.test(normalized)) {
        add("kr");
    }
    if (/[\u0e00-\u0e7f]/u.test(query) || /\b(th|thai|thailand)\b|ไทย|태국/iu.test(normalized)) {
        add("th");
    }
    if (/\b(vn|vietnam|vng)\b|việt|เวียดนาม/iu.test(normalized)) {
        add("vn");
    }
    if (/[\u3040-\u30ff]/u.test(query) || /\b(jp|japan|japanese)\b|日本/iu.test(normalized)) {
        add("jp");
    }
    if (/[\u4e00-\u9fff]/u.test(query) || /\b(tw|taiwan|taiwanese)\b|台湾|台灣/iu.test(normalized)) {
        add("tw");
    }

    for (const locale of PLAY_LOCALES) {
        if (!preferred.some((entry) => entry.id === locale.id)) {
            preferred.push(locale);
        }
    }
    return preferred;
}

function isRegionalLocale(locale) {
    return Boolean(locale && ["kr", "th", "vn", "jp", "tw"].includes(locale.id));
}

function hasExplicitRegionHint(query) {
    const value = String(query || "");
    const normalized = normalizeText(value);

    return (
        /[\uac00-\ud7af\u0e00-\u0e7f\u3040-\u30ff\u4e00-\u9fff]/u.test(value) ||
        /\b(kr|korea|korean|th|thai|thailand|vn|vietnam|vng|jp|japan|japanese|tw|taiwan|taiwanese)\b/iu.test(normalized) ||
        /한국|대한민국|ไทย|태국|เวียดนาม|日本|台湾|台灣/iu.test(value)
    );
}

function findCuratedOverride(query) {
    const normalizedQuery = normalizeText(query);
    const collapsedQuery = collapseNormalizedText(normalizedQuery);
    const matches = [];

    for (const entry of CURATED_GAME_OVERRIDES) {
        for (const alias of Array.isArray(entry.aliases) ? entry.aliases : []) {
            const normalizedAlias = normalizeText(alias);
            const collapsedAlias = collapseNormalizedText(normalizedAlias);
            if (!normalizedAlias) {
                continue;
            }

            const exactMatch = normalizedQuery === normalizedAlias ||
                (collapsedAlias && collapsedQuery === collapsedAlias);
            const embeddedMatch = normalizedAlias.length >= 4 && (
                normalizedQuery.startsWith(`${normalizedAlias} `) ||
                normalizedQuery.endsWith(` ${normalizedAlias}`) ||
                normalizedQuery.includes(` ${normalizedAlias} `)
            );

            if (exactMatch || embeddedMatch) {
                matches.push({
                    entry,
                    exactMatch,
                    aliasLength: Math.max(normalizedAlias.length, collapsedAlias.length)
                });
            }
        }
    }

    return matches
        .sort((left, right) => Number(right.exactMatch) - Number(left.exactMatch) || right.aliasLength - left.aliasLength)
        .at(0)?.entry || null;
}

function findCuratedOverrideByPackage(query) {
    const normalizedQuery = String(query || "").trim().toLowerCase();
    return CURATED_GAME_OVERRIDES.find((entry) => String(entry.packageName || "").trim().toLowerCase() === normalizedQuery) || null;
}

function scoreTokens(tokens, candidate) {
    const normalizedCandidate = normalizeText(candidate);
    if (!normalizedCandidate) {
        return 0;
    }

    let score = 0;
    const collapsedQuery = collapseNormalizedText(tokens.join(" "));
    const collapsedCandidate = collapseNormalizedText(normalizedCandidate);

    if (collapsedQuery && collapsedCandidate.includes(collapsedQuery)) {
        score += 60;
    }

    for (const token of tokens) {
        if (!token) {
            continue;
        }

        if (normalizedCandidate.includes(token)) {
            score += 14;
        }
    }

    return score;
}

function countMatchedTokens(tokens, candidate) {
    const normalizedCandidate = normalizeText(candidate);
    let count = 0;

    for (const token of tokens) {
        if (token && normalizedCandidate.includes(token)) {
            count += 1;
        }
    }

    return count;
}

function hasReliableTextMatch(tokens, candidate) {
    const normalizedTokens = [...new Set((tokens || []).filter(Boolean))];
    if (!normalizedTokens.length) {
        return false;
    }

    const significantTokens = normalizedTokens.filter((token) => !GENERIC_SEARCH_TOKENS.has(token));
    const requiredTokens = significantTokens.length ? significantTokens : normalizedTokens;
    const candidateTokens = normalizeText(candidate).split(" ").filter(Boolean);

    return requiredTokens.every((queryToken) => candidateTokens.some((candidateToken) =>
        candidateToken === queryToken ||
        (queryToken.length >= 4 && candidateToken.startsWith(queryToken))
    ));
}

function isStrongTitleMatch(query, title) {
    const normalizedQuery = normalizeText(query);
    const normalizedTitle = normalizeText(title);

    if (!normalizedQuery || !normalizedTitle) {
        return false;
    }

    const collapsedQuery = collapseNormalizedText(normalizedQuery);
    const collapsedTitle = collapseNormalizedText(normalizedTitle);

    if (
        normalizedQuery === normalizedTitle ||
        collapsedQuery === collapsedTitle ||
        collapsedTitle.includes(collapsedQuery) ||
        collapsedQuery.includes(collapsedTitle)
    ) {
        return true;
    }

    const queryTokens = normalizedQuery.split(" ").filter(Boolean);
    const titleTokens = normalizedTitle.split(" ").filter(Boolean);
    const requiredQueryTokens = queryTokens.filter((token) => !OPTIONAL_TITLE_MATCH_TOKENS.has(token));
    const requiredTitleTokens = titleTokens.filter((token) => !OPTIONAL_TITLE_MATCH_TOKENS.has(token));
    const effectiveQueryTokens = requiredQueryTokens.length ? requiredQueryTokens : queryTokens;

    if (!effectiveQueryTokens.length) {
        return false;
    }

    const titleTokenSet = new Set(titleTokens);
    const requiredMatches = effectiveQueryTokens.filter((token) => titleTokenSet.has(token)).length;
    if (requiredMatches < effectiveQueryTokens.length) {
        return false;
    }

    const queryTokenSet = new Set(queryTokens);
    const extraRequiredTitleTokens = requiredTitleTokens.filter((token) => !queryTokenSet.has(token));

    return extraRequiredTitleTokens.length < 2;
}

function collapseNormalizedText(value) {
    return String(value || "").replace(/\s+/g, "");
}

function isLikelyPackageName(value) {
    return /^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z0-9_]+)+$/.test(String(value || "").trim());
}

function normalizePackageName(value) {
    return String(value || "").trim().toLowerCase();
}

const GENERIC_SEARCH_TOKENS = new Set([
    "app",
    "game",
    "games",
    "mobile",
    "online",
    "rpg"
]);

const OPTIONAL_TITLE_MATCH_TOKENS = new Set([
    "a",
    "an",
    "and",
    "app",
    "for",
    "game",
    "games",
    "mobile",
    "of",
    "online",
    "rpg",
    "the",
    "to"
]);


function dedupeChannels(channels) {
    const seen = new Set();
    const output = [];

    for (const channel of channels) {
        if (!channel || !channel.url) {
            continue;
        }

        const key = `${channel.name}|${channel.url}`;
        if (seen.has(key)) {
            continue;
        }

        seen.add(key);
        output.push(channel);
    }

    return output;
}

function summarizeText(value) {
    const normalized = String(value || "").replace(/\s+/g, " ").trim();
    if (normalized.length <= 240) {
        return normalized;
    }
    return `${normalized.slice(0, 237).trim()}...`;
}

function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeHtml(value) {
    return String(value || "")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, "\"")
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim();
}

function json(payload, status) {
    return new Response(JSON.stringify(payload, null, 2), {
        status,
        headers: {
            "content-type": "application/json; charset=UTF-8",
            "cache-control": "no-store"
        }
    });
}
