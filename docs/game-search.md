# Game Search Tool

<!-- search-page-refresh: 2026-07-28 -->

<style>
    .search-shell {
        --ink: #172033;
        --muted: #5c667a;
        --brand: #0f62fe;
        --brand-soft: rgba(15, 98, 254, 0.1);
        --line: rgba(25, 33, 54, 0.1);
        --card: rgba(255, 255, 255, 0.92);
        --surface: linear-gradient(180deg, #f8fbff 0%, #f3f8ff 100%);
        --ok: #0d7a46;
        --warn: #9a3412;
        --error: #b42318;
        --shadow: 0 18px 45px rgba(17, 24, 39, 0.08);
        color: var(--ink);
    }

    .search-hero {
        background:
            radial-gradient(circle at top right, rgba(15, 98, 254, 0.15), transparent 28%),
            radial-gradient(circle at left bottom, rgba(14, 165, 233, 0.12), transparent 26%),
            linear-gradient(135deg, #ffffff 0%, #f4f8ff 45%, #eef7ff 100%);
        border: 1px solid rgba(15, 98, 254, 0.12);
        border-radius: 28px;
        box-shadow: var(--shadow);
        overflow: hidden;
        padding: 28px;
        position: relative;
    }

    .search-hero::after {
        background: linear-gradient(90deg, rgba(15, 98, 254, 0.08), rgba(14, 165, 233, 0.08));
        content: "";
        height: 180px;
        inset: auto -18% -60% 35%;
        position: absolute;
        transform: rotate(-10deg);
    }

    .search-hero > * {
        position: relative;
        z-index: 1;
    }

    .search-title {
        font-size: clamp(2rem, 3vw, 2.8rem);
        font-weight: 800;
        letter-spacing: -0.04em;
        margin: 0 0 8px;
    }

    .search-subtitle {
        color: var(--muted);
        font-size: 1rem;
        line-height: 1.65;
        margin: 0;
        max-width: 780px;
    }

    .search-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 18px;
    }

    .search-badge {
        background: rgba(255, 255, 255, 0.88);
        border: 1px solid rgba(148, 163, 184, 0.22);
        border-radius: 999px;
        color: #0f172a;
        font-size: 0.9rem;
        padding: 8px 12px;
    }

    .search-panel,
    .search-result-panel,
    .search-note-panel {
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 24px;
        box-shadow: var(--shadow);
        margin-top: 20px;
        padding: 22px;
    }

    .search-result-panel {
        scroll-margin-top: 84px;
    }

    .search-form {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
    }

    .search-input {
        appearance: none;
        background: #fff;
        border: 2px solid rgba(15, 98, 254, 0.14);
        border-radius: 18px;
        box-shadow: inset 0 1px 2px rgba(17, 24, 39, 0.03);
        flex: 1 1 360px;
        font: inherit;
        min-width: 0;
        outline: none;
        padding: 15px 16px;
        transition: border-color 0.18s ease, box-shadow 0.18s ease;
    }

    .search-input:focus {
        border-color: rgba(15, 98, 254, 0.55);
        box-shadow: 0 0 0 4px rgba(15, 98, 254, 0.12);
    }

    .search-button,
    .ghost-button,
    .copy-button,
    .channel-copy-button {
        appearance: none;
        border: 0;
        border-radius: 14px;
        cursor: pointer;
        font: inherit;
        font-weight: 700;
        transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
    }

    .search-button:hover,
    .ghost-button:hover,
    .copy-button:hover,
    .channel-copy-button:hover,
    .channel-link:hover {
        transform: translateY(-1px);
    }

    .search-button {
        background: linear-gradient(135deg, #0f62fe 0%, #2563eb 100%);
        box-shadow: 0 12px 24px rgba(15, 98, 254, 0.18);
        color: #fff;
        padding: 15px 18px;
        white-space: nowrap;
    }

    .ghost-button {
        background: #e7f0ff;
        color: #0f62fe;
        padding: 15px 18px;
        white-space: nowrap;
    }

    .search-helper {
        color: var(--muted);
        font-size: 0.92rem;
        line-height: 1.65;
        margin: 12px 0 0;
    }

    .example-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
    }

    .example-chip {
        background: rgba(15, 98, 254, 0.08);
        border: 1px solid rgba(15, 98, 254, 0.14);
        border-radius: 999px;
        color: #0f62fe;
        cursor: pointer;
        font-size: 0.86rem;
        padding: 8px 12px;
    }

    .fold-panel {
        margin-top: 14px;
    }

    .fold-panel[open] {
        padding-bottom: 4px;
    }

    .fold-summary {
        color: var(--muted);
        cursor: pointer;
        font-size: 0.92rem;
        font-weight: 700;
        list-style: none;
        user-select: none;
    }

    .fold-summary::-webkit-details-marker {
        display: none;
    }

    .fold-summary::before {
        content: "+";
        display: inline-block;
        margin-right: 8px;
        transition: transform 0.18s ease;
    }

    .fold-panel[open] .fold-summary::before {
        content: "-";
    }

    .fold-body {
        padding-top: 10px;
    }

    .status-box {
        border-radius: 18px;
        font-size: 0.94rem;
        line-height: 1.65;
        margin-bottom: 18px;
        padding: 14px 16px;
    }

    .status-box.info {
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        color: #1d4ed8;
    }

    .status-box.ok {
        background: #ecfdf3;
        border: 1px solid #abefc6;
        color: var(--ok);
    }

    .status-box.warn {
        background: #fff7ed;
        border: 1px solid #fed7aa;
        color: var(--warn);
    }

    .status-box.error {
        background: #fef3f2;
        border: 1px solid #fecdca;
        color: var(--error);
    }

    .result-meta {
        color: var(--muted);
        font-size: 0.9rem;
        margin-bottom: 18px;
    }

    .result-card {
        background: var(--card);
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 26px;
        box-shadow: 0 16px 36px rgba(17, 24, 39, 0.07);
        overflow: hidden;
        padding: 22px;
        position: relative;
    }

    .result-card::before {
        background: linear-gradient(90deg, #0f62fe 0%, #06b6d4 100%);
        content: "";
        height: 5px;
        inset: 0 0 auto;
        position: absolute;
    }

    .result-top {
        align-items: center;
        display: flex;
        gap: 18px;
    }

    .result-icon {
        background: linear-gradient(145deg, #ffffff 0%, #eef5ff 100%);
        border: 1px solid rgba(148, 163, 184, 0.22);
        border-radius: 24px;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
        flex: 0 0 88px;
        height: 88px;
        object-fit: cover;
        width: 88px;
    }

    .result-icon.is-broken {
        color: transparent;
    }

    .result-title {
        font-size: 1.28rem;
        font-weight: 800;
        line-height: 1.35;
        margin: 0;
    }

    .result-subtitle {
        color: var(--muted);
        font-size: 0.92rem;
        margin: 6px 0 0;
    }

    .summary-box {
        background: #f8fbff;
        border: 1px solid rgba(148, 163, 184, 0.16);
        border-radius: 18px;
        color: #354052;
        font-size: 0.95rem;
        line-height: 1.7;
        margin-top: 18px;
        padding: 16px;
    }

    .package-box {
        background: #111827;
        border-radius: 18px;
        color: #e5edf9;
        margin-top: 18px;
        padding: 16px;
    }

    .package-box strong {
        color: #93c5fd;
        display: block;
        font-size: 0.85rem;
        letter-spacing: 0.03em;
        margin-bottom: 8px;
        text-transform: uppercase;
    }

    .package-value {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.95rem;
        line-height: 1.6;
        word-break: break-all;
    }

    .button-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 14px;
    }

    .copy-button {
        background: #dbeafe;
        color: #0f62fe;
        padding: 10px 12px;
    }

    .copy-button.alt {
        background: #ecfeff;
        color: #0f766e;
    }

    .channel-section {
        margin-top: 20px;
    }

    .section-title {
        font-size: 1rem;
        font-weight: 800;
        margin: 0 0 12px;
    }

    .channel-list {
        display: grid;
        gap: 12px;
    }

    .channel-item {
        align-items: center;
        background: #fff;
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 16px;
        display: grid;
        gap: 10px;
        grid-template-columns: minmax(0, 1fr) auto auto;
        padding: 14px;
    }

    .channel-item strong {
        display: block;
        font-size: 0.95rem;
        overflow-wrap: anywhere;
    }

    .channel-item span {
        color: var(--muted);
        display: block;
        font-size: 0.82rem;
        margin-top: 4px;
    }

    .channel-link,
    .channel-copy-button {
        border-radius: 12px;
        font-size: 0.88rem;
        font-weight: 700;
        padding: 10px 12px;
        text-decoration: none;
        white-space: nowrap;
    }

    .channel-link {
        background: #dbeafe;
        color: #0f62fe;
    }

    .channel-copy-button {
        background: #ecfeff;
        color: #0f766e;
    }

    .related-list {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 8px;
    }

    .related-item {
        background: #f8fafc;
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 999px;
        color: #334155;
        font-size: 0.84rem;
        padding: 8px 12px;
    }

    .note-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }

    .note-card {
        background: rgba(255, 255, 255, 0.88);
        border: 1px solid rgba(148, 163, 184, 0.16);
        border-radius: 18px;
        padding: 16px;
    }

    .note-card h3 {
        font-size: 1rem;
        margin: 0 0 8px;
    }

    .note-card p,
    .note-card li {
        color: var(--muted);
        font-size: 0.9rem;
        line-height: 1.65;
        margin: 0;
    }

    .note-card ul {
        margin: 0;
        padding-left: 18px;
    }

    .empty-state {
        background: #fff;
        border: 1px dashed rgba(148, 163, 184, 0.76);
        border-radius: 18px;
        color: var(--muted);
        padding: 30px 18px;
        text-align: center;
    }

    .feedback-toast {
        background: rgba(17, 24, 39, 0.96);
        border-radius: 14px;
        bottom: 22px;
        box-shadow: 0 18px 35px rgba(15, 23, 42, 0.24);
        color: #fff;
        font-size: 0.92rem;
        max-width: min(360px, calc(100vw - 32px));
        opacity: 0;
        padding: 12px 14px;
        pointer-events: none;
        position: fixed;
        right: 22px;
        transform: translateY(10px);
        transition: opacity 0.2s ease, transform 0.2s ease;
        z-index: 9999;
    }

    .feedback-toast.visible {
        opacity: 1;
        transform: translateY(0);
    }

    .copy-button.is-copied,
    .channel-copy-button.is-copied {
        background: #dcfce7;
        color: #166534;
    }

    @media (max-width: 720px) {
        .search-hero,
        .search-panel,
        .search-result-panel,
        .search-note-panel {
            padding: 18px;
        }

        .search-form,
        .result-top,
        .button-row {
            align-items: stretch;
            flex-direction: column;
        }

        .search-button,
        .ghost-button,
        .copy-button {
            width: 100%;
        }

        .channel-item {
            grid-template-columns: 1fr;
        }

        .feedback-toast {
            bottom: 16px;
            left: 16px;
            right: 16px;
            max-width: none;
        }
    }
</style>

<div class="search-shell">
    <section class="search-panel">
        <form id="gameSearchForm" class="search-form">
            <input id="gameSearchInput" class="search-input" type="text" placeholder="Try: sol enchant, com.goh.daya.ydonline, night crows" autocomplete="off">
            <button class="search-button" type="submit">Search</button>
            <button id="clearSearchButton" class="ghost-button" type="button">Clear</button>
        </form>
        <details class="fold-panel">
            <summary class="fold-summary">Search Tips</summary>
            <div class="fold-body">
                <p class="search-helper">Search checks curated aliases and package names first, then falls back to Google Play and other channels. You can also enter a package name directly, for example <code>com.goh.daya.ydonline</code>. Icon copy tries to copy the image first, then falls back to the icon link if the browser blocks image copy.</p>
                <div class="example-row">
                    <button class="example-chip" type="button" data-example="sol enchant">sol enchant</button>
                    <button class="example-chip" type="button" data-example="genshin impact">genshin impact</button>
                    <button class="example-chip" type="button" data-example="night crows">night crows</button>
                    <button class="example-chip" type="button" data-example="pokemon go">pokemon go</button>
                </div>
            </div>
        </details>
    </section>

    <section id="searchResultPanel" class="search-result-panel">
        <div id="searchStatus" class="status-box info">Ready. Enter a game name to search.</div>
        <div id="resultMeta" class="result-meta">The API route for this page is <code>/api/game-search?q=...</code>.</div>
        <div id="resultMount" class="empty-state">Search results will appear here.</div>
    </section>

    <details class="search-note-panel fold-panel">
        <summary class="fold-summary">More Info</summary>
        <div class="fold-body">
            <div class="note-grid">
                <article class="note-card">
                    <h3>Cloudflare Setup</h3>
                    <ul>
                        <li>Build command: <code>mkdocs build</code></li>
                        <li>Build output: <code>site</code></li>
                        <li>Functions directory: <code>functions/</code></li>
                    </ul>
                </article>
                <article class="note-card">
                    <h3>Required Env Vars</h3>
                    <ul>
                        <li>No extra env vars needed for basic search</li>
                        <li><code>PYTHON_VERSION</code> is only used for MkDocs build</li>
                    </ul>
                </article>
                <article class="note-card">
                    <h3>How It Works</h3>
                    <p>Google Play comes from direct web search parsing. App Store comes from Apple iTunes Search API. TapTap and APKPure are best-effort supplemental channel entries.</p>
                </article>
            </div>
        </div>
    </details>
</div>
<div id="feedbackToast" class="feedback-toast" aria-live="polite"></div>

<script>
const searchForm = document.getElementById("gameSearchForm");
const searchInput = document.getElementById("gameSearchInput");
const clearSearchButton = document.getElementById("clearSearchButton");
const searchStatus = document.getElementById("searchStatus");
const resultMeta = document.getElementById("resultMeta");
const resultMount = document.getElementById("resultMount");
const resultPanel = document.getElementById("searchResultPanel");
const feedbackToast = document.getElementById("feedbackToast");
const exampleChips = Array.from(document.querySelectorAll("[data-example]"));
let currentResult = null;
let toastTimer = null;

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function setStatus(type, message) {
    searchStatus.className = `status-box ${type}`;
    searchStatus.textContent = message;
}

function showToast(message) {
    if (!feedbackToast) {
        return;
    }

    feedbackToast.textContent = message;
    feedbackToast.classList.add("visible");

    if (toastTimer) {
        window.clearTimeout(toastTimer);
    }

    toastTimer = window.setTimeout(() => {
        feedbackToast.classList.remove("visible");
    }, 1800);
}

function flashButton(button, label = "Copied") {
    if (!button) {
        return;
    }

    if (!button.dataset.originalLabel) {
        button.dataset.originalLabel = button.textContent;
    }

    button.textContent = label;
    button.classList.add("is-copied");
    button.disabled = true;

    window.setTimeout(() => {
        button.textContent = button.dataset.originalLabel || button.textContent;
        button.classList.remove("is-copied");
        button.disabled = false;
    }, 1200);
}

function setEmptyState(message) {
    resultMount.className = "empty-state";
    resultMount.innerHTML = escapeHtml(message);
}

function updateQueryString(query) {
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete("q");
    if (query) {
        nextUrl.searchParams.set("game", query);
    } else {
        nextUrl.searchParams.delete("game");
    }
    window.history.replaceState({}, "", nextUrl.toString());
}

function scrollToResults() {
    if (!resultPanel) {
        return;
    }

    window.requestAnimationFrame(() => {
        resultPanel.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
}

async function copyText(value, successMessage, button) {
    await navigator.clipboard.writeText(value);
    setStatus("ok", successMessage);
    showToast(successMessage);
    flashButton(button);
}

async function copyTextWithLabel(value, successMessage, button, label) {
    await navigator.clipboard.writeText(value);
    setStatus("ok", successMessage);
    showToast(successMessage);
    flashButton(button, label);
}

async function convertBlobToPng(blob) {
    if (!blob) {
        throw new Error("Image blob is unavailable.");
    }

    if (blob.type === "image/png") {
        return blob;
    }

    const drawToCanvas = async (drawImage) => {
        const canvas = document.createElement("canvas");
        canvas.width = drawImage.width;
        canvas.height = drawImage.height;

        const context = canvas.getContext("2d");
        if (!context) {
            throw new Error("Canvas 2D context is unavailable.");
        }

        context.drawImage(drawImage, 0, 0);

        return await new Promise((resolve, reject) => {
            canvas.toBlob((pngBlob) => {
                if (pngBlob) {
                    resolve(pngBlob);
                    return;
                }

                reject(new Error("PNG conversion failed."));
            }, "image/png");
        });
    };

    if (typeof createImageBitmap === "function") {
        const bitmap = await createImageBitmap(blob);
        try {
            return await drawToCanvas(bitmap);
        } finally {
            if (typeof bitmap.close === "function") {
                bitmap.close();
            }
        }
    }

    const objectUrl = URL.createObjectURL(blob);
    try {
        const image = await new Promise((resolve, reject) => {
            const element = new Image();
            element.onload = () => resolve(element);
            element.onerror = () => reject(new Error("Image decode failed."));
            element.src = objectUrl;
        });

        return await drawToCanvas(image);
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

async function copyImage(imageUrl, successMessage, fallbackMessage, button) {
    try {
        if (!window.ClipboardItem || !navigator.clipboard || typeof navigator.clipboard.write !== "function") {
            throw new Error("Clipboard image copy is not supported.");
        }

        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Image fetch failed: ${response.status}`);
        }

        const blob = await response.blob();
        const clipboardBlob = await convertBlobToPng(blob);
        await navigator.clipboard.write([
            new ClipboardItem({
                "image/png": clipboardBlob
            })
        ]);
        setStatus("ok", successMessage);
        showToast(successMessage);
        flashButton(button);
    } catch (error) {
        await copyTextWithLabel(imageUrl, fallbackMessage, button, "Link copied");
    }
}

function renderResultCard(result) {
    const summary = result.summary
        ? `<div class="summary-box">${escapeHtml(result.summary)}</div>`
        : "";
    const related = Array.isArray(result.related) && result.related.length
        ? `
            <div class="channel-section">
                <p class="section-title">Related Matches</p>
                <div class="related-list">
                    ${result.related.map((entry) => `<span class="related-item">${escapeHtml(entry.title)}${entry.packageName ? ` · ${escapeHtml(entry.packageName)}` : ""}</span>`).join("")}
                </div>
            </div>
        `
        : "";

    resultMount.className = "";
    resultMount.innerHTML = `
        <article class="result-card">
            <div class="result-top">
                <img class="result-icon" src="${escapeHtml(result.icon || "")}" alt="${escapeHtml(result.title)} icon" referrerpolicy="no-referrer" onerror="this.alt='';this.classList.add('is-broken');">
                <div>
                    <h2 class="result-title">${escapeHtml(result.title)}</h2>
                    <p class="result-subtitle">Best match for this search${result.matchSource ? ` · Source: ${escapeHtml(result.matchSource)}` : ""}</p>
                </div>
            </div>

            ${summary}

            <div class="package-box">
                <strong>Package Name</strong>
                <div class="package-value">${escapeHtml(result.packageName || "Unavailable")}</div>
                <div class="button-row">
                    <button class="copy-button" type="button" data-copy="package">Copy package</button>
                    <button class="copy-button alt" type="button" data-copy="icon">Copy icon</button>
                    <button class="copy-button alt" type="button" data-copy="icon-link">Copy icon link</button>
                </div>
            </div>

            <div class="channel-section">
                <p class="section-title">Download Channels</p>
                <div class="channel-list">
                    ${result.channels.map((channel, index) => `
                        <div class="channel-item">
                            <div>
                                <strong>${escapeHtml(channel.name)}</strong>
                                <span>${escapeHtml(channel.note || channel.url)}</span>
                            </div>
                            <a class="channel-link" href="${escapeHtml(channel.url)}" target="_blank" rel="noopener">Open link</a>
                            <button class="channel-copy-button" type="button" data-copy="channel" data-channel-index="${index}">Copy link</button>
                        </div>
                    `).join("")}
                </div>
            </div>

            ${related}
        </article>
    `;
}

async function runSearch(query) {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
        currentResult = null;
        updateQueryString("");
        resultMeta.textContent = "The API route for this page is /api/game-search?q=....";
        setStatus("info", "Ready. Enter a game name to search.");
        setEmptyState("Search results will appear here.");
        return;
    }

    setStatus("info", `Searching for "${trimmedQuery}"...`);
    resultMeta.textContent = "Aggregating channels from Google Play, App Store, TapTap, and APKPure.";
    resultMount.className = "empty-state";
    resultMount.textContent = "Searching...";

    try {
        const requestUrl = new URL("/api/game-search", window.location.origin);
        requestUrl.searchParams.set("q", trimmedQuery);
        requestUrl.searchParams.set("_t", String(Date.now()));

        const response = await fetch(requestUrl.toString(), {
            headers: {
                "Accept": "application/json"
            },
            cache: "no-store"
        });
        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload.error || "Search request failed.");
        }

        updateQueryString(trimmedQuery);

        if (!payload.result) {
            currentResult = null;
            resultMeta.textContent = "No aggregated result was found for this query.";
            setStatus("warn", payload.message || "No matching game was found.");
            setEmptyState("No matching game was found. Try another title or a more specific keyword.");
            scrollToResults();
            return;
        }

        currentResult = payload.result;
        resultMeta.textContent = payload.generatedAt
            ? `Updated at ${new Date(payload.generatedAt).toLocaleString()}`
            : "Search completed.";
        setStatus("ok", payload.message || `Found a best match for "${trimmedQuery}".`);
        renderResultCard(payload.result);
        scrollToResults();
    } catch (error) {
        currentResult = null;
        console.error(error);
        resultMeta.textContent = "The backend search route returned an error.";
        setStatus("error", error.message || "Search failed.");
        setEmptyState("Search failed. Please retry in a moment or check the Cloudflare function logs.");
        scrollToResults();
    }
}

searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    runSearch(searchInput.value);
});

clearSearchButton.addEventListener("click", () => {
    searchInput.value = "";
    runSearch("");
    searchInput.focus();
});

exampleChips.forEach((chip) => {
    chip.addEventListener("click", () => {
        searchInput.value = chip.dataset.example || "";
        runSearch(searchInput.value);
    });
});

resultMount.addEventListener("click", async (event) => {
    const trigger = event.target.closest("[data-copy]");
    if (!trigger || !currentResult) {
        return;
    }

    try {
        if (trigger.dataset.copy === "package") {
            if (!currentResult.packageName) {
                setStatus("warn", "This result does not include a package name.");
                showToast("This result does not include a package name.");
                return;
            }
            await copyText(currentResult.packageName, "Package name copied.", trigger);
            return;
        }

        if (trigger.dataset.copy === "icon") {
            if (!currentResult.icon) {
                setStatus("warn", "This result does not include an icon.");
                showToast("This result does not include an icon.");
                return;
            }
            await copyImage(
                currentResult.icon,
                "Icon copied to clipboard.",
                "The browser blocked direct image copy, so the icon link was copied instead.",
                trigger
            );
            return;
        }

        if (trigger.dataset.copy === "icon-link") {
            if (!currentResult.icon) {
                setStatus("warn", "This result does not include an icon link.");
                showToast("This result does not include an icon link.");
                return;
            }
            await copyText(currentResult.icon, "Icon link copied.", trigger);
            return;
        }

        if (trigger.dataset.copy === "channel") {
            const channelIndex = Number(trigger.dataset.channelIndex);
            const channel = currentResult.channels[channelIndex];
            if (!channel) {
                setStatus("warn", "This channel link is unavailable.");
                showToast("This channel link is unavailable.");
                return;
            }
            await copyText(channel.url, `${channel.name} link copied.`, trigger);
        }
    } catch (error) {
        console.error(error);
        setStatus("error", "Copy failed. The browser may be blocking clipboard access.");
        showToast("Copy failed. The browser may be blocking clipboard access.");
    }
});

function normalizeInitialQuery(query) {
    return String(query || "")
        .replace(/\+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

async function runInitialSearch(query) {
    const normalizedQuery = normalizeInitialQuery(query);
    if (!normalizedQuery) {
        return;
    }

    searchInput.value = normalizedQuery;
    await runSearch(normalizedQuery);

    if (!currentResult && normalizedQuery !== query) {
        searchInput.value = query;
        await runSearch(query);
    }
}

const initialParams = new URLSearchParams(window.location.search);
const initialQuery = initialParams.get("game") || initialParams.get("q") || "";
if (initialQuery) {
    if (initialParams.get("q")) {
        updateQueryString(initialQuery);
    }
runInitialSearch(initialQuery);
}
</script>
