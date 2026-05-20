# 🔄 Equipment Upgrade Calculator

Enter your remaining days or the current expiry time. Minimum remaining time: 2 days. In expiry mode, you can also add an existing target expiry time to merge both devices into one target device. Rules: 5d→7d, 10d→15d, 25d→30d, 35d→90d tier, 120d→180d tier, 200d→365d, 366d→365d.

<style>
    .upgrade-calculator {
        background-color: #f8f9fa;
        border-radius: 10px;
        color: #333;
        padding: 20px;
    }

    .upgrade-row {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 15px;
    }

    .upgrade-row label,
    .mode-option {
        align-items: center;
        display: inline-flex;
        gap: 6px;
    }

    .upgrade-calculator select,
    .upgrade-calculator input {
        border: 1px solid #c7c7c7;
        border-radius: 2px;
        padding: 5px;
    }

    .upgrade-calculator input[type="number"] {
        width: 110px;
    }

    .upgrade-calculator input[type="text"] {
        width: min(260px, 100%);
    }

    .calculate-button {
        background-color: #2196F3;
        border: 0;
        border-radius: 5px;
        color: #fff;
        cursor: pointer;
        padding: 10px 20px;
    }

    .result-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
    }

    .result-card {
        border-left: 4px solid var(--accent-color);
        flex: 1 1 220px;
        min-width: 220px;
        padding-left: 10px;
    }

    .result-card h4 {
        color: var(--accent-color);
        margin: 0;
    }

    .result-card p {
        margin: 5px 0;
    }

    .result-value {
        color: #2e7d32;
        font-size: 1.1em;
        font-weight: 700;
        line-height: 1.5;
    }

    .merge-note {
        color: #666;
        font-size: 0.9em;
        margin: -8px 0 15px;
    }
</style>

<div class="upgrade-calculator">
    <div class="upgrade-row">
        <label>Current Type:
            <select id="currentType">
                <option value="U">UVIP</option>
                <option value="G">GVIP</option>
                <option value="K">KVIP</option>
                <option value="M">MVIP</option>
            </select>
        </label>
        <span>→</span>
        <label>Target Type:
            <select id="targetType">
                <option value="G">GVIP</option>
                <option value="K">KVIP</option>
                <option value="M">MVIP</option>
                <option value="S">SVIP</option>
            </select>
        </label>
    </div>

    <div class="upgrade-row">
        <label class="mode-option">
            <input type="radio" name="calculationMode" value="days" checked onchange="toggleCalculationMode()">
            Remaining Days
        </label>
        <label class="mode-option">
            <input type="radio" name="calculationMode" value="expiry" onchange="toggleCalculationMode()">
            Expiry Time
        </label>
    </div>

    <div class="upgrade-row" id="daysInputRow">
        <label>Remaining Days:
            <input type="number" id="daysInput" placeholder="e.g. 20" min="2" step="0.01">
        </label>
    </div>

    <div class="upgrade-row" id="expiryInputRow" style="display: none;">
        <label>Current Expiry Time:
            <input type="text" id="expiryInput" placeholder="2026-05-19 21:33:00">
        </label>
    </div>

    <div class="upgrade-row" id="existingTargetInputRow" style="display: none;">
        <label>Existing Target Expiry Time:
            <input type="text" id="existingTargetExpiryInput" placeholder="optional, e.g. 2026-06-20 12:00:00">
        </label>
    </div>

    <p class="merge-note" id="mergeNote" style="display: none;">Leave existing target expiry blank if you only need the upgraded expiry time.</p>

    <button class="calculate-button" onclick="calculateUpgrade()">Calculate</button>
    <hr>
    <div id="resultArea" style="margin-top: 15px;"><p style="color: #666;">Results will appear here...</p></div>
</div>

<script>
const ratesData = {
    "Standard": {
        "UG": [0.9, 0.9, 0.9, 0.8, 0.8, 0.8, 0.9],
        "UK": [0.7, 0.6, 0.9, 0.8, 0.7, 0.7, 0.9],
        "UM": [0.4, 0.4, 0.4, 0.6, 0.5, 0.4, 0.5],
        "US": [0.3, 0.4, 0.4, 0.4, 0.3, 0.3, 0.3],
        "GK": [0.8, 0.7, 1.0, 1.0, 0.9, 0.8, 1.0],
        "GM": [0.4, 0.5, 0.5, 0.7, 0.6, 0.5, 0.5],
        "GS": [0.3, 0.4, 0.4, 0.5, 0.4, 0.3, 0.3],
        "KM": [0.6, 0.7, 0.5, 0.7, 0.6, 0.7, 0.5],
        "KS": [0.4, 0.6, 0.4, 0.5, 0.5, 0.4, 0.3],
        "MS": [0.7, 0.9, 0.9, 0.7, 0.7, 0.6, 0.6]
    },
    "Promotion": {
        "UG": [0.9, 0.9, 0.9, 0.9, 0.9, 0.8, 0.9],
        "UK": [0.7, 0.6, 0.9, 0.8, 0.6, 0.7, 0.9],
        "UM": [0.4, 0.4, 0.4, 0.5, 0.4, 0.4, 0.5],
        "US": [0.3, 0.4, 0.4, 0.3, 0.3, 0.3, 0.3],
        "GK": [0.8, 0.7, 1.0, 0.9, 0.7, 0.8, 1.0],
        "GM": [0.4, 0.5, 0.5, 0.6, 0.5, 0.5, 0.5],
        "GS": [0.3, 0.4, 0.4, 0.4, 0.3, 0.3, 0.3],
        "KM": [0.6, 0.7, 0.5, 0.7, 0.7, 0.7, 0.5],
        "KS": [0.4, 0.6, 0.4, 0.4, 0.5, 0.4, 0.3],
        "MS": [0.7, 0.9, 0.9, 0.7, 0.7, 0.6, 0.6]
    }
};

const tierValues = [1, 7, 15, 30, 90, 180, 365];

function toggleCalculationMode() {
    const mode = getCalculationMode();
    document.getElementById('daysInputRow').style.display = mode === 'days' ? 'flex' : 'none';
    document.getElementById('expiryInputRow').style.display = mode === 'expiry' ? 'flex' : 'none';
    document.getElementById('existingTargetInputRow').style.display = mode === 'expiry' ? 'flex' : 'none';
    document.getElementById('mergeNote').style.display = mode === 'expiry' ? 'block' : 'none';
    document.getElementById('resultArea').innerHTML = "<p style='color: #666;'>Results will appear here...</p>";
}

function getCalculationMode() {
    return document.querySelector('input[name="calculationMode"]:checked').value;
}

function getTier(inputDays) {
    if (inputDays <= 1) return 1;
    if (inputDays <= 7) return 7;
    if (inputDays <= 15) return 15;
    if (inputDays <= 30) return 30;
    if (inputDays <= 90) return 90;
    if (inputDays <= 180) return 180;
    return 365;
}

function parseExpiryDate(value) {
    const match = value.trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);

    if (!match) return null;

    const [, year, month, day, hour = "0", minute = "0", second = "0"] = match;
    const date = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second)
    );

    if (
        date.getFullYear() !== Number(year) ||
        date.getMonth() !== Number(month) - 1 ||
        date.getDate() !== Number(day) ||
        date.getHours() !== Number(hour) ||
        date.getMinutes() !== Number(minute) ||
        date.getSeconds() !== Number(second)
    ) {
        return null;
    }

    return date;
}

function formatDuration(totalDays) {
    const totalMinutes = Math.max(0, Math.round(totalDays * 24 * 60));
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) {
        return minutes > 0 ? `${days}d ${hours}h ${minutes}m` : `${days}d ${hours}h`;
    }

    return `${hours}h ${minutes}m`;
}

function pad(value) {
    return String(value).padStart(2, '0');
}

function formatDateTime(date) {
    return [
        date.getFullYear(),
        pad(date.getMonth() + 1),
        pad(date.getDate())
    ].join('-') + ' ' + [
        pad(date.getHours()),
        pad(date.getMinutes()),
        pad(date.getSeconds())
    ].join(':');
}

function getTypeLabel(type) {
    return {
        U: 'UVIP',
        G: 'GVIP',
        K: 'KVIP',
        M: 'MVIP',
        S: 'SVIP'
    }[type] || type;
}

function getInputState() {
    const mode = getCalculationMode();

    if (mode === 'days') {
        const inputDays = parseFloat(document.getElementById('daysInput').value);

        if (isNaN(inputDays) || inputDays < 2) {
            return { error: "❌ Error: Minimum 2 days remaining required." };
        }

        return { mode, inputDays, now: new Date() };
    }

    const expiryDate = parseExpiryDate(document.getElementById('expiryInput').value);

    if (!expiryDate) {
        return { error: "❌ Error: Enter a valid expiry time, such as 2026-05-19 21:33:00." };
    }

    const now = new Date();
    const inputDays = (expiryDate.getTime() - now.getTime()) / 86400000;

    if (inputDays <= 0) {
        return { error: "❌ Error: The expiry time must be later than the current time." };
    }

    if (inputDays < 2) {
        return { error: "❌ Error: Minimum 2 days remaining required." };
    }

    const existingTargetValue = document.getElementById('existingTargetExpiryInput').value.trim();

    if (!existingTargetValue) {
        return { mode, inputDays, now, expiryDate };
    }

    const existingTargetExpiryDate = parseExpiryDate(existingTargetValue);

    if (!existingTargetExpiryDate) {
        return { error: "❌ Error: Enter a valid existing target expiry time, such as 2026-06-20 12:00:00." };
    }

    const existingTargetDays = (existingTargetExpiryDate.getTime() - now.getTime()) / 86400000;

    if (existingTargetDays <= 0) {
        return { error: "❌ Error: The existing target expiry time must be later than the current time." };
    }

    return { mode, inputDays, now, expiryDate, existingTargetExpiryDate, existingTargetDays };
}

function renderResultCard(label, rate, convertedDays, inputState, accentColor) {
    const upgradedExpiryDate = new Date(inputState.now.getTime() + convertedDays * 86400000);

    if (inputState.mode !== 'expiry') {
        return `
            <div class="result-card" style="--accent-color: ${accentColor};">
                <h4>${label}</h4>
                <p>Rate: <b>${rate}</b></p>
                <p class="result-value">${formatDuration(convertedDays)}</p>
            </div>
        `;
    }

    const upgradedExpiryRow = inputState.existingTargetDays
        ? `<p>Upgraded expiry: <b>${formatDateTime(upgradedExpiryDate)}</b></p>`
        : "";
    const mergeRows = inputState.existingTargetDays
        ? `
            <p>Existing target remaining: <b>${formatDuration(inputState.existingTargetDays)}</b></p>
            <p>Existing target expiry: <b>${formatDateTime(inputState.existingTargetExpiryDate)}</b></p>
            <p>Merged duration: <b>${formatDuration(inputState.existingTargetDays + convertedDays)}</b></p>
        `
        : "";
    const mainValue = inputState.existingTargetDays
        ? formatDateTime(new Date(inputState.now.getTime() + (inputState.existingTargetDays + convertedDays) * 86400000))
        : formatDateTime(upgradedExpiryDate);
    const mainLabel = inputState.existingTargetDays ? "Merged expiry" : "Upgraded expiry";

    return `
        <div class="result-card" style="--accent-color: ${accentColor};">
            <h4>${label}</h4>
            <p>Rate: <b>${rate}</b></p>
            <p>Upgraded duration: <b>${formatDuration(convertedDays)}</b></p>
            ${upgradedExpiryRow}
            ${mergeRows}
            <p>${mainLabel}:</p>
            <p class="result-value">${mainValue}</p>
        </div>
    `;
}

function calculateUpgrade() {
    const current = document.getElementById('currentType').value;
    const target = document.getElementById('targetType').value;
    const resultArea = document.getElementById('resultArea');
    const inputState = getInputState();

    if (inputState.error) {
        resultArea.innerHTML = `<span style="color: #d32f2f; font-weight: bold;">${inputState.error}</span>`;
        return;
    }

    const rateKey = current + target;

    if (!ratesData.Standard[rateKey] || !ratesData.Promotion[rateKey]) {
        resultArea.innerHTML = "<span style='color: #d32f2f; font-weight: bold;'>❌ Error: No upgrade rate for this type combination.</span>";
        return;
    }

    const tier = getTier(inputState.inputDays);
    const tierIndex = tierValues.indexOf(tier);
    const sRate = ratesData.Standard[rateKey][tierIndex];
    const pRate = ratesData.Promotion[rateKey][tierIndex];
    const standardDays = inputState.inputDays * sRate;
    const promotionDays = inputState.inputDays * pRate;
    const targetLabel = getTypeLabel(target);
    const mergeMeta = inputState.existingTargetDays
        ? `<br>Existing ${targetLabel} expiry: <b>${formatDateTime(inputState.existingTargetExpiryDate)}</b><br>Existing ${targetLabel} remaining: <b>${formatDuration(inputState.existingTargetDays)}</b>`
        : "";
    const expiryMeta = inputState.mode === 'expiry'
        ? `<p style="font-size: 0.9em; color: #666;">Current time: <b>${formatDateTime(inputState.now)}</b><br>Current expiry: <b>${formatDateTime(inputState.expiryDate)}</b><br>Remaining before upgrade: <b>${formatDuration(inputState.inputDays)}</b>${mergeMeta}</p>`
        : "";

    resultArea.innerHTML = `
        <p style="font-size: 0.9em; color: #666;">Tier: <b>${tier} Days</b></p>
        ${expiryMeta}
        <div class="result-grid">
            ${renderResultCard('Standard', sRate, standardDays, inputState, '#2196F3')}
            ${renderResultCard('Promotion', pRate, promotionDays, inputState, '#ff9800')}
        </div>
    `;
}
</script>
