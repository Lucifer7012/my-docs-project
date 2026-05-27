# 🎮 Game Support & Troubleshooting

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
        <p style="font-size: 0.85em; color: #666; margin-bottom: 8px;">Tips: Search by keywords (e.g., "nightcrows", "pokemongo") - No spaces needed.</p>
        <input type="text" id="gameSearch" onkeyup="checkGame()" placeholder="Type game name here..."
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
        </ul>
</div>

<script>
const supportedGames = [
    "七龙珠爆裂激战(ドッカン)", "RagnarokVReturns", "eosblack", "Primitive Brothers", "grandchase", "puni", "12skyreborn", "odin", "god of high school", "avatara", "Three Kingdoms All-star : Idle", "Ares: Rise of Guardians", "Limbus company", "ymir", "Rumble Heroes", "archeage war", "Gransagaidle", "menu", "poring-rush", "Midgard Heroes: Ragnarok Idle", "Luna Origin", "PokemonGO", "raven2", "The world of magic", "Immortal Rising 2", "ROM", "Slayer Legend", "Cookierun：tower of adventures/CookieRun india/Cookie Run: Kingdom", "12sky/TwelveskyM", "12SKY: LAST Ember", "night crows---VM", "night crows---API", "night crows---ROOTED", "ONEPIECEバウンティラッシュ", "play together", "taming master", "Moonlight Sculptor: DarkGamer", "siege rumble", "Pixel Heroes ldle", "Free fire", "ログウィズ（Rogue with the Dead）", "GoGoWolf", "Rom golden age", "阿瑞斯: 命運的選擇者", "oldschool ragnarok online revo classic(osro revo)", "Good Old Days", "Forsaken Legacy", "World Classlc", "Ghost M Global", "blue protocol star resonance", "TOSM Extreme(Tree of Savior M Extreme)", "Rise Online World Mobile", "Philippines RO", "12skym global", "Legend Slime", "Topfollow", "roblox vn/roblox", "night crows---screen Upsidedown", "tiktok", "서머너즈워 러쉬요/Summoners war: Rush", "world of miracle/WOM", "RF ONLINE NEXT/RF 온라인 넥스트", "Once Human", "Infinity Nikki(无限暖暖)", "Arknight:endfield(明日方舟：终末地)","Let's Go Legends(레츠고레전드)","Zeny Classic","rasalas/라살라스","Royale"
];

const discordLink = "https://discord.gg/HKaKdA5ChG";

// 自动填充底部的全量表格 (Populate full list)
document.getElementById('fullGameList').innerHTML = supportedGames.sort().map(g => `<li>${g}</li>`).join('');

function checkGame() {
    const inputRaw = document.getElementById('gameSearch').value;
    // 升级版过滤：同时去除空格 (\s)、单引号 (') 和双引号 (")
    const inputClean = inputRaw.replace(/[\s'"]+/g, '').toLowerCase();
    const resultArea = document.getElementById('resultMessage');

    if (inputClean.length === 0) {
        resultArea.innerHTML = '<div style="padding: 20px; border-radius: 8px; background: white; border: 1px dashed #ccc; text-align: center; color: #888;">Results will appear here...</div>';
        return;
    }

    const matches = supportedGames.filter(game => {
        // 数据库里的游戏名也同步去除空格和引号，确保匹配一致
        const gameClean = game.replace(/[\s'"]+/g, '').toLowerCase();
        return gameClean.includes(inputClean);
    });

    if (matches.length > 0) {
        resultArea.innerHTML = `
            <div style="padding: 15px; background: #e8f5e9; border-radius: 8px; border: 1px solid #c8e6c9;">
                <p style="color: #2e7d32; font-weight: bold; margin-bottom: 10px;">✅ Supported Matches:</p>
                <ul style="margin-bottom: 15px; padding-left: 20px;">
                    ${matches.map(m => `<li style="margin-bottom:4px;">${m}</li>`).join('')}
                </ul>
                <p style="font-size: 0.9em; border-top: 1px solid #c8e6c9; padding-top: 10px;">
                    Provide your <b>Error Screenshot</b> and <b>VMID</b> on Discord.
                </p>
                <a href="${discordLink}" target="_blank" style="display: inline-block; background: #5865F2; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold; margin-top: 5px;">Submit to Discord</a>
            </div>`;
    } else {
        resultArea.innerHTML = `
            <div style="padding: 15px; background: #ffebee; border-radius: 8px; border: 1px solid #ffcdd2; text-align: center;">
                <p style="color: #c62828; font-weight: bold;">❓ Unknown Status</p>
                <p style="font-size: 0.9em;">We couldn't find a direct match for <b>"${inputRaw}"</b>. Please contact support via Discord.</p>
                <a href="${discordLink}" target="_blank" style="display: inline-block; background: #5865F2; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold; margin-top: 5px;">Contact Tech Support</a>
            </div>`;
    }
}
</script>
