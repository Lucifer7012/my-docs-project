import { CURATED_GAME_OVERRIDES } from "../data/curated-game-overrides.js";

const GOOGLE_PLAY_HOST = "play.google.com";
const APPLE_SEARCH_URL = "https://itunes.apple.com/search";

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
                        result: curatedPackageResult
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
                        result: directPackageResult
                    },
                    200
                );
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
                    result: curatedResult
                },
                200
            );
        }

        const candidates = await searchGooglePlayCandidates(query);

        if (!candidates.length) {
            return json(
                {
                    query,
                    generatedAt: new Date().toISOString(),
                    message: "No Google Play match was found for this query.",
                    result: null
                },
                200
            );
        }

        const bestResult = await resolveBestGooglePlayResult(query, candidates);

        if (!bestResult) {
            return json(
                {
                    query,
                    generatedAt: new Date().toISOString(),
                    message: "No valid Google Play result could be resolved.",
                    result: null
                },
                200
            );
        }

        const title = cleanPlayTitle(bestResult.title || query);
        const appStoreMatch = await searchAppStore(title);
        const channels = dedupeChannels([
            {
                name: "Google Play",
                url: bestResult.url,
                note: bestResult.packageName ? `Package: ${bestResult.packageName}` : "Official Android page"
            },
            appStoreMatch
                ? {
                    name: "App Store",
                    url: appStoreMatch.trackViewUrl,
                    note: appStoreMatch.bundleId || appStoreMatch.trackName
                }
                : null,
            bestResult.website
                ? {
                    name: "Official Site",
                    url: bestResult.website,
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
                url: `https://apkpure.com/search?q=${encodeURIComponent(bestResult.packageName || title)}`,
                note: "Search results page"
            }
        ]);

        return json(
            {
                query,
                generatedAt: new Date().toISOString(),
                message: `Best match found for "${query}".`,
                result: {
                    title,
                    packageName: bestResult.packageName,
                    icon: bestResult.icon || (appStoreMatch ? appStoreMatch.artworkUrl512 : null),
                    summary: summarizeText(bestResult.description || ""),
                    matchSource: "Google Play Web Search",
                    channels,
                    related: bestResult.related
                }
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
    const ids = [];
    const seen = new Set();

    for (const searchTerm of buildSearchQueryVariants(query)) {
        const searchUrl = `https://${GOOGLE_PLAY_HOST}/store/search?q=${encodeURIComponent(searchTerm)}&c=apps&hl=en_US&gl=US`;
        const response = await fetch(searchUrl, {
            headers: {
                "accept-language": "en-US,en;q=0.9"
            }
        });

        if (!response.ok) {
            throw new Error(`Google Play search request failed: ${response.status}`);
        }

        const html = await response.text();
        for (const packageName of extractPlayPackageIds(html)) {
            if (seen.has(packageName)) {
                continue;
            }

            seen.add(packageName);
            ids.push(packageName);

            if (ids.length >= 6) {
                break;
            }
        }

        if (ids.length >= 6) {
            break;
        }
    }

    return ids.map((packageName) => ({
        packageName,
        url: buildPlayDetailsUrl(packageName)
    }));
}

async function resolveDirectPackageLookup(packageName) {
    const playUrl = buildPlayDetailsUrl(packageName);
    const playMeta = await fetchPlayMetadata(playUrl);
    const title = cleanPlayTitle(playMeta.title || packageName);

    if (!playMeta.title && !playMeta.icon && !playMeta.description) {
        return null;
    }

    const appStoreMatch = await searchAppStore(title);
    const channels = dedupeChannels([
        {
            name: "Google Play",
            url: playUrl,
            note: `Package: ${packageName}`
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
        matchSource: "Direct Package Lookup",
        channels,
        related: []
    };
}

function extractPlayPackageIds(html) {
    const ids = [];
    const seen = new Set();
    const regex = /\/store\/apps\/details\?id=([a-zA-Z0-9._]+)/g;
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

async function resolveBestGooglePlayResult(query, candidates) {
    const detailResults = await Promise.all(
        candidates.map(async (candidate) => {
            const details = await fetchPlayMetadata(candidate.url);
            const title = cleanPlayTitle(details.title || candidate.packageName);
            const score = scoreTokens(normalizeText(query).split(" ").filter(Boolean), `${title} ${details.description || ""} ${candidate.packageName}`);

            return {
                title,
                packageName: candidate.packageName,
                url: candidate.url,
                icon: details.icon,
                website: details.website,
                description: details.description,
                score
            };
        })
    );

    const ranked = detailResults
        .filter((entry) => entry.score > 0 && entry.title)
        .sort((left, right) => right.score - left.score);

    if (!ranked.length) {
        return null;
    }

    const best = ranked[0];
    best.related = ranked.slice(1, 4).map((entry) => ({
        title: entry.title,
        packageName: entry.packageName,
        url: entry.url
    }));
    return best;
}

async function fetchPlayMetadata(playUrl) {
    const response = await fetch(playUrl, {
        headers: {
            "accept-language": "en-US,en;q=0.9"
        }
    });

    if (!response.ok) {
        return {};
    }

    const html = await response.text();
    return {
        title: readMetaContent(html, "property", "og:title") || readMetaContent(html, "name", "twitter:title"),
        icon: readMetaContent(html, "property", "og:image") || readMetaContent(html, "name", "twitter:image"),
        description: readMetaContent(html, "name", "description") || readMetaContent(html, "property", "og:description"),
        website: readMetaContent(html, "property", "og:see_also")
    };
}

async function searchAppStore(query) {
    const queryTokens = normalizeText(query).split(" ").filter(Boolean);
    const significantTokens = queryTokens.filter((token) => !GENERIC_SEARCH_TOKENS.has(token));
    const requestUrl = new URL(APPLE_SEARCH_URL);
    requestUrl.searchParams.set("term", query);
    requestUrl.searchParams.set("entity", "software");
    requestUrl.searchParams.set("country", "us");
    requestUrl.searchParams.set("limit", "5");

    const response = await fetch(requestUrl.toString(), {
        headers: {
            "Accept": "application/json"
        }
    });

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
        .replace(/\s*-\s*Apps on Google Play\s*$/i, "")
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
    return [...new Set([raw, normalized].filter(Boolean))];
}

function buildPlayDetailsUrl(packageName) {
    return `https://${GOOGLE_PLAY_HOST}/store/apps/details?id=${encodeURIComponent(packageName)}&hl=en_US&gl=US`;
}

function findCuratedOverride(query) {
    const normalizedQuery = normalizeText(query);
    const collapsedQuery = collapseNormalizedText(normalizedQuery);
    let bestMatch = null;

    for (const entry of CURATED_GAME_OVERRIDES) {
        for (const alias of entry.aliases) {
            const normalizedAlias = normalizeText(alias);
            const collapsedAlias = collapseNormalizedText(normalizedAlias);
            if (!normalizedAlias) {
                continue;
            }

            const isMatch = (
                normalizedQuery === normalizedAlias ||
                normalizedQuery.includes(normalizedAlias) ||
                (collapsedAlias && (collapsedQuery === collapsedAlias || collapsedQuery.includes(collapsedAlias)))
            );
            if (!isMatch) {
                continue;
            }

            const aliasLength = Math.max(normalizedAlias.length, collapsedAlias.length);
            if (!bestMatch || aliasLength > bestMatch.aliasLength) {
                bestMatch = {
                    entry,
                    aliasLength
                };
            }
        }
    }

    return bestMatch ? bestMatch.entry : null;
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

function collapseNormalizedText(value) {
    return String(value || "").replace(/\s+/g, "");
}

function isLikelyPackageName(value) {
    return /^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z0-9_]+)+$/.test(String(value || "").trim());
}

const GENERIC_SEARCH_TOKENS = new Set([
    "app",
    "game",
    "games",
    "idle",
    "mobile",
    "online",
    "rpg"
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
