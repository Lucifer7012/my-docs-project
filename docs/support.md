# Game Support & Troubleshooting

If you encounter issues while downloading or launching games, please use this guide.

---

## 1. Common Issues & Solutions

Many common issues can be resolved through server-side configuration by our administrators:

* **Download Issues**: Some games may not appear in the store or fail to download.
* **Launch Failures**: If a game **immediately crashes/closes** after clicking "Open".
* **Error Pop-ups**: If the game shows a **system error or security warning** before starting.

---

## 2. Search Game Compatibility

<div style="background-color: #f8f9fa; padding: 20px; border-radius: 12px; border: 1px solid #e0e0e0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    <div style="margin-bottom: 15px;">
        <p style="font-size: 0.85em; color: #666; margin-bottom: 8px;">Tips: Search by keywords (e.g., "nightcrows", "pokemongo") - no spaces needed.</p>
        <input type="text" id="gameSearch" placeholder="Type game name here..."
               style="width: 100%; padding: 14px; border: 2px solid #2196F3; border-radius: 8px; font-size: 16px; outline: none;">
    </div>
    <div id="resultMessage" style="min-height: 100px;">
        <div style="padding: 20px; border-radius: 8px; background: white; border: 1px dashed #ccc; text-align: center; color: #888;">
            Results will appear here...
        </div>
    </div>
</div>

---

## 3. Guide & VMID

Find your **Device ID (VMID)** at the **top-left corner** of your device screen to help us configure your game.

![VMID Location](images/image_74a93d.jpg)

---

## 4. Full Supported Games List (A-Z)

*If your game is listed here but still crashing, it needs a configuration update.*

<div style="column-count: 2; column-gap: 20px; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #eee;">
    <ul id="fullGameList" style="margin: 0; padding-left: 15px; font-size: 0.85em; color: #444; line-height: 1.6;">
        <li>Loading supported games...</li>
    </ul>
</div>

<script>
const discordLink = "https://discord.gg/HKaKdA5ChG";
const supportedGamesUrl = "../data/supported-games.json";
const resultArea = document.getElementById("resultMessage");
const gameSearchInput = document.getElementById("gameSearch");
const fullGameList = document.getElementById("fullGameList");
let supportedGames = [];

function normalizeText(value) {
    return (value || "")
        .normalize("NFKC")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, "");
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function showEmptyState() {
    resultArea.innerHTML = '<div style="padding: 20px; border-radius: 8px; background: white; border: 1px dashed #ccc; text-align: center; color: #888;">Results will appear here...</div>';
}

function renderFullGameList(games) {
    const sortedGames = [...games].sort((a, b) => a.name.localeCompare(b.name));
    fullGameList.innerHTML = sortedGames
        .map((game) => `<li>${escapeHtml(game.name)}</li>`)
        .join("");
}

function normalizeGameEntry(entry) {
    if (typeof entry === "string") {
        return { name: entry, aliases: [] };
    }

    return {
        name: entry.name,
        aliases: Array.isArray(entry.aliases) ? entry.aliases : []
    };
}

function findMatches(inputRaw) {
    const inputClean = normalizeText(inputRaw);

    if (!inputClean) {
        return [];
    }

    return supportedGames.filter((game) => {
        const terms = [game.name, ...game.aliases];
        return terms.some((term) => normalizeText(term).includes(inputClean));
    });
}

function checkGame() {
    const inputRaw = gameSearchInput.value;
    const matches = findMatches(inputRaw);

    if (!normalizeText(inputRaw)) {
        showEmptyState();
        return;
    }

    if (matches.length > 0) {
        resultArea.innerHTML = `
            <div style="padding: 15px; background: #e8f5e9; border-radius: 8px; border: 1px solid #c8e6c9;">
                <p style="color: #2e7d32; font-weight: bold; margin-bottom: 10px;">Supported Matches:</p>
                <ul style="margin-bottom: 15px; padding-left: 20px;">
                    ${matches.map((game) => `<li style="margin-bottom: 4px;">${escapeHtml(game.name)}</li>`).join("")}
                </ul>
                <p style="font-size: 0.9em; border-top: 1px solid #c8e6c9; padding-top: 10px;">
                    Provide your <b>Error Screenshot</b> and <b>VMID</b> on Discord.
                </p>
                <a href="${discordLink}" target="_blank" style="display: inline-block; background: #5865F2; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold; margin-top: 5px;">Submit to Discord</a>
            </div>`;
    } else {
        resultArea.innerHTML = `
            <div style="padding: 15px; background: #ffebee; border-radius: 8px; border: 1px solid #ffcdd2; text-align: center;">
                <p style="color: #c62828; font-weight: bold;">Unknown Status</p>
                <p style="font-size: 0.9em;">We couldn't find a direct match for <b>"${escapeHtml(inputRaw)}"</b>. Please contact support via Discord.</p>
                <a href="${discordLink}" target="_blank" style="display: inline-block; background: #5865F2; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold; margin-top: 5px;">Contact Tech Support</a>
            </div>`;
    }
}

async function loadSupportedGames() {
    try {
        const response = await fetch(supportedGamesUrl);
        if (!response.ok) {
            throw new Error(`Failed to load supported games: ${response.status}`);
        }

        const payload = await response.json();
        supportedGames = payload
            .map(normalizeGameEntry)
            .filter((game) => typeof game.name === "string" && game.name.trim().length > 0);

        renderFullGameList(supportedGames);
        showEmptyState();
    } catch (error) {
        fullGameList.innerHTML = '<li>Unable to load the supported games list right now.</li>';
        resultArea.innerHTML = '<div style="padding: 15px; background: #fff3cd; border-radius: 8px; border: 1px solid #ffe69c; text-align: center; color: #664d03;">The game list failed to load. Please refresh the page or contact support on Discord.</div>';
        console.error(error);
    }
}

gameSearchInput.addEventListener("input", checkGame);
loadSupportedGames();
</script>
