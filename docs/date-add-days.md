# Date Add Days Calculator

Calculate the new datetime after adding a number of days to a starting datetime.

Example: `2026-07-15 07:40:00 + 180 days = 2027-01-11 07:40:00`

<style>
    .date-calculator {
        background: linear-gradient(135deg, #f7fbff 0%, #eef6ff 100%);
        border: 1px solid #d9e8f7;
        border-radius: 12px;
        color: #223046;
        padding: 22px;
    }

    .date-calculator-row {
        align-items: end;
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
        margin-bottom: 16px;
    }

    .date-calculator label {
        display: flex;
        flex: 1 1 240px;
        flex-direction: column;
        font-weight: 600;
        gap: 6px;
    }

    .date-calculator input {
        border: 1px solid #bfd0e2;
        border-radius: 8px;
        font: inherit;
        padding: 10px 12px;
    }

    .date-calculator input:focus {
        border-color: #2470c7;
        box-shadow: 0 0 0 3px rgba(36, 112, 199, 0.15);
        outline: none;
    }

    .date-calculate-button {
        background: #2470c7;
        border: 0;
        border-radius: 8px;
        color: #fff;
        cursor: pointer;
        font: inherit;
        font-weight: 700;
        padding: 11px 18px;
    }

    .date-calculate-button:hover {
        background: #1c5ca3;
    }

    .date-helper-text {
        color: #59708c;
        font-size: 0.92em;
        margin: 0 0 16px;
    }

    .date-result {
        background: #fff;
        border-radius: 10px;
        margin-top: 18px;
        min-height: 108px;
        padding: 18px;
    }

    .date-result-value {
        color: #1a7f37;
        font-size: 1.25em;
        font-weight: 700;
        margin: 8px 0 0;
        word-break: break-word;
    }

    .date-result-error {
        color: #c62828;
        font-weight: 700;
    }

    .date-result-meta {
        color: #5a6573;
        margin: 6px 0 0;
    }

    @media (max-width: 720px) {
        .date-calculator {
            padding: 16px;
        }

        .date-calculate-button {
            width: 100%;
        }
    }
</style>

<div class="date-calculator">
    <p class="date-helper-text">
        Enter a start datetime in `YYYY-MM-DD HH:MM:SS` format and the number of days to add.
    </p>

    <div class="date-calculator-row">
        <label>
            Start Datetime
            <input type="text" id="startDateTimeInput" value="2026-07-15 07:40:00" placeholder="2026-07-15 07:40:00">
        </label>

        <label>
            Add Days
            <input type="number" id="daysToAddInput" value="180" min="0" step="0.01" placeholder="180">
        </label>

        <button class="date-calculate-button" onclick="calculateAddedDays()">Calculate</button>
    </div>

    <div class="date-result" id="dateAddDaysResult">
        <p class="date-result-meta">The calculated datetime will appear here.</p>
    </div>
</div>

<script>
function parseDateTimeInput(value) {
    const match = value.trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);

    if (!match) {
        return null;
    }

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

function padDatePart(value) {
    return String(value).padStart(2, "0");
}

function formatDateTimeValue(date) {
    return [
        date.getFullYear(),
        padDatePart(date.getMonth() + 1),
        padDatePart(date.getDate())
    ].join("-") + " " + [
        padDatePart(date.getHours()),
        padDatePart(date.getMinutes()),
        padDatePart(date.getSeconds())
    ].join(":");
}

function formatDaysLabel(days) {
    return Number.isInteger(days) ? String(days) : days.toFixed(2).replace(/\.?0+$/, "");
}

function calculateAddedDays() {
    const result = document.getElementById("dateAddDaysResult");
    const startValue = document.getElementById("startDateTimeInput").value;
    const daysValue = document.getElementById("daysToAddInput").value;
    const startDate = parseDateTimeInput(startValue);
    const daysToAdd = Number(daysValue);

    if (!startDate) {
        result.innerHTML = "<p class='date-result-error'>Error: Please enter a valid start datetime, such as 2026-07-15 07:40:00.</p>";
        return;
    }

    if (!Number.isFinite(daysToAdd) || daysValue.trim() === "") {
        result.innerHTML = "<p class='date-result-error'>Error: Please enter a valid number of days.</p>";
        return;
    }

    const resultDate = new Date(startDate.getTime() + daysToAdd * 86400000);

    result.innerHTML = `
        <p><b>Start Datetime:</b> ${formatDateTimeValue(startDate)}</p>
        <p><b>Days Added:</b> ${formatDaysLabel(daysToAdd)}</p>
        <p><b>Result Datetime:</b></p>
        <p class="date-result-value">${formatDateTimeValue(resultDate)}</p>
    `;
}

calculateAddedDays();
</script>
