const INDICATOR_TOPIC_RULES = [
  ["Rights & democracy", ["press", "democracy", "freedom", "internet shutdown", "custod", "prison", "uapa", "sedition", "parliament", "election", "information commission", "rti"]],
  ["Economy & livelihoods", ["gdp", "income", "inflation", "rupee", "unemployment", "employment", "jobs", "labour", "farmer", "agriculture", "wealth", "bank", "debt", "poverty", "food price", "fuel", "msme"]],
  ["Health & welfare", ["health", "hospital", "doctor", "nurse", "maternal", "infant", "malnutrition", "nutrition", "anaemia", "anemia", "stunting", "wasting", "hunger", "life expectancy", "suicide", "sanitation", "vaccin", "insurance"]],
  ["Education & exams", ["education", "school", "student", "teacher", "university", "exam", "neet", "literacy", "learning"]],
  ["Safety & justice", ["crime", "murder", "rape", "violence", "riot", "women", "children", "senior citizen", "police", "court", "conviction", "chargesheet", "death in prison"]],
  ["Infrastructure & environment", ["rail", "road", "bridge", "airport", "electric", "power", "renewable", "coal", "forest", "air pollution", "water", "climate", "disaster", "accident"]],
  ["Governance & institutions", ["corruption", "electoral bond", "ed case", "cbi", "sebi", "institution", "government debt", "tax", "public spending", "fiscal", "budget"]]
];

function indicatorTone(indicator) {
  const direction = String(indicator.direction || "").toLowerCase();
  const adverseSignals = [
    "worse", "red flag", "severe rights", "record low", "wealth concentration", "institutional risk",
    "higher reported volume", "higher reported rate", "higher reported deaths", "higher reported severity",
    "higher prevalence", "higher detention", "higher overcrowding", "higher vacancy", "higher registrations",
    "higher pending", "larger pending", "pending stock", "lower court-disposal", "lower investigation completion",
    "lower internet-freedom", "lower score", "lower rank", "above capacity", "overcrowding pressure",
    "large pending", "capacity gap", "low comparative", "serious hunger", "persistent health burden",
    "persistent access gap", "persistent gender gap", "digital-access gap"
  ];
  if (adverseSignals.some((token) => direction.includes(token))) return "tone-worse";
  const favorableSignals = [
    "better", "improved", "improving", "lower reported volume", "lower official accident", "lower inflation",
    "lower estimated poverty", "lower extreme-poverty", "lower maternal mortality", "lower household share",
    "lower vacancy", "lower reported unemployment", "lower multidimensional poverty", "higher court-disposal",
    "higher participation", "higher access", "higher reported coverage", "higher delivered", "higher formal access",
    "higher representation", "higher innovation", "higher rank", "higher digital usage", "higher capacity",
    "higher employment ratio", "higher nominal earnings", "higher estimated employment", "higher reported ownership",
    "higher connectivity", "government response expansion", "high access coverage"
  ];
  if (favorableSignals.some((token) => direction.includes(token))) return "tone-better";
  return "tone-flat";
}

function indicatorTopic(indicator) {
  const haystack = `${indicator.title || ""} ${indicator.detail || ""}`.toLowerCase();
  const match = INDICATOR_TOPIC_RULES.find(([, tokens]) => tokens.some((token) => haystack.includes(token)));
  return match ? match[0] : "Other national indicators";
}

function indicatorEndpointYear(indicator) {
  const years = (indicator.chart || [])
    .map((point) => Number(String(point.label).match(/(?:19|20)\d{2}/)?.[0]))
    .filter(Number.isFinite);
  return years.length ? Math.max(...years) : 0;
}

function indicatorAnchor(indicator, index) {
  const slug = String(indicator.title || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return `indicator-${slug || index + 1}`;
}

function populateIndicatorTopics() {
  if (!indicatorTopicFilter) return;
  const topics = uniqueSorted(indicators.map(indicatorTopic));
  indicatorTopicFilter.innerHTML = `<option value="all">All topics</option>${topics.map((topic) => `<option value="${esc(topic)}">${esc(topic)}</option>`).join("")}`;
}

function renderStatsOverview() {
  if (!statsOverview) return;
  const counts = indicators.reduce((summary, indicator) => {
    summary[indicatorTone(indicator)] += 1;
    summary.topics.add(indicatorTopic(indicator));
    (indicator.sources || []).forEach((sourceId) => summary.sources.add(sourceId));
    return summary;
  }, { "tone-better": 0, "tone-worse": 0, "tone-flat": 0, topics: new Set(), sources: new Set() });

  statsOverview.innerHTML = `
    <article><span>Indicators</span><strong>${indicators.length}</strong><small>source-backed series and snapshots</small></article>
    <article class="overview-adverse"><span>Adverse signal</span><strong>${counts["tone-worse"]}</strong><small>directional labels, not causal verdicts</small></article>
    <article class="overview-favorable"><span>Favorable signal</span><strong>${counts["tone-better"]}</strong><small>shown alongside adverse movement</small></article>
    <article><span>Coverage</span><strong>${counts.topics.size}</strong><small>topics · ${counts.sources.size} cited source records</small></article>
  `;
}

function renderIndicators() {
  if (!indicatorGrid) return;
  const indicatorAccents = ["#f28c28", "#138808", "#2f6fed", "#b12a8a", "#0f766e", "#c0392b", "#7c5cff", "#a05a2c", "#247ba0", "#d97706"];
  const query = (indicatorSearchInput?.value || "").trim().toLowerCase();
  const topicFilter = indicatorTopicFilter?.value || "all";
  const toneFilter = indicatorToneFilter?.value || "all";
  const sortMode = indicatorSortFilter?.value || "editorial";
  const filtered = indicators.filter((indicator) => {
    const haystack = `${indicator.title} ${indicator.value} ${indicator.detail} ${indicator.direction} ${indicatorTopic(indicator)}`.toLowerCase();
    if (query && !haystack.includes(query)) return false;
    if (topicFilter !== "all" && indicatorTopic(indicator) !== topicFilter) return false;
    if (toneFilter !== "all" && indicatorTone(indicator) !== toneFilter) return false;
    return true;
  });
  if (sortMode === "title") {
    filtered.sort((a, b) => String(a.title).localeCompare(String(b.title)));
  } else if (sortMode === "latest") {
    filtered.sort((a, b) => indicatorEndpointYear(b) - indicatorEndpointYear(a) || String(a.title).localeCompare(String(b.title)));
  }
  const indicatorFilterCount = [query, topicFilter !== "all" ? topicFilter : "", toneFilter !== "all" ? toneFilter : "", sortMode !== "editorial" ? sortMode : ""].filter(Boolean).length;
  if (indicatorResultCount) indicatorResultCount.textContent = `${filtered.length} of ${indicators.length} indicators${indicatorFilterCount ? ` - ${indicatorFilterCount} filter${indicatorFilterCount === 1 ? "" : "s"} active` : ""}`;
  if (clearIndicatorFiltersButton) clearIndicatorFiltersButton.disabled = indicatorFilterCount === 0;
  const visibleIndicators = window.LetsFixIndiaStatistics?.page(filtered) || filtered;
  indicatorGrid.innerHTML = visibleIndicators.length ? visibleIndicators.map((indicator, cardIndex) => {
    const directionTone = indicatorTone(indicator);
    const performanceSignal = directionTone === "tone-better" ? "Green light · favorable movement" : directionTone === "tone-worse" ? "Red flag · adverse movement" : "Caution · mixed movement";
    const pointCount = Array.isArray(indicator.chart) ? indicator.chart.length : 0;
    const sourceCount = Array.isArray(indicator.sources) ? indicator.sources.length : 0;
    const anchor = indicatorAnchor(indicator, cardIndex);
    return `
      <article id="${anchor}" class="indicator ${directionTone}" style="--i:${cardIndex};--stats-delay:${Math.min(cardIndex, 14) * 22}ms;--card-accent:${indicatorAccents[cardIndex % indicatorAccents.length]}" data-indicator-tone="${directionTone}">
        <button class="stats-copy-link" type="button" data-copy-indicator-link="${anchor}" aria-label="Copy link to ${esc(indicator.title)}">Copy link</button>
        <div class="indicator-head">
          <div class="indicator-taxonomy">
            <span class="indicator-topic">${esc(indicatorTopic(indicator))}</span>
            <span class="indicator-signal ${directionTone}">${performanceSignal}</span>
          </div>
          <h3>${esc(indicator.title)}</h3>
          <strong>${esc(indicator.value)}</strong>
          <span class="direction-pill ${directionTone}">${esc(indicator.direction)}</span>
        </div>
        <p>${esc(indicator.detail)}</p>
        <div class="indicator-chart-container" aria-label="${esc(indicator.title)} comparison chart">
          ${generateChartHtml(indicator.chart, directionTone)}
        </div>
        <div class="indicator-data-meta">${pointCount} chart point${pointCount === 1 ? "" : "s"} · ${sourceCount} cited source record${sourceCount === 1 ? "" : "s"}</div>
        <div class="source-links">${sourceLinks(indicator.sources)}</div>
      </article>
    `;
  }).join("") : `
    <div class="stats-empty">
      <strong>No indicators match</strong>
      <p>Try a broader term or remove one of the active filters.</p>
      <button class="clear-filters-button" type="button" data-stats-reset-all>Clear filters</button>
    </div>`;
  window.LetsFixIndiaStatistics?.sync({
    filteredCount: filtered.length,
    totalCount: indicators.length,
    query,
    topic: topicFilter,
    tone: toneFilter,
    sort: sortMode
  });
}


function renderSources() {
  if (!sourceList) return;
  const entries = Object.entries(sources);
  const query = sourceState.query;
  const usage = new Map();
  events.forEach((event) => (event.sources || []).forEach((id) => usage.set(id, (usage.get(id) || 0) + 1)));
  indicators.forEach((indicator) => (indicator.sources || []).forEach((id) => usage.set(id, (usage.get(id) || 0) + 1)));
  voices.forEach((voice) => (voice.stances || []).forEach((stance) => (stance.sources || []).forEach((id) => usage.set(id, (usage.get(id) || 0) + 1))));
  researchBacklog.forEach((item) => (item.sourceKeys || []).forEach((id) => usage.set(id, (usage.get(id) || 0) + 1)));
  const filtered = entries.filter(([id, source]) =>
    (!query || `${id} ${source.title} ${source.publisher} ${source.type}`.toLowerCase().includes(query)) &&
    (sourceState.status === "all" || sourceState.status === sourceFilterStatus(id, source, usage))
  );
  const pending = filtered.filter(([, source]) => !source.url).length;
  const linked = filtered.length - pending;
  const orphaned = filtered.filter(([id]) => !usage.has(id)).length;
  const unusedLinked = filtered.filter(([id, source]) => !usage.has(id) && source.url).length;
  const unusedPending = orphaned - unusedLinked;
  if (sourceAuditCards) {
    const total = entries.length;
    const totalPending = entries.filter(([, source]) => !source.url).length;
    const totalUnusedLinked = entries.filter(([id, source]) => !usage.has(id) && source.url).length;
    const totalUnusedPending = entries.filter(([id, source]) => !usage.has(id) && !source.url).length;
    sourceAuditCards.innerHTML = `
      <article><strong>${total - totalPending}</strong><span>linked URLs</span></article>
      <article><strong>${totalPending}</strong><span>pending URLs</span></article>
      <article><strong>${totalUnusedLinked}</strong><span>unreferenced URLs</span></article>
      <article><strong>${totalUnusedPending}</strong><span>pending placeholders</span></article>
    `;
  }
  if (sourceSummary) {
    sourceSummary.textContent = `${filtered.length} of ${entries.length} source records shown; ${linked} linked; ${pending} awaiting URL verification; ${unusedLinked} unreferenced URLs; ${unusedPending} pending placeholders.`;
  }
  if (clearSourceFiltersButton) {
    clearSourceFiltersButton.disabled = !sourceState.query && sourceState.status === "all";
  }
  if (!filtered.length) {
    sourceList.innerHTML = `<div class="empty-state"><strong>No sources match</strong><p>Try a shorter publisher or title fragment.</p></div>`;
    return;
  }
  sourceList.innerHTML = filtered.map(([id, source]) => `
    <article class="source-item ${usage.has(id) ? "" : "source-orphaned"}">
      <div>
        <span>${source.type}</span>
        <h3>${source.title}</h3>
        <p>${source.publisher}</p>
        <code class="source-id">${esc(id)}</code>
        <small class="source-usage">${usage.has(id) ? `Referenced ${usage.get(id)} time${usage.get(id) === 1 ? "" : "s"} across public records and research backlog` : "Not referenced by a public record or research backlog"}</small>
      </div>
      ${source.url
        ? `<a href="${source.url}" target="_blank" rel="noopener">Open source</a>`
        : `<span class="source-pending">Verification pending</span>`}
    </article>
  `).join("");
}

