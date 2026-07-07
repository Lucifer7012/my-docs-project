const GOOGLE_PLAY_HOST = "play.google.com";
const TAPTAP_HOST = "taptap.io";
const APKPURE_HOST = "apkpure.com";
const APPLE_SEARCH_URL = "https://itunes.apple.com/search";
const CSE_URL = "https://customsearch.googleapis.com/customsearch/v1";

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

    if (!context.env.GOOGLE_CSE_API_KEY || !context.env.GOOGLE_CSE_CX) {
        return json(
            {
                error: "Missing Cloudflare env vars: GOOGLE_CSE_API_KEY and GOOGLE_CSE_CX.",
                setup: {
                    buildCommand: "mkdocs build",
                    outputDirectory: "site",
                    requiredEnvVars: ["GOOGLE_CSE_API_KEY", "GOOGLE_CSE_CX"]
                }
            },
            500
        );
    }

    try {
        const playSearch = await searchCse(context.env, {
            query,
            siteSearch: GOOGLE_PLAY_HOST,
            num: 5
        });

        const playItems = Array.isArray(playSearch.items) ? playSearch.items : [];
        const bestPlayItem = pickBestSearchResult(playItems, query, cleanPlayTitle);

        if (!bestPlayItem) {
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

        const playUrl = normalizePlayLink(bestPlayItem.link);
        const playMeta = await fetchPlayMetadata(playUrl);
        const playTitle = cleanPlayTitle(playMeta.title || bestPlayItem.title || query);
        const packageName = extractPackageName(playUrl);
        const icon = playMeta.icon || getSearchImage(bestPlayItem);
        const summary = summarizeText(playMeta.description || bestPlayItem.snippet || "");

        const [appStoreMatch, tapTapMatch, apkPureMatch] = await Promise.all([
            searchAppStore(query, playTitle),
            searchBestDomainMatch(context.env, TAPTAP_HOST, query, playTitle, packageName),
            searchBestDomainMatch(context.env, APKPURE_HOST, query, playTitle, packageName)
        ]);

        const channels = dedupeChannels([
            {
                name: "Google Play",
                url: playUrl,
                note: packageName ? `Package: ${packageName}` : "Official Android page"
            },
            appStoreMatch
                ? {
                    name: "App Store",
                    url: appStoreMatch.trackViewUrl,
                    note: appStoreMatch.bundleId || appStoreMatch.trackName
                }
                : null,
            appStoreMatch && appStoreMatch.sellerUrl
                ? {
                    name: "Official Site",
                    url: appStoreMatch.sellerUrl,
                    note: "Developer website"
                }
                : null,
            tapTapMatch
                ? {
                    name: "TapTap",
                    url: tapTapMatch.link,
                    note: cleanGenericTitle(tapTapMatch.title, "TapTap")
                }
                : null,
            apkPureMatch
                ? {
                    name: "APKPure",
                    url: apkPureMatch.link,
                    note: cleanGenericTitle(apkPureMatch.title, "APKPure")
                }
                : null
        ]);

        const related = playItems
            .filter((item) => item.link !== bestPlayItem.link)
            .slice(0, 3)
            .map((item) => ({
                title: cleanPlayTitle(item.title || ""),
                packageName: extractPackageName(item.link),
                url: normalizePlayLink(item.link)
            }));

        return json(
            {
                query,
                generatedAt: new Date().toISOString(),
                message: `Best match found for "${query}".`,
                result: {
                    title: playTitle,
                    packageName,
                    icon: icon || (appStoreMatch ? appStoreMatch.artworkUrl512 : null),
                    summary,
                    matchSource: "Google Play",
                    channels,
                    related
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

async function searchCse(env, options) {
    const requestUrl = new URL(CSE_URL);
    requestUrl.searchParams.set("key", env.GOOGLE_CSE_API_KEY);
    requestUrl.searchParams.set("cx", env.GOOGLE_CSE_CX);
    requestUrl.searchParams.set("q", options.query);
    requestUrl.searchParams.set("num", String(options.num || 3));
    requestUrl.searchParams.set("hl", "en");
    requestUrl.searchParams.set("gl", "us");
    requestUrl.searchParams.set("safe", "off");
    requestUrl.searchParams.set("fields", "items(title,link,snippet,pagemap,displayLink)");

    if (options.siteSearch) {
        requestUrl.searchParams.set("siteSearch", options.siteSearch);
        requestUrl.searchParams.set("siteSearchFilter", "i");
    }

    const response = await fetch(requestUrl.toString(), {
        headers: {
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Google Custom Search request failed: ${response.status}`);
    }

    return response.json();
}

async function searchAppStore(query, titleHint) {
    const requestUrl = new URL(APPLE_SEARCH_URL);
    requestUrl.searchParams.set("term", titleHint || query);
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
            score: scoreMatch([query, titleHint].filter(Boolean).join(" "), `${entry.trackName || ""} ${entry.bundleId || ""}`)
        }))
        .sort((left, right) => right.score - left.score)[0];

    return best && best.score > 0 ? best.entry : null;
}

async function searchBestDomainMatch(env, host, query, titleHint, packageName) {
    const preferredQuery = host === APKPURE_HOST
        ? packageName || titleHint || query
        : titleHint || query;
    const response = await searchCse(env, {
        query: preferredQuery,
        siteSearch: host,
        num: 3
    });
    const items = Array.isArray(response.items) ? response.items : [];
    return pickBestSearchResult(items, preferredQuery, (value) => cleanGenericTitle(value, host));
}

function pickBestSearchResult(items, query, titleCleaner) {
    const normalizedQuery = normalizeText(query);
    const queryTokens = normalizedQuery.split(" ").filter(Boolean);

    const ranked = items
        .map((item) => {
            const cleanedTitle = titleCleaner(item.title || "");
            const haystack = `${cleanedTitle} ${item.snippet || ""} ${item.link || ""}`;
            return {
                item,
                score: scoreTokens(queryTokens, haystack)
            };
        })
        .sort((left, right) => right.score - left.score);

    return ranked.length && ranked[0].score > 0 ? ranked[0].item : null;
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
        description: readMetaContent(html, "name", "description") || readMetaContent(html, "property", "og:description")
    };
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
    return cleanGenericTitle(value, "Apps on Google Play");
}

function cleanGenericTitle(value, suffix) {
    return String(value || "")
        .replace(new RegExp(`\\s*[-|]\\s*${escapeRegex(suffix)}\\s*$`, "i"), "")
        .trim();
}

function extractPackageName(link) {
    try {
        const url = new URL(link);
        return url.searchParams.get("id");
    } catch (error) {
        return null;
    }
}

function normalizePlayLink(link) {
    try {
        const url = new URL(link);
        const id = url.searchParams.get("id");
        if (!id) {
            return link;
        }
        return `https://${GOOGLE_PLAY_HOST}/store/apps/details?id=${encodeURIComponent(id)}`;
    } catch (error) {
        return link;
    }
}

function getSearchImage(item) {
    const pagemap = item && item.pagemap ? item.pagemap : {};
    const cseImage = Array.isArray(pagemap.cse_image) ? pagemap.cse_image[0] : null;
    const metaTag = Array.isArray(pagemap.metatags) ? pagemap.metatags[0] : null;
    return cseImage?.src || metaTag?.["og:image"] || metaTag?.["twitter:image"] || null;
}

function normalizeText(value) {
    return String(value || "")
        .normalize("NFKC")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim();
}

function scoreMatch(query, candidate) {
    return scoreTokens(normalizeText(query).split(" ").filter(Boolean), candidate);
}

function scoreTokens(tokens, candidate) {
    const normalizedCandidate = normalizeText(candidate);
    if (!normalizedCandidate) {
        return 0;
    }

    let score = 0;
    const collapsedQuery = tokens.join("");
    const collapsedCandidate = normalizedCandidate.replace(/\s+/g, "");

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
