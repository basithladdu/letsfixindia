let powerDirectoryTask;
let powerDirectory;
let powerControlsBound = false;

const powerState = {
  sort: "assets",
  direction: "desc",
  party: "all",
};

function calculatedPowerBmi(profile) {
  const heightCm = profile.bodyMeasurements.heightCm;
  const weightKg = profile.bodyMeasurements.weightKg;
  if (!Number.isFinite(heightCm) || !Number.isFinite(weightKg) || heightCm <= 0 || weightKg <= 0) return null;
  return weightKg / ((heightCm / 100) ** 2);
}

const powerSorts = {
  assets: {
    label: "declared assets",
    value: (profile) => profile.declaredAssetsInr,
    display: (value) => formatPowerMoney(value),
  },
  liabilities: {
    label: "declared liabilities",
    value: (profile) => profile.declaredLiabilitiesInr,
    display: (value) => formatPowerMoney(value),
  },
  cases: {
    label: "declared pending cases",
    value: (profile) => profile.declaredCriminalCases,
    display: (value) => String(value),
  },
  age: {
    label: "age at 2024 affidavit",
    value: (profile) => profile.affidavitAge,
    display: (value) => `${value}`,
  },
  education: {
    label: "education category",
    value: (profile) => profile.educationCategory,
    display: (value) => value,
  },
  bmi: {
    label: "BMI from published measurements",
    value: calculatedPowerBmi,
    display: (value) => value == null ? "Unavailable" : Number(value).toFixed(1),
  },
  cabinet: {
    label: "PMO Cabinet order",
    value: (profile) => profile.cabinetOrder,
    display: (value) => value === 0 ? "Prime Minister" : `Cabinet ${value}`,
  },
};

function formatPowerMoney(value) {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toLocaleString("en-IN", { maximumFractionDigits: 2 })} cr`;
  }
  if (value >= 100000) {
    return `₹${(value / 100000).toLocaleString("en-IN", { maximumFractionDigits: 2 })} lakh`;
  }
  return `₹${value.toLocaleString("en-IN")}`;
}

function powerCompare(left, right) {
  const definition = powerSorts[powerState.sort];
  const leftValue = definition.value(left);
  const rightValue = definition.value(right);
  const leftMissing = leftValue == null;
  const rightMissing = rightValue == null;
  if (leftMissing || rightMissing) {
    if (leftMissing && rightMissing) return left.cabinetOrder - right.cabinetOrder;
    return leftMissing ? 1 : -1;
  }
  let result;
  if (typeof leftValue === "string") {
    result = leftValue.localeCompare(rightValue, "en-IN", { sensitivity: "base" });
  } else {
    result = leftValue - rightValue;
  }
  if (result === 0) return left.cabinetOrder - right.cabinetOrder;
  return powerState.direction === "asc" ? result : -result;
}

function renderPowerSummary(profiles) {
  const summary = document.getElementById("powerSummary");
  if (!summary) return;
  const totalAssets = profiles.reduce((sum, profile) => sum + profile.declaredAssetsInr, 0);
  const totalCases = profiles.reduce((sum, profile) => sum + profile.declaredCriminalCases, 0);
  const bmiCount = profiles.filter((profile) => calculatedPowerBmi(profile) != null).length;
  summary.innerHTML = `
    <article><strong>${profiles.length}</strong><span>profiles</span></article>
    <article><strong>${formatPowerMoney(totalAssets)}</strong><span>combined declared assets</span></article>
    <article><strong>${totalCases}</strong><span>declared pending cases</span></article>
    <article><strong>${bmiCount}/${profiles.length}</strong><span>published BMI coverage</span></article>
  `;
}

function renderPowerParties(profiles) {
  const select = document.getElementById("powerParty");
  if (!select || select.options.length > 1) return;
  const parties = [...new Set(profiles.map((profile) => profile.partyCode))].sort();
  select.insertAdjacentHTML("beforeend", parties.map((party) => `<option value="${esc(party)}">${esc(party)}</option>`).join(""));
}

function renderPowerCard(profile, rank, maxMetric) {
  const definition = powerSorts[powerState.sort];
  const selectedValue = definition.value(profile);
  const numericValue = typeof selectedValue === "number" ? selectedValue : null;
  const barWidth = numericValue == null || numericValue <= 0 || maxMetric <= 0 ? 0 : Math.max(2, (numericValue / maxMetric) * 100);
  const body = profile.bodyMeasurements;
  const bmi = calculatedPowerBmi(profile);
  const bodyValue = (value, suffix) => value == null ? "Not in reviewed sources" : `${value}${suffix}`;
  return `
    <article class="power-card" data-profile-id="${esc(profile.id)}">
      <div class="power-portrait">
        <img src="${esc(profile.photo.path)}" alt="Portrait of ${esc(profile.name)}" width="220" height="260" loading="${rank != null && rank < 3 ? "eager" : "lazy"}" decoding="async">
        <span aria-label="${rank == null ? "No BMI rank" : `Rank ${rank}`}">${rank == null ? "—" : rank}</span>
      </div>
      <div class="power-card-body">
        <header>
          <div class="power-tags"><span>${esc(profile.partyCode)}</span><span>${esc(profile.constituency)}, ${esc(profile.state)}</span></div>
          <h3>${esc(profile.name)}</h3>
          <p>${esc(profile.role)}</p>
        </header>

        <div class="power-selected-metric">
          <span>${esc(definition.label)}</span>
          <strong>${esc(definition.display(selectedValue))}</strong>
          <i style="--power-bar:${barWidth}%" aria-hidden="true"></i>
        </div>

        <dl class="power-facts">
          <div><dt>Assets</dt><dd>${esc(formatPowerMoney(profile.declaredAssetsInr))}</dd></div>
          <div><dt>Liabilities</dt><dd>${esc(formatPowerMoney(profile.declaredLiabilitiesInr))}</dd></div>
          <div><dt>Cases</dt><dd>${profile.declaredCriminalCases} declared</dd></div>
          <div><dt>Age</dt><dd>${profile.affidavitAge} in affidavit</dd></div>
          <div class="power-fact-wide"><dt>Education</dt><dd>${esc(profile.educationCategory)}</dd></div>
        </dl>

        <div class="power-body-data" aria-label="Published body measurements">
          <span>Height <strong>${esc(bodyValue(body.heightCm, " cm"))}</strong></span>
          <span>Weight <strong>${esc(bodyValue(body.weightKg, " kg"))}</strong></span>
          <span>BMI <strong>${bmi == null ? "Not calculated" : bmi.toFixed(1)}</strong></span>
        </div>

        <details class="power-profile-details">
          <summary>Affidavit detail</summary>
          <p><strong>Education:</strong> ${esc(profile.educationDetail)}</p>
          <p><strong>Profession:</strong> ${esc(profile.selfProfession)}</p>
          <p>Figures are candidate-declared Lok Sabha 2024 affidavit data; they are not current net-worth or conviction findings.</p>
        </details>

        <div class="power-sources" aria-label="Sources for ${esc(profile.name)}">
          <a href="${esc(profile.affidavitUrl)}" target="_blank" rel="noopener">Affidavit</a>
          <a href="${esc(powerDirectory.roleSnapshot.url)}" target="_blank" rel="noopener">Role</a>
          <a href="${esc(profile.photo.sourceUrl)}" target="_blank" rel="noopener">Photo · ${esc(profile.photo.author)}</a>
          <a href="${esc(profile.photo.licenseUrl)}" target="_blank" rel="noopener">License · ${esc(profile.photo.license)}</a>
        </div>
      </div>
    </article>
  `;
}

function renderPowerProfiles() {
  if (!powerDirectory) return;
  const grid = document.getElementById("powerGrid");
  const count = document.getElementById("powerResultCount");
  const caption = document.getElementById("powerMetricCaption");
  if (!grid) return;
  const filtered = powerDirectory.profiles
    .filter((profile) => powerState.party === "all" || profile.partyCode === powerState.party)
    .sort(powerCompare);
  const definition = powerSorts[powerState.sort];
  const numericValues = filtered.map(definition.value).filter((value) => typeof value === "number");
  const maxMetric = numericValues.length ? Math.max(...numericValues) : 0;
  const directionLabel = powerState.direction === "asc" ? "ascending" : "descending";
  const directionButton = document.getElementById("powerDirection");
  if (directionButton) directionButton.disabled = powerState.sort === "bmi";
  if (count) count.textContent = `${filtered.length} profile${filtered.length === 1 ? "" : "s"}`;
  if (caption) {
    caption.textContent = powerState.sort === "bmi"
      ? `BMI ranking is empty among ${filtered.length} selected profiles: no profile has both a sourced height and sourced weight.`
      : `Ranked by ${definition.label}, ${directionLabel}, among ${filtered.length} selected 2024 affidavit profiles. Roles as of 25 July 2026; missing values last.`;
  }
  let previousValue;
  let currentRank = 0;
  const cards = filtered.map((profile, index) => {
    const value = definition.value(profile);
    if (index === 0 || value !== previousValue) currentRank = index + 1;
    previousValue = value;
    return renderPowerCard(profile, powerState.sort === "bmi" ? null : currentRank, maxMetric);
  });
  grid.innerHTML = filtered.length
    ? cards.join("")
    : `<div class="empty-state">No profiles match this party filter.</div>`;
  grid.setAttribute("aria-busy", "false");
}

function bindPowerControls() {
  if (powerControlsBound) return;
  const sort = document.getElementById("powerSort");
  const party = document.getElementById("powerParty");
  const direction = document.getElementById("powerDirection");
  sort?.addEventListener("change", () => {
    powerState.sort = sort.value;
    renderPowerProfiles();
  });
  party?.addEventListener("change", () => {
    powerState.party = party.value;
    renderPowerProfiles();
  });
  direction?.addEventListener("click", () => {
    powerState.direction = powerState.direction === "desc" ? "asc" : "desc";
    direction.dataset.direction = powerState.direction;
    direction.textContent = powerState.direction === "asc" ? "Ascending" : "Descending";
    direction.setAttribute("aria-label", `Change to ${powerState.direction === "asc" ? "descending" : "ascending"} order`);
    renderPowerProfiles();
  });
  powerControlsBound = true;
}

async function renderWhoRunsIndia() {
  const grid = document.getElementById("powerGrid");
  if (!grid) return;
  try {
    await loadStylesheetOnce("/styles/11-who-runs-india.css?v=20260827-1");
    if (!powerDirectoryTask) powerDirectoryTask = loadJson("data/politicians.json");
    powerDirectory = await powerDirectoryTask;
    renderPowerSummary(powerDirectory.profiles);
    renderPowerParties(powerDirectory.profiles);
    bindPowerControls();
    renderPowerProfiles();
  } catch (error) {
    grid.setAttribute("aria-busy", "false");
    grid.innerHTML = `<div class="empty-state">The politician source file did not load. Refresh and try again.</div>`;
    console.error("Who runs India route failed:", error);
  }
}

window.LetsFixIndiaPower = {
  render: renderWhoRunsIndia,
  getState: () => ({ ...powerState }),
};
