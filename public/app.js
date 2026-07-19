let events = [];
let sources = {};
let indicators = [];
let voices = [];
let researchBacklog = [];

const state = {
  query: "",
  category: "all",
  actor: "all",
  status: "all",
  evidence: "all",
  year: "all"
};

const categoryFilter = document.querySelector("#categoryFilter");
const actorFilter = document.querySelector("#actorFilter");
const statusFilter = document.querySelector("#statusFilter");
const evidenceFilter = document.querySelector("#evidenceFilter");
const clearFiltersButton = document.querySelector("#clearFiltersButton");
const searchInput = document.querySelector("#searchInput");
const timelineList = document.querySelector("#timelineList");
const resultCount = document.querySelector("#resultCount");
const evidenceSummary = document.querySelector("#evidenceSummary");
const yearRail = document.querySelector("#yearRail");
const indicatorGrid = document.querySelector("#indicatorGrid");
const indicatorSearchInput = document.querySelector("#indicatorSearchInput");
const indicatorToneFilter = document.querySelector("#indicatorToneFilter");
const indicatorResultCount = document.querySelector("#indicatorResultCount");
const clearIndicatorFiltersButton = document.querySelector("#clearIndicatorFiltersButton");
const sourceList = document.querySelector("#sourceList");
const sourceSummary = document.querySelector("#sourceSummary");
const sourceAuditCards = document.querySelector("#sourceAuditCards");
const sourceSearchInput = document.querySelector("#sourceSearchInput");
const sourceStatusFilter = document.querySelector("#sourceStatusFilter");
const clearSourceFiltersButton = document.querySelector("#clearSourceFiltersButton");
const submissionForm = document.querySelector("#submissionForm");
const submissionQueue = document.querySelector("#submissionQueue");
const tenureValue = document.querySelector("#tenureValue");
const homeRecentList = document.querySelector("#homeRecentList");
const recordView = document.querySelector("#recordView");
const defaultTitle = document.title;
const defaultDescription = document.querySelector('meta[name="description"]');
const defaultDescriptionText = defaultDescription?.content || "";
const routePages = Array.from(document.querySelectorAll("[data-page]"));
const advancedFilters = document.querySelector("#advancedFilters");
const scrollDock = document.querySelector("#scrollDock");
const voicesGrid = document.querySelector("#voicesGrid");
const voicesSummary = document.querySelector("#voicesSummary");
const voicesMeta = document.querySelector("#voicesMeta");
const voiceFieldFilter = document.querySelector("#voiceFieldFilter");
const voiceStanceFilter = document.querySelector("#voiceStanceFilter");
const voiceIssueFilter = document.querySelector("#voiceIssueFilter");
const voiceSearchInput = document.querySelector("#voiceSearchInput");
const clearVoiceFiltersButton = document.querySelector("#clearVoiceFiltersButton");

const voiceState = { query: "", field: "all", stance: "all", issue: "all" };
const sourceState = { query: "", status: "all" };
const renderedPages = new Set();

const sourceFilterStatus = (id, source, usage) => {
  if (source.url) return usage.has(id) ? "linked" : "unused-linked";
  return usage.has(id) ? "pending" : "unused-pending";
};

const TIMELINE_LAST_SCROLL_KEY = "letsFixIndia.timeline.lastY";
const TIMELINE_RETURN_SCROLL_KEY = "letsFixIndia.timeline.returnY";
const TIMELINE_JUMP_ORIGIN_KEY = "letsFixIndia.timeline.jumpOrigin";
let scrollSaveQueued = false;
let filtersWideState = null;
let autoScrollFrame = 0;
let autoScrollActive = false;

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

function esc(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function closestFromEvent(event, selector) {
  return event.target instanceof Element ? event.target.closest(selector) : null;
}

function uniqueSorted(values) {
  return Array.from(new Set(values)).sort((a, b) => String(a).localeCompare(String(b)));
}

function byTimeline(a, b) {
  if (a.year !== b.year) return b.year - a.year;
  return String(b.date).localeCompare(String(a.date));
}

function chipClass(value) {
  const normalized = value.toLowerCase();
  if (normalized.includes("bjp")) return "chip bjp";
  if (normalized.includes("rss") || normalized.includes("abvp") || normalized.includes("hindutva")) return "chip rss";
  if (normalized.includes("sexual")) return "chip sexual";
  if (normalized.includes("security") || normalized.includes("terror")) return "chip security";
  if (normalized.includes("press")) return "chip press";
  if (normalized.includes("education")) return "chip education";
  return "chip";
}

function statusClass(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("convict") || normalized.includes("court")) return "status-pill court";
  if (normalized.includes("official")) return "status-pill official";
  if (normalized.includes("alleged") || normalized.includes("opposition")) return "status-pill alleged";
  if (normalized.includes("investigat") || normalized.includes("charged")) return "status-pill probe";
  if (normalized.includes("index") || normalized.includes("affidavit")) return "status-pill index";
  return "status-pill";
}

function pulseResultCount() {
  if (!resultCount) return;
  resultCount.classList.remove("is-updating");
  void resultCount.offsetWidth;
  resultCount.classList.add("is-updating");
}

function markTimelineRefreshing() {
  if (!timelineList) return;
  timelineList.classList.add("is-refreshing");
  window.setTimeout(() => timelineList.classList.remove("is-refreshing"), 220);
}

function sourceLinks(ids) {
  return Array.from(new Set(ids))
    .map((id) => {
      if (!sources[id]) return "";
      const label = sources[id].publisher
        .replace("Press Information Bureau", "PIB")
        .replace("Reporters Without Borders", "RSF")
        .replace("Association for Democratic Reforms", "ADR")
        .replace("Human Rights Watch", "HRW")
        .replace("Amnesty International", "Amnesty")
        .replace("Election Commission of India", "ECI")
        .replace("National Testing Agency", "NTA");
      const title = esc(sources[id].title);
      if (!sources[id].url) {
        return `<span class="source-pending" title="${title}">${esc(label)}</span>`;
      }
      return `<a href="${sources[id].url}" target="_blank" rel="noopener" title="${title}" aria-label="Open source: ${esc(label)} — ${title}">${esc(label)}</a>`;
    })
    .filter(Boolean)
    .join("");
}

function storedScroll(key) {
  const value = Number(localStorage.getItem(key));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function maxScrollY() {
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
}

function clampScroll(y) {
  return Math.min(Math.max(0, y), maxScrollY());
}

function timelineSavedY() {
  return storedScroll(TIMELINE_RETURN_SCROLL_KEY) || storedScroll(TIMELINE_LAST_SCROLL_KEY);
}

function scrollToY(y, behavior = "smooth") {
  window.scrollTo({ top: clampScroll(y), behavior });
}

function sourceStatus(ids) {
  const uniqueIds = Array.from(new Set(Array.isArray(ids) ? ids : []));
  const linked = uniqueIds.filter((id) => sources[id]?.url).length;
  const pending = uniqueIds.filter((id) => sources[id] && !sources[id].url).length;
  const missing = uniqueIds.filter((id) => !sources[id]).length;
  if (!uniqueIds.length || missing) return { label: missing ? `${missing} missing source record${missing === 1 ? "" : "s"}` : "No source record", className: "missing" };
  if (pending) return { label: `${linked} linked, ${pending} pending`, className: "pending" };
  return { label: `${linked} linked source${linked === 1 ? "" : "s"}`, className: "linked" };
}

function setAutoScroll(active) {
  autoScrollActive = active;
  if (autoScrollFrame) cancelAnimationFrame(autoScrollFrame);
  autoScrollFrame = 0;
  const button = scrollDock?.querySelector("[data-scroll-action='auto']");
  if (button) {
    button.textContent = active ? "Pause reading" : "Auto-scroll";
    button.setAttribute("aria-pressed", String(active));
    button.title = active ? "Pause automatic reading scroll" : "Start automatic reading scroll";
    button.classList.toggle("is-active", active);
  }
  if (!active) return;
  let lastTime = 0;
  const tick = (time) => {
    if (!autoScrollActive) return;
    const atBottom = window.scrollY >= maxScrollY() - 2;
    if (atBottom) {
      setAutoScroll(false);
      return;
    }
    const elapsed = lastTime ? Math.min(50, time - lastTime) : 16;
    lastTime = time;
    window.scrollBy(0, Math.max(1, elapsed * 0.045));
    autoScrollFrame = requestAnimationFrame(tick);
  };
  autoScrollFrame = requestAnimationFrame(tick);
}

function saveTimelineScroll(markReturnPoint = false) {
  if (resolveRoute().page !== "timeline") return;
  const y = Math.round(window.scrollY);
  localStorage.setItem(TIMELINE_LAST_SCROLL_KEY, String(y));
  if (markReturnPoint) {
    localStorage.setItem(TIMELINE_RETURN_SCROLL_KEY, String(y));
  }
}

function updateScrollDock() {
  if (!scrollDock) return;
  const route = resolveRoute();
  const isLongTimeline = route.page === "timeline" && document.documentElement.scrollHeight > window.innerHeight * 1.45;
  scrollDock.hidden = !isLongTimeline;
  scrollDock.classList.toggle("is-visible", isLongTimeline);
  if (!isLongTimeline) return;
  const topButton = scrollDock.querySelector("[data-scroll-action='top']");
  const middleButton = scrollDock.querySelector("[data-scroll-action='saved']");
  const bottomButton = scrollDock.querySelector("[data-scroll-action='bottom']");
  if (topButton) topButton.disabled = window.scrollY < 24;
  if (bottomButton) bottomButton.disabled = window.scrollY > maxScrollY() - 24;
  if (middleButton) {
    const jumpOrigin = storedScroll(TIMELINE_JUMP_ORIGIN_KEY);
    if (jumpOrigin > 24) {
      middleButton.textContent = "Continue";
      middleButton.disabled = false;
      middleButton.classList.add("is-continue");
    } else {
      middleButton.textContent = "Saved spot";
      middleButton.disabled = timelineSavedY() < 24;
      middleButton.classList.remove("is-continue");
    }
  }
}

function restoreTimelineScroll(behavior = "auto") {
  scrollToY(timelineSavedY(), behavior);
}

function syncFilterDisclosure() {
  if (!advancedFilters) return;
  const isWide = window.matchMedia("(min-width: 720px)").matches;
  if (filtersWideState === isWide) return;
  advancedFilters.open = isWide;
  filtersWideState = isWide;
}

function eventUrl(event) {
  return `/record/${encodeURIComponent(event.id)}`;
}

function renderOptions() {
  if (!categoryFilter || !actorFilter || !statusFilter || !yearRail) return;
  const active = events;
  const categories = uniqueSorted(active.map((e) => e.category));
  const actors = uniqueSorted(active.flatMap((e) => e.actors));
  const statuses = uniqueSorted(active.map((e) => e.status));
  categoryFilter.innerHTML = `<option value="all">All categories</option>`;
  actorFilter.innerHTML = `<option value="all">All actors</option>`;
  statusFilter.innerHTML = `<option value="all">All statuses</option>`;
  categoryFilter.insertAdjacentHTML("beforeend", categories.map((c) => `<option value="${c}">${c}</option>`).join(""));
  actorFilter.insertAdjacentHTML("beforeend", actors.map((a) => `<option value="${a}">${a}</option>`).join(""));
  statusFilter.insertAdjacentHTML("beforeend", statuses.map((s) => `<option value="${s}">${s}</option>`).join(""));

  const years = uniqueSorted(active.map((e) => e.year)).sort((a, b) => b - a);
  yearRail.innerHTML = [
    `<button class="year-pill active" data-year="all">All years</button>`,
    ...years.map((year) => `<button class="year-pill" data-year="${year}">${year}</button>`)
  ].join("");
}

function matches(event) {
  const query = state.query.trim().toLowerCase();
  const searchText = [event.title, event.summary, event.outcome, event.category, event.status, event.actors.join(" "), event.year, event.date].join(" ").toLowerCase();
  return (
    (!query || searchText.includes(query)) &&
    (state.category === "all" || event.category === state.category) &&
    (state.actor === "all" || event.actors.includes(state.actor)) &&
    (state.status === "all" || event.status === state.status) &&
    (state.evidence === "all" || sourceStatus(event.sources).className === state.evidence) &&
    (state.year === "all" || String(event.year) === state.year)
  );
}

function renderTimeline() {
  if (!timelineList) return;
  const filtered = events.filter(matches).sort(byTimeline);
  const activeTotal = events.length;
  if (resultCount) resultCount.textContent = `${filtered.length} of ${activeTotal} records`;
  if (evidenceSummary) {
    const linked = filtered.filter((event) => sourceStatus(event.sources).className === "linked").length;
    const pending = filtered.filter((event) => sourceStatus(event.sources).className === "pending").length;
    const missing = filtered.length - linked - pending;
    evidenceSummary.textContent = `${linked} linked • ${pending} pending URLs • ${missing} source gaps`;
  }
  if (clearFiltersButton) {
    clearFiltersButton.disabled = !state.query && state.category === "all" && state.actor === "all" && state.status === "all" && state.evidence === "all" && state.year === "all";
  }
  pulseResultCount();
  markTimelineRefreshing();
  if (!filtered.length) {
    timelineList.innerHTML = `<div class="empty-state">
      <strong>No matching records</strong>
      <p>Clear search text or set filters back to All to widen the timeline.</p>
      <button type="button" class="text-button" data-clear-filters>Clear filters</button>
    </div>`;
    return;
  }

  const grouped = filtered.reduce((map, event) => {
    const year = String(event.year);
    if (!map.has(year)) map.set(year, []);
    map.get(year).push(event);
    return map;
  }, new Map());

  timelineList.innerHTML = Array.from(grouped.entries()).map(([year, yearEvents]) => `
    <section class="year-group" aria-label="${year} records">
      <div class="year-heading">
        <span>${year}</span>
        <b>${yearEvents.length} records</b>
      </div>
      <div class="year-records">
        ${yearEvents.map((event, index) => `
          <article class="event-card ${String(event.severity || "").toLowerCase()}" style="--i:${index}">
            <div class="event-body">
              ${(() => { const evidence = sourceStatus(event.sources); return `<span class="evidence-status ${evidence.className}" title="Evidence link status">${esc(evidence.label)}</span>`; })()}
              <div class="event-meta">
                <span>${esc(event.date)}</span>
                <span class="${statusClass(event.status)}">${esc(event.status)}</span>
              </div>
              <div class="event-title-row">
                <a class="event-title-link" href="${eventUrl(event)}" data-link>${esc(event.title)}</a>
                <div class="source-links source-inline" aria-label="Sources for ${esc(event.title)}">
                  <span>Sources</span>
                  ${sourceLinks(event.sources)}
                </div>
              </div>
              <div class="chips">
                <span class="${chipClass(event.category)}">${esc(event.category)}</span>
                ${event.actors.map((actor) => `<span class="${chipClass(actor)}">${esc(actor)}</span>`).join("")}
              </div>
              <p>${esc(event.summary)}</p>
              <p class="outcome">${esc(event.outcome)}</p>
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `).join("");
}


function renderHomeRecent() {
  if (!homeRecentList) return;
  const recent = [...events].sort(byTimeline).slice(0, 6);
  homeRecentList.innerHTML = recent.map((event) => `
    <a class="recent-row" href="${eventUrl(event)}" data-link>
      <span>${event.year}</span>
      <strong>${event.title}</strong>
      <em>${event.category}</em>
    </a>
  `).join("");
}

function renderIndicators() {
  if (!indicatorGrid) return;
  const indicatorAccents = ["#f28c28", "#138808", "#2f6fed", "#b12a8a", "#0f766e", "#c0392b", "#7c5cff", "#a05a2c", "#247ba0", "#d97706"];
  const query = (indicatorSearchInput?.value || "").trim().toLowerCase();
  const toneFilter = indicatorToneFilter?.value || "all";
  const filtered = indicators.filter((indicator) => {
    const haystack = `${indicator.title} ${indicator.value} ${indicator.detail} ${indicator.direction}`.toLowerCase();
    if (query && !haystack.includes(query)) return false;
    if (toneFilter !== "all") {
      const direction = String(indicator.direction || "").toLowerCase();
      const tone = direction.includes("worse") || direction.includes("higher") || direction.includes("red flag") || direction.includes("pressure") || direction.includes("wealth")
        ? "tone-worse"
        : direction.includes("better") || direction.includes("lower") || direction.includes("improved") ? "tone-better" : "tone-flat";
      if (tone !== toneFilter) return false;
    }
    return true;
  });
  const indicatorFilterCount = [query, toneFilter !== "all" ? toneFilter : ""].filter(Boolean).length;
  if (indicatorResultCount) indicatorResultCount.textContent = `${filtered.length} of ${indicators.length} indicators${indicatorFilterCount ? ` - ${indicatorFilterCount} filter${indicatorFilterCount === 1 ? "" : "s"} active` : ""}`;
  if (clearIndicatorFiltersButton) clearIndicatorFiltersButton.disabled = indicatorFilterCount === 0;
  indicatorGrid.innerHTML = filtered.map((indicator, cardIndex) => {
    const max = Math.max(...indicator.chart.map((item) => item.value));
    const directionTone = String(indicator.direction || "").toLowerCase().includes("worse")
      || String(indicator.direction || "").toLowerCase().includes("higher")
      || String(indicator.direction || "").toLowerCase().includes("red flag")
      || String(indicator.direction || "").toLowerCase().includes("pressure")
      || String(indicator.direction || "").toLowerCase().includes("wealth")
      ? "tone-worse"
      : String(indicator.direction || "").toLowerCase().includes("better")
        || String(indicator.direction || "").toLowerCase().includes("lower")
        || String(indicator.direction || "").toLowerCase().includes("improved")
        ? "tone-better"
        : "tone-flat";
    const performanceSignal = directionTone === "tone-better" ? "Green light · favorable movement" : directionTone === "tone-worse" ? "Red flag · adverse movement" : "Caution · mixed movement";
    return `
      <article class="indicator ${directionTone}" style="--i:${cardIndex};--card-accent:${indicatorAccents[cardIndex % indicatorAccents.length]}" data-indicator-tone="${directionTone}">
        <div class="indicator-head">
          <span class="indicator-signal ${directionTone}">${performanceSignal}</span>
          <span class="direction-pill ${directionTone}">${esc(indicator.direction)}</span>
          <h3>${esc(indicator.title)}</h3>
          <strong>${esc(indicator.value)}</strong>
        </div>
        <p>${esc(indicator.detail)}</p>
        <div class="bars chart-variant-${cardIndex % 3}" aria-label="${esc(indicator.title)} comparison chart">
          ${indicator.chart.map((item, index) => `
            <div class="bar-row">
              <span>${esc(item.label)}</span>
              <div class="bar-track"><div class="bar-fill" style="width:${Math.max(8, (item.value / max) * 100)}%;--i:${index};--value:${Math.max(8, (item.value / max) * 100)}%"></div></div>
              <b>${item.value.toLocaleString("en-IN")}</b>
            </div>
          `).join("")}
        </div>
        <div class="source-links">${sourceLinks(indicator.sources)}</div>
      </article>
    `;
  }).join("");
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

const SITE_URL = "https://letsfixindia.com";
const SITE_SHARE_TEXT = "LetsFixIndia — a sourced public record of India 2014-2026. Every entry has evidence attached.";

function shareBarHtml(url, text) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  return `
    <span class="share-label">Share</span>
    <a class="share-btn share-wa" href="https://wa.me/?text=${t}%20${u}" target="_blank" rel="noopener" aria-label="Share on WhatsApp">WhatsApp</a>
    <a class="share-btn share-x" href="https://twitter.com/intent/tweet?text=${t}&url=${u}" target="_blank" rel="noopener" aria-label="Share on X">X</a>
    <a class="share-btn share-fb" href="https://www.facebook.com/sharer/sharer.php?u=${u}" target="_blank" rel="noopener" aria-label="Share on Facebook">Facebook</a>
    <button type="button" class="share-btn share-copy" data-share-url="${esc(url)}" aria-label="Copy link">Copy link</button>
  `;
}

function renderShareBars() {
  document.querySelectorAll(".share-bar[data-share-context='site']").forEach((bar) => {
    bar.innerHTML = shareBarHtml(SITE_URL, SITE_SHARE_TEXT);
  });
}

document.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-share-url]");
  if (!button) return;
  try {
    await navigator.clipboard.writeText(button.dataset.shareUrl);
    button.textContent = "Copied";
    setTimeout(() => { button.textContent = "Copy link"; }, 1600);
  } catch {
    button.textContent = "Copy failed";
  }
});

function renderRecord(id) {
  if (!recordView) return;
  const event = events.find((item) => item.id === id);
  if (!event) {
    recordView.innerHTML = `
      <div class="section-head">
        <p class="eyebrow">Record not found</p>
        <h2>No matching entry</h2>
        <p>The requested record does not exist in the current JSON file.</p>
        <a class="text-button" href="/" data-link>Back to timeline</a>
      </div>
    `;
    return;
  }

  recordView.innerHTML = `
    <div class="record-shell">
      <a class="text-button" href="/" data-link>Back to timeline</a>
      <div class="record-kicker">${esc(event.year)} · ${esc(event.date)} · <span class="${statusClass(event.status)}">${esc(event.status)}</span></div>
      <h1>${esc(event.title)}</h1>
      <div class="chips">
        <span class="${chipClass(event.category)}">${esc(event.category)}</span>
        ${event.actors.map((actor) => `<span class="${chipClass(actor)}">${esc(actor)}</span>`).join("")}
      </div>
      <div class="record-columns">
        <article>
          <h2>Summary</h2>
          <p>${esc(event.summary)}</p>
          <h2 class="record-outcome-heading">Outcome</h2>
          <p class="outcome">${esc(event.outcome)}</p>
        </article>
        <aside>
          <h2>Sources</h2>
          <div class="source-links record-source-links">${sourceLinks(event.sources)}</div>
          <div class="record-actions">
            <button type="button" data-copy-citation>Copy citation</button>
            <span data-copy-feedback aria-live="polite"></span>
          </div>
          <div class="share-bar record-share">${shareBarHtml(`${SITE_URL}${eventUrl(event)}`, `${event.title} — sourced on LetsFixIndia`)}</div>
        </aside>
      </div>
    </div>
  `;
  recordView.querySelector("[data-copy-citation]")?.addEventListener("click", async () => {
    const sourceText = (event.sources || []).map((id) => sources[id]).filter((source) => source?.url).map((source) => `${source.publisher}: ${source.title} - ${source.url}`);
    const citation = [event.title, event.date || event.year, `${window.location.origin}${eventUrl(event)}`, ...sourceText].join("\n");
    const feedback = recordView.querySelector("[data-copy-feedback]");
    try {
      await navigator.clipboard.writeText(citation);
      if (feedback) feedback.textContent = "Citation copied";
    } catch {
      if (feedback) feedback.textContent = "Copy unavailable; select the page text instead";
    }
  });
}

function clearIndicatorFilters() {
  if (indicatorSearchInput) indicatorSearchInput.value = "";
  if (indicatorToneFilter) indicatorToneFilter.value = "all";
  renderIndicators();
}

function clearSourceFilters() {
  if (sourceSearchInput) sourceSearchInput.value = "";
  if (sourceStatusFilter) sourceStatusFilter.value = "all";
  sourceState.query = "";
  sourceState.status = "all";
  renderSources();
}

function downloadCurrentSources() {
  const usage = new Map();
  events.forEach((event) => (event.sources || []).forEach((id) => usage.set(id, (usage.get(id) || 0) + 1)));
  indicators.forEach((indicator) => (indicator.sources || []).forEach((id) => usage.set(id, (usage.get(id) || 0) + 1)));
  voices.forEach((voice) => (voice.stances || []).forEach((stance) => (stance.sources || []).forEach((id) => usage.set(id, (usage.get(id) || 0) + 1))));
  researchBacklog.forEach((item) => (item.sourceKeys || []).forEach((id) => usage.set(id, (usage.get(id) || 0) + 1)));
  const query = sourceState.query;
  const filtered = Object.entries(sources).filter(([id, source]) =>
    (!query || `${id} ${source.title} ${source.publisher} ${source.type}`.toLowerCase().includes(query)) &&
    (sourceState.status === "all" || sourceState.status === sourceFilterStatus(id, source, usage))
  );
  const payload = Object.fromEntries(filtered.map(([id, source]) => [id, { ...source, referenceCount: usage.get(id) || 0 }]));
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `letsfixindia-sources-${sourceState.status}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function updatePageMeta(route) {
  let title = defaultTitle;
  let description = defaultDescriptionText;
  if (route.page === "voices") {
    title = "Public Voices | LetsFixIndia";
    description = "Documented public statements, silence, and institutional responses to major Modi-era controversies.";
  } else if (route.page === "faq") {
    title = "FAQ | LetsFixIndia";
    description = "How LetsFixIndia classifies evidence, handles corrections, and separates public records from unresolved leads.";
  } else if (route.page === "record") {
    const event = events.find((item) => item.id === route.id);
    if (event) {
      title = `${event.title} | LetsFixIndia`;
      description = event.summary;
    } else {
      title = "Record not found | LetsFixIndia";
      description = "The requested record is not present in the current LetsFixIndia data files.";
    }
  } else if (route.page === "statistics") {
    title = "Statistics | LetsFixIndia";
    description = "Source-backed indicators showing where India improved, worsened, or remained broadly flat during the period.";
  } else if (route.page === "sources") {
    title = "Sources | LetsFixIndia";
    description = "The source ledger behind LetsFixIndia public-record entries and research queue.";
  } else if (route.page === "submit") {
    title = "Submit a record | LetsFixIndia";
    description = "Propose a sourced public-record entry. Drafts stay local in your browser until an editor reviews them.";
  } else if (route.page === "support") {
    title = "Support | LetsFixIndia";
    description = "Share the record, contribute sourced corrections, or chip in for hosting. Donations buy uptime, not opinions.";
  } else if (route.page === "about") {
    title = "About | LetsFixIndia";
    description = "Who maintains LetsFixIndia, how to support sourced corrections, and where the public repository lives.";
  } else if (route.page === "timeline") {
    title = defaultTitle;
    description = defaultDescriptionText;
  }
  document.title = title;
  if (defaultDescription) defaultDescription.content = description;
}

function routeFromPath(pathname) {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path.startsWith("/record/")) {
    return { page: "record", id: decodeURIComponent(path.slice("/record/".length)) };
  }
  if (path === "/" || path === "/timeline" || path === "/landing") return { page: "timeline" };
  if (path === "/statistics" || path === "/indicators") return { page: "statistics" };
  if (path === "/voices") return { page: "voices" };
  if (path === "/submit" || path === "/submissions") return { page: "submit" };
  if (path === "/sources") return { page: "sources" };
  if (path === "/methodology") return { page: "faq" };
  if (path === "/faq") return { page: "faq" };
  if (path === "/support") return { page: "support" };
  if (path === "/about") return { page: "about" };
  return { page: "timeline" };
}

function resolveRoute() {
  return routeFromPath(window.location.pathname);
}

function setActiveNav(page) {
  document.querySelectorAll("[data-link]").forEach((link) => {
    const href = link.getAttribute("href") || "";
    const active = (page === "timeline" && href === "/") || href === `/${page}`;
    link.classList.toggle("active-route", active);
    if (active) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function ensureRouteContent(route) {
  if (route.page === "record") {
    renderRecord(route.id);
    return;
  }
  if (renderedPages.has(route.page)) return;

  if (route.page === "timeline") renderTimeline();
  if (route.page === "statistics") renderIndicators();
  if (route.page === "voices") renderVoices();
  if (route.page === "submit") renderSubmissions();
  if (route.page === "sources") renderSources();

  renderedPages.add(route.page);
}

function renderRoute(options = {}) {
  const route = resolveRoute();
  updatePageMeta(route);
  ensureRouteContent(route);
  routePages.forEach((section) => section.classList.toggle("is-active", section.dataset.page === route.page));
  setActiveNav(route.page);
  const shouldRestoreTimeline = route.page === "timeline" && (options.restoreTimeline || history.state?.restoreTimeline);
  requestAnimationFrame(() => {
    if (shouldRestoreTimeline) {
      restoreTimelineScroll("auto");
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
    updateScrollDock();
  });
}

function daysBetween(a, b) {
  return Math.floor((b - a) / 86400000);
}

function daysToYMD(totalDays) {
  const ref = new Date(2000, 0, 1);
  const end = new Date(ref.getTime() + totalDays * 86400000);
  let y = end.getFullYear() - ref.getFullYear();
  let m = end.getMonth() - ref.getMonth();
  let d = end.getDate() - ref.getDate();
  if (d < 0) { m--; d += new Date(end.getFullYear(), end.getMonth(), 0).getDate(); }
  if (m < 0) { y--; m += 12; }
  return { y, m, d };
}

function calendarDiffYMD(from, to) {
  let start = from;
  let end = to;
  if (end < start) {
    start = to;
    end = from;
  }
  let y = end.getFullYear() - start.getFullYear();
  let m = end.getMonth() - start.getMonth();
  let d = end.getDate() - start.getDate();
  if (d < 0) {
    m -= 1;
    d += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
  }
  if (m < 0) {
    y -= 1;
    m += 12;
  }
  return { y, m, d };
}

function fmtYMD({ y, m, d }) {
  const mo = m === 1 ? "month" : "months";
  const dy = d === 1 ? "day" : "days";
  return `${y} years, ${m} ${mo}, ${d} ${dy}`;
}

function calculateTenure() {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const modiStart = new Date("2014-05-26T00:00:00+05:30");
  const termEnd = new Date("2029-06-23T23:59:59+05:30");
  const modiDays = daysBetween(modiStart, now);

  const modiYMD = calendarDiffYMD(modiStart, now);
  if (tenureValue) {
    tenureValue.textContent = fmtYMD(modiYMD);
  }
  const tenureSubtitle = document.getElementById("tenureSubtitle");
  if (tenureSubtitle) {
    tenureSubtitle.textContent = `From 26 May 2014 to ${fmt.format(now)}`;
  }
  const footerDate = document.getElementById("footerDate");
  if (footerDate) {
    footerDate.textContent = `Updated ${fmt.format(now)}`;
  }
  const tenureLeft = document.getElementById("tenureLeftValue");
  if (tenureLeft) {
    tenureLeft.textContent = now < termEnd
      ? `${fmtYMD(calendarDiffYMD(now, termEnd))} left in current Lok Sabha term`
      : `Current Lok Sabha term ended on ${fmt.format(termEnd)}`;
  }

  const vajpayee1Days = 16;
  const vajpayee2Days = daysBetween(new Date("1998-03-19"), new Date("2004-05-22"));
  const bjpTotalDays = vajpayee1Days + vajpayee2Days + modiDays;
  const bjpYMD = daysToYMD(bjpTotalDays);
  const bjpTotalValue = document.getElementById("bjpTotalValue");
  if (bjpTotalValue) {
    bjpTotalValue.textContent = fmtYMD(bjpYMD);
  }
  const bjpTotalSubtitle = document.getElementById("bjpTotalSubtitle");
  if (bjpTotalSubtitle) {
    bjpTotalSubtitle.textContent =
      `Vajpayee 1996; 1998-2004 (${Math.round(vajpayee2Days / 365.25 * 10) / 10} yrs); Modi 2014-present`;
  }
}

const DRAFTS_KEY = "letsFixIndia.publicRecordDrafts";
const DRAFTS_LEGACY_KEY = "publicRecordDrafts";

function getDrafts() {
  try {
    const current = localStorage.getItem(DRAFTS_KEY);
    if (current) return JSON.parse(current);
    const legacy = localStorage.getItem(DRAFTS_LEGACY_KEY);
    if (legacy) {
      localStorage.setItem(DRAFTS_KEY, legacy);
      localStorage.removeItem(DRAFTS_LEGACY_KEY);
      return JSON.parse(legacy);
    }
    return [];
  } catch {
    return [];
  }
}

function saveDrafts(drafts) {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

function clearTimelineFilters() {
  state.query = "";
  state.category = "all";
  state.actor = "all";
  state.status = "all";
  state.evidence = "all";
  state.year = "all";
  if (searchInput) searchInput.value = "";
  if (categoryFilter) categoryFilter.value = "all";
  if (actorFilter) actorFilter.value = "all";
  if (statusFilter) statusFilter.value = "all";
  if (evidenceFilter) evidenceFilter.value = "all";
  yearRail?.querySelectorAll(".year-pill").forEach((pill) => {
    pill.classList.toggle("active", pill.dataset.year === "all");
  });
  renderTimeline();
  updateScrollDock();
}

function setSubmitFeedback(message) {
  const el = document.querySelector("#submitFeedback");
  if (!el) return;
  el.textContent = message;
  el.classList.toggle("is-visible", Boolean(message));
}

function renderSubmissions() {
  if (!submissionQueue) return;
  const drafts = getDrafts();
  if (!drafts.length) {
    submissionQueue.innerHTML = `<p class="queue-empty">No local submission drafts yet.</p>`;
    return;
  }

  submissionQueue.innerHTML = `
    <h3>Local submission queue</h3>
    ${drafts.map((draft, index) => `
      <article class="draft-item">
        <div>
          <span>${esc(draft.year)} - ${esc(draft.category)} - ${esc(draft.actor)}</span>
          <h4>${esc(draft.title)}</h4>
          <p>${esc(draft.summary)}</p>
          <small>${esc(draft.sources).replace(/\n/g, " | ")}</small>
        </div>
        <button type="button" data-remove-draft="${index}">Remove</button>
      </article>
    `).join("")}
  `;
}

function stanceLabel(position) {
  switch (position) {
    case "spoke-out": return "Spoke out";
    case "supported-govt": return "Supported govt";
    case "silent": return "Silent";
    case "ambiguous": return "Ambiguous";
    default: return position;
  }
}

function stanceIcon(position) {
  switch (position) {
    case "spoke-out": return "\u25CF";
    case "supported-govt": return "\u25CF";
    case "silent": return "\u25CB";
    case "ambiguous": return "\u25D1";
    default: return "";
  }
}

function populateVoiceIssues() {
  if (!voiceIssueFilter) return;
  const issues = new Set();
  voices.forEach((v) => v.stances.forEach((s) => issues.add(s.issue)));
  const sorted = Array.from(issues).sort();
  voiceIssueFilter.innerHTML = `<option value="all">All issues</option>` +
    sorted.map((i) => `<option value="${esc(i)}">${esc(i)}</option>`).join("");
}

function voiceMatchesFilters(voice) {
  const { query, field, stance, issue } = voiceState;
  const searchText = `${voice.name} ${voice.field} ${voice.description}`.toLowerCase();
  if (query && !searchText.includes(query)) return false;
  if (field !== "all" && !voice.field.includes(field)) return false;
  if (stance !== "all" || issue !== "all") {
    const matchingStances = voice.stances.filter((s) => {
      const stanceMatch = stance === "all" || s.position === stance;
      const issueMatch = issue === "all" || s.issue === issue;
      return stanceMatch && issueMatch;
    });
    if (matchingStances.length === 0) return false;
  }
  return true;
}

function renderVoices() {
  if (!voicesGrid || !voices.length) return;

  const filtered = voices.filter(voiceMatchesFilters);

  // Summary stats
  const totalPeople = voices.length;
  const spokeOutCount = voices.filter((v) => v.stances.some((s) => s.position === "spoke-out")).length;
  const silentCount = voices.filter((v) => v.stances.every((s) => s.position === "silent")).length;
  const proGovtCount = voices.filter((v) => v.stances.some((s) => s.position === "supported-govt") && !v.stances.some((s) => s.position === "spoke-out")).length;

  if (voicesSummary) {
    voicesSummary.innerHTML = `
      <div class="voice-stat"><strong>${totalPeople}</strong><span>figures tracked</span></div>
      <div class="voice-stat spoke-out"><strong>${spokeOutCount}</strong><span>spoke out on \u2265 1 issue</span></div>
      <div class="voice-stat silent"><strong>${silentCount}</strong><span>silent on all tracked issues</span></div>
      <div class="voice-stat supported-govt"><strong>${proGovtCount}</strong><span>supported govt (never spoke out)</span></div>
    `;
  }

  if (voicesMeta) {
    const activeFilterCount = [voiceState.query, voiceState.field !== "all" ? voiceState.field : "", voiceState.stance !== "all" ? voiceState.stance : "", voiceState.issue !== "all" ? voiceState.issue : ""].filter(Boolean).length;
    if (clearVoiceFiltersButton) clearVoiceFiltersButton.disabled = activeFilterCount === 0;
    voicesMeta.querySelector(".voices-result-count").textContent = `${filtered.length} of ${totalPeople} figures shown${activeFilterCount ? ` · ${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} active` : ""}`;
  }

  if (clearSourceFiltersButton) {
    clearSourceFiltersButton.disabled = !sourceState.query && sourceState.status === "all";
  }
  if (!filtered.length) {
    voicesGrid.innerHTML = `<div class="empty-state"><strong>No figures match</strong><p>Widen field, stance, issue, or search filters.</p></div>`;
    return;
  }

  let voiceIndex = 0;
  voicesGrid.innerHTML = filtered.map((voice) => {
    const stancesHtml = voice.stances.map((s) => {
      const srcHtml = s.sources.length ? `<span class="voice-src">${sourceLinks(s.sources)}</span>` : "";
      const quoteHtml = s.quote ? `<blockquote class="voice-quote">${esc(s.quote)}</blockquote>` : "";
      return `
        <details class="stance-detail">
          <summary>
            <span class="stance-pill ${s.position}">${stanceIcon(s.position)} ${stanceLabel(s.position)}</span>
            <span class="stance-issue">${esc(s.issue)}</span>
          </summary>
          <div class="stance-body">
            <p>${esc(s.summary)}</p>
            ${quoteHtml}
            ${s.date ? `<span class="stance-date">${esc(s.date)}</span>` : ""}
            ${srcHtml}
          </div>
        </details>
      `;
    }).join("");

    const fieldParts = voice.field.split(" / ");
    const fieldChips = fieldParts.map((f) => `<span class="voice-field-chip">${esc(f.trim())}</span>`).join("");

    const spokeCount = voice.stances.filter((s) => s.position === "spoke-out").length;
    const silentCnt = voice.stances.filter((s) => s.position === "silent").length;
    const govtCnt = voice.stances.filter((s) => s.position === "supported-govt").length;
    const otherCnt = voice.stances.length - spokeCount - silentCnt - govtCnt;
    const total = voice.stances.length || 1;

    let dominantClass = "voice-neutral";
    if (spokeCount > 0 && spokeCount >= govtCnt) dominantClass = "voice-spoke";
    else if (govtCnt > 0) dominantClass = "voice-govt";
    else if (silentCnt === voice.stances.length) dominantClass = "voice-silent";
    const dominantLabel = dominantClass === "voice-spoke" ? "Spoke out" : dominantClass === "voice-govt" ? "Supported government" : dominantClass === "voice-silent" ? "No statement found" : "Mixed record";

    const initials = voice.name.split(" ").map((part) => part.charAt(0)).slice(0, 2).join("");
    const ratioSeg = (count, cls, label) => count
      ? `<span class="ratio-seg ${cls}" style="flex-grow:${count}" title="${label}: ${count} of ${total}"></span>`
      : "";
    const tallyLine = [
      spokeCount ? `<span class="tally-label spoke-out">${spokeCount} spoke out</span>` : "",
      govtCnt ? `<span class="tally-label supported-govt">${govtCnt} backed govt</span>` : "",
      silentCnt ? `<span class="tally-label silent">${silentCnt} silent</span>` : "",
      otherCnt ? `<span class="tally-label ambiguous">${otherCnt} ambiguous</span>` : ""
    ].filter(Boolean).join("");

    return `
      <article class="voice-card ${dominantClass}" style="--i:${voiceIndex++ % 9}">
        <div class="voice-header">
          <div class="voice-avatar">${esc(initials)}</div>
          <div class="voice-id">
            <h3 class="voice-name">${esc(voice.name)}</h3>
            <div class="voice-fields">${fieldChips}</div>
          </div>
        </div>
        <div class="voice-card-signal"><span class="voice-signal-label">${dominantLabel}</span><span class="voice-signal-count">${total} issue${total === 1 ? "" : "s"} tracked</span></div>
        <p class="voice-desc">${esc(voice.description)}</p>
        <div class="voice-ratio" role="img" aria-label="Stance breakdown across ${total} tracked issues">
          ${ratioSeg(spokeCount, "spoke-out", "Spoke out")}${ratioSeg(govtCnt, "supported-govt", "Supported govt")}${ratioSeg(otherCnt, "ambiguous", "Ambiguous")}${ratioSeg(silentCnt, "silent", "Silent")}
        </div>
        <div class="voice-tally">${tallyLine}</div>
        <div class="voice-stances">
          ${stancesHtml}
        </div>
      </article>
    `;
  }).join("");
}

function setSideNav(open) {
  const sideNav = document.querySelector("#sideNav");
  const backdrop = document.querySelector("#navBackdrop");
  const toggle = document.querySelector("#menuToggle");
  if (!sideNav || !backdrop || !toggle) return;
  if (open) backdrop.hidden = false;
  requestAnimationFrame(() => {
    sideNav.classList.toggle("is-open", open);
    backdrop.classList.toggle("is-open", open);
  });
  sideNav.setAttribute("aria-hidden", String(!open));
  toggle.setAttribute("aria-expanded", String(open));
  if (!open) {
    setTimeout(() => { backdrop.hidden = true; }, 240);
  }
}

function bindEvents() {
  syncFilterDisclosure();

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
    if (event.key === "/" && !typing) {
      const routeSearch = [searchInput, indicatorSearchInput, voiceSearchInput, sourceSearchInput].find((input) => input && input.closest(".route-page")?.classList.contains("is-active"));
      if (routeSearch) {
        event.preventDefault();
        routeSearch.focus();
      }
    }
    if (event.key === "Escape" && typing && target.type === "search" && target.value) {
      target.value = "";
      target.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });

  document.querySelector("#menuToggle")?.addEventListener("click", () => {
    const isOpen = document.querySelector("#sideNav")?.classList.contains("is-open");
    setSideNav(!isOpen);
  });
  document.querySelector("#menuClose")?.addEventListener("click", () => setSideNav(false));
  document.querySelector("#navBackdrop")?.addEventListener("click", () => setSideNav(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setSideNav(false);
  });

  document.addEventListener("click", (event) => {
    const link = closestFromEvent(event, "a[data-link]");
    if (!link) return;
    if (link.closest("#sideNav")) setSideNav(false);
    const url = new URL(link.href);
    if (url.origin !== window.location.origin) return;
    const fromRoute = resolveRoute();
    const toRoute = routeFromPath(url.pathname);
    if (fromRoute.page === "timeline") {
      saveTimelineScroll(true);
    }
    event.preventDefault();
    const restoreTimeline = toRoute.page === "timeline" && fromRoute.page === "record";
    history.pushState({ restoreTimeline }, "", `${url.pathname}${url.hash}`);
    renderRoute({ restoreTimeline });
    if (url.hash) {
      requestAnimationFrame(() => document.querySelector(url.hash)?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  });

  window.addEventListener("popstate", () => {
    renderRoute({ restoreTimeline: resolveRoute().page === "timeline" });
  });

  window.addEventListener("scroll", () => {
    if (resolveRoute().page !== "timeline" || scrollSaveQueued) return;
    scrollSaveQueued = true;
    requestAnimationFrame(() => {
      saveTimelineScroll(false);
      updateScrollDock();
      scrollSaveQueued = false;
    });
  }, { passive: true });

  window.addEventListener("resize", () => {
    syncFilterDisclosure();
    updateScrollDock();
  });

  scrollDock?.addEventListener("click", (event) => {
    const button = closestFromEvent(event, "button[data-scroll-action]");
    if (!button) return;
    const action = button.dataset.scrollAction;
    if (action === "top") {
      localStorage.setItem(TIMELINE_JUMP_ORIGIN_KEY, String(Math.round(window.scrollY)));
      scrollToY(0);
      updateScrollDock();
    }
    if (action === "saved") {
      const jumpOrigin = storedScroll(TIMELINE_JUMP_ORIGIN_KEY);
      if (jumpOrigin > 24) {
        localStorage.removeItem(TIMELINE_JUMP_ORIGIN_KEY);
        scrollToY(jumpOrigin);
      } else {
        restoreTimelineScroll();
      }
      updateScrollDock();
    }
    if (action === "bottom") {
      localStorage.setItem(TIMELINE_JUMP_ORIGIN_KEY, String(Math.round(window.scrollY)));
      scrollToY(maxScrollY());
      updateScrollDock();
    }
    if (action === "auto") setAutoScroll(!autoScrollActive);
  });

  ["wheel", "touchstart", "pointerdown", "keydown"].forEach((eventName) => {
    window.addEventListener(eventName, (event) => {
      if (!autoScrollActive) return;
      if (eventName === "keydown" && ["Tab", "Shift", "Control", "Alt", "Meta"].includes(event.key)) return;
      setAutoScroll(false);
    }, { passive: true });
  });

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setAutoScroll(false);

  window.addEventListener("keydown", (event) => {
    if (resolveRoute().page !== "timeline" || scrollDock?.hidden) return;
    const tag = (event.target?.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select" || event.target?.isContentEditable) return;
    if (event.key === "Home" && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      scrollDock.querySelector("[data-scroll-action='top']")?.click();
    } else if (event.key === "End" && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      scrollDock.querySelector("[data-scroll-action='bottom']")?.click();
    } else if (event.key === "." && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      scrollDock.querySelector("[data-scroll-action='saved']")?.click();
    }
  });

  timelineList?.addEventListener("click", (event) => {
    if (closestFromEvent(event, "[data-clear-filters]")) {
      clearTimelineFilters();
    }
  });

  searchInput?.addEventListener("input", (event) => {
    state.query = event.target.value;
    renderTimeline();
    updateScrollDock();
  });

  categoryFilter?.addEventListener("change", (event) => {
    state.category = event.target.value;
    renderTimeline();
    updateScrollDock();
  });

  actorFilter?.addEventListener("change", (event) => {
    state.actor = event.target.value;
    renderTimeline();
    updateScrollDock();
  });

  statusFilter?.addEventListener("change", (event) => {
    state.status = event.target.value;
    renderTimeline();
    updateScrollDock();
  });

  evidenceFilter?.addEventListener("change", (event) => {
    state.evidence = event.target.value;
    renderTimeline();
    updateScrollDock();
  });
  clearFiltersButton?.addEventListener("click", clearTimelineFilters);

  yearRail?.addEventListener("click", (event) => {
    const button = closestFromEvent(event, "button[data-year]");
    if (!button) return;
    saveTimelineScroll(true);
    state.year = button.dataset.year;
    yearRail.querySelectorAll(".year-pill").forEach((pill) => pill.classList.toggle("active", pill === button));
    renderTimeline();
    updateScrollDock();
  });

  submissionForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(submissionForm);
    const draft = Object.fromEntries(formData.entries());
    draft.createdAt = new Date().toISOString();
    const drafts = getDrafts();
    drafts.unshift(draft);
    saveDrafts(drafts);
    submissionForm.reset();
    renderSubmissions();
    setSubmitFeedback("Draft saved in this browser. It is not published until an editor promotes it.");
    window.setTimeout(() => setSubmitFeedback(""), 5000);
  });

  voiceFieldFilter?.addEventListener("change", (event) => {
    voiceState.field = event.target.value;
    renderVoices();
  });

  voiceStanceFilter?.addEventListener("change", (event) => {
    voiceState.stance = event.target.value;
    renderVoices();
  });

  voiceIssueFilter?.addEventListener("change", (event) => {
    voiceState.issue = event.target.value;
    renderVoices();
  });
  voiceSearchInput?.addEventListener("input", (event) => {
    voiceState.query = event.target.value.trim().toLowerCase();
    renderVoices();
  });
  sourceSearchInput?.addEventListener("input", (event) => {
    sourceState.query = event.target.value.trim().toLowerCase();
    renderSources();
  });
  indicatorSearchInput?.addEventListener("input", renderIndicators);
  indicatorToneFilter?.addEventListener("change", renderIndicators);
  clearIndicatorFiltersButton?.addEventListener("click", clearIndicatorFilters);
  clearVoiceFiltersButton?.addEventListener("click", clearVoiceFilters);
  clearSourceFiltersButton?.addEventListener("click", clearSourceFilters);
  sourceStatusFilter?.addEventListener("change", (event) => {
    sourceState.status = event.target.value;
    renderSources();
  });

  submissionQueue?.addEventListener("click", (event) => {
    const button = closestFromEvent(event, "button[data-remove-draft]");
    if (!button) return;
    const index = Number(button.dataset.removeDraft);
    const drafts = getDrafts();
    drafts.splice(index, 1);
    saveDrafts(drafts);
    renderSubmissions();
  });
}

async function loadJson(path) {
  const response = await fetch(path.startsWith("/") ? path : `/${path}`);
  if (!response.ok) {
    throw new Error(`Unable to load ${path}`);
  }
  return response.json();
}

async function init() {
  try {
    let voicesData;
    let backlogData;
    [sources, indicators, events, voicesData, backlogData] = await Promise.all([
      loadJson("data/sources.json"),
      loadJson("data/indicators.json"),
      loadJson("data/events.json"),
      loadJson("data/voices.json").catch(() => []),
      loadJson("data/research_backlog.json").catch(() => [])
    ]);
    voices = voicesData || [];
    researchBacklog = backlogData || [];
    renderOptions();
    populateVoiceIssues();
    calculateTenure();
    bindEvents();
    if (!history.state) {
      history.replaceState({ restoreTimeline: false }, "", window.location.pathname);
    }
    renderShareBars();
    renderRoute();
  } catch (error) {
    if (timelineList) {
      timelineList.innerHTML = `<div class="empty-state">The JSON data files did not load. Run this folder through a local web server, then reload.</div>`;
    }
    if (resultCount) resultCount.textContent = "JSON load failed";
    if (evidenceSummary) evidenceSummary.textContent = "Evidence coverage unavailable";
    console.error(error);
  }
}

function clearVoiceFilters() {
  voiceState.query = "";
  voiceState.field = "all";
  voiceState.stance = "all";
  voiceState.issue = "all";
  if (voiceSearchInput) voiceSearchInput.value = "";
  if (voiceFieldFilter) voiceFieldFilter.value = "all";
  if (voiceStanceFilter) voiceStanceFilter.value = "all";
  if (voiceIssueFilter) voiceIssueFilter.value = "all";
  renderVoices();
}

init();
