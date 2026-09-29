import assert from "node:assert/strict";
import { test } from "node:test";
import { onRequestGet } from "../functions/api/game-search.js";

const title = "Architect: Land of Exiles";
const packageName = "com.hybeim.architect";
const archiveUrl = `https://www.appbrain.com/app/architect-land-of-exiles/${packageName}`;
const metadata = `<meta property="og:title" content="${title}"><meta name="description" content="Role playing game">`;

async function search() {
    const response = await onRequestGet({
        request: new Request(`https://example.com/api/game-search?q=${encodeURIComponent(title)}`)
    });
    assert.equal(response.status, 200);
    return response.json();
}

for (const hasRejectedPlayCandidate of [false, true]) {
    test(`archive fallback retains Play link and correct source (rejected candidate: ${hasRejectedPlayCandidate})`, async (t) => {
        t.mock.method(globalThis, "fetch", async (input) => {
            const url = new URL(input);
            if (url.hostname === "play.google.com") {
                if (url.pathname === "/store/search") {
                    return new Response(hasRejectedPlayCandidate
                        ? '<a href="/store/apps/details?id=com.example.unrelated">Unrelated</a>'
                        : "");
                }
                return new Response("", { status: 404 });
            }
            if (url.hostname === "duckduckgo.com") {
                return new Response(`<a href="/l/?uddg=${encodeURIComponent(archiveUrl)}&amp;rut=123">${title}</a>`);
            }
            assert.equal(url.href, archiveUrl);
            return new Response(metadata);
        });

        const payload = await search();
        assert.equal(payload.results.length, 1);
        assert.deepEqual(payload.result, payload.results[0]);
        assert.equal(payload.result.packageName, packageName);
        assert.equal(payload.result.matchSource, "Archive Listing");
        const playLinks = payload.result.channels.filter((channel) => channel.name === "Google Play");
        assert.equal(playLinks.length, 1);
        const playUrl = new URL(playLinks[0].url);
        assert.equal(playUrl.origin, "https://play.google.com");
        assert.equal(playUrl.pathname, "/store/apps/details");
        assert.equal(playUrl.searchParams.get("id"), packageName);
        assert.match(playLinks[0].note, /not been verified/);
        assert.equal(payload.result.channels.find((channel) => channel.name === "Archive Listing").url, archiveUrl);
    });
}

test("live Play result keeps its verified source and a single Play link", async (t) => {
    t.mock.method(globalThis, "fetch", async (input) => {
        const url = new URL(input);
        if (url.hostname === "play.google.com") {
            return new Response(url.pathname === "/store/search"
                ? `<a href="/store/apps/details?id=${packageName}">${title}</a>`
                : metadata);
        }
        if (url.hostname === "itunes.apple.com") {
            return Response.json({ results: [] });
        }
        assert.equal(url.hostname, "duckduckgo.com");
        return new Response("");
    });

    const payload = await search();
    assert.equal(payload.result.packageName, packageName);
    assert.match(payload.result.matchSource, /^Google Play/);
    assert.equal(payload.result.channels.filter((channel) => channel.name === "Google Play").length, 1);
    assert.ok(!payload.result.channels.some((channel) => channel.name === "Archive Listing"));
});
