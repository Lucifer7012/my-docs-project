# 🔄 Equipment Upgrade Calculator

Enter your remaining days. Rules: 5d➔7d, 10d➔15d, 25d➔30d, 35d➔90d tier, 120d➔180d tier, 200d➔365d, 366d➔365d .

<div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; color: #333;">
    <div style="margin-bottom: 15px;">
        <label>Current Type:</label>
        <select id="currentType" style="padding: 5px;">
            <option value="U">UVIP</option>
            <option value="G">GVIP</option>
            <option value="K">KVIP</option>
            <option value="M">MVIP</option>
        </select>
        <span style="margin: 0 10px;">➔</span>
        <label>Target Type:</label>
        <select id="targetType" style="padding: 5px;">
            <option value="G">GVIP</option>
            <option value="K">KVIP</option>
            <option value="M">MVIP</option>
            <option value="S">SVIP</option>
        </select>
    </div>
    <div style="margin-bottom: 15px;">
        <label>Remaining Days:</label>
        <input type="number" id="daysInput" placeholder="e.g. 20" style="padding: 5px; width: 100px;">
    </div>
    <button onclick="calculateUpgrade()" style="background-color: #2196F3; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Calculate</button>
    <hr>
    <div id="resultArea" style="margin-top: 15px;"><p style="color: #666;">Results will appear here...</p></div>
</div>

<script>
function calculateUpgrade() {
    const current = document.getElementById('currentType').value;
    const target = document.getElementById('targetType').value;
    const inputDays = parseInt(document.getElementById('daysInput').value);
    const resultArea = document.getElementById('resultArea');

    if (isNaN(inputDays) || inputDays < 2) {
        resultArea.innerHTML = "<span style='color: #d32f2f; font-weight: bold;'>❌ Error: Minimum 2 days required.</span>";
        return;
    }

    // 1. Tier Mapping
    let tier;
    if (inputDays <= 1) tier = 1;
    else if (inputDays <= 7) tier = 7;
    else if (inputDays <= 15) tier = 15;
    else if (inputDays <= 30) tier = 30; // 20 days maps here
    else if (inputDays <= 90) tier = 90;
    else if (inputDays <= 180) tier = 180;
    else tier = 365;

    const tierIndex = [1, 7, 15, 30, 90, 180, 365].indexOf(tier);
    const rateKey = current + target;

    // 2. UPDATED RATES FROM YOUR LATEST TABLE
    const ratesData = {
        "Standard": {
            "UG": [0.9, 0.9, 0.9, 0.8, 0.8, 0.8, 0.9], // Index 3 (30d) is now 0.8
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
            "UG": [0.9, 0.9, 0.9, 0.9, 0.9, 0.8, 0.9], // Index 3 (30d) is now 0.9
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

    const sRate = ratesData["Standard"][rateKey][tierIndex];
    const pRate = ratesData["Promotion"][rateKey][tierIndex];

    const formatTime = (totalDays) => {
        const d = Math.floor(totalDays);
        const h = Math.round((totalDays - d) * 24);
        return `${d}d ${h}h`;
    };

    resultArea.innerHTML = `
        <p style="font-size: 0.9em; color: #666;">Tier: <b>${tier} Days</b></p>
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
            <div style="flex: 1; border-left: 4px solid #2196F3; padding-left: 10px;">
                <h4 style="margin: 0; color: #2196F3;">Standard</h4>
                <p style="margin: 5px 0;">Rate: <b>${sRate}</b></p>
                <p style="font-size: 1.1em; color: #2e7d32; font-weight: bold;">${formatTime(inputDays * sRate)}</p>
            </div>
            <div style="flex: 1; border-left: 4px solid #ff9800; padding-left: 10px;">
                <h4 style="margin: 0; color: #ff9800;">Promotion</h4>
                <p style="margin: 5px 0;">Rate: <b>${pRate}</b></p>
                <p style="font-size: 1.1em; color: #2e7d32; font-weight: bold;">${formatTime(inputDays * pRate)}</p>
            </div>
        </div>
    `;
}
</script>
