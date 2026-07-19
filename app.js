// Initialize Supabase using the credentials provided
const supabaseUrl = 'https://pjonynkzgsfwojwboixi.supabase.co';
const supabaseKey = 'sb_publishable_YH3S94knvXqBI3a960u01w_fqgmz0LC';
let db;

try {
  if (typeof window !== 'undefined' && window.supabase) {
    db = window.supabase.createClient(supabaseUrl, supabaseKey);
    console.log("Supabase initialized successfully");
  }
} catch (error) {
  console.error("Supabase init failed:", error);
}

let events = [];
let sources = {};
let indicators = [];
let voices = [];
let researchBacklog = [];

let trackersInterval = null;

function updateMobileScrollProgress() {
  const fill = document.getElementById("mobileScrollProgressFill");
  if (!fill) return;
  const winScroll = window.scrollY;
  const height = document.documentElement.scrollHeight - window.innerHeight;
  if (height <= 0) {
    fill.style.height = "0%";
    return;
  }
  const scrolled = Math.min(100, Math.max(0, (winScroll / height) * 100));
  fill.style.height = scrolled + "%";
}

function startLiveTrackers() {
  if (trackersInterval) clearInterval(trackersInterval);
  
  function updateTrackers() {
    const electionEl = document.getElementById("electionCountdown");
    const pressEl = document.getElementById("pressConferenceTracker");
    
    if (!electionEl && !pressEl) return;
    
    const now = new Date();
    
    // Election Countdown (Target: April 15, 2029)
    const electionTarget = new Date("2029-04-15T00:00:00");
    const diffElection = electionTarget - now;
    if (electionEl) {
      if (diffElection <= 0) {
        electionEl.textContent = "Elections Ongoing / Completed";
      } else {
        const days = Math.floor(diffElection / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffElection % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diffElection % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diffElection % (1000 * 60)) / 1000);
        electionEl.innerHTML = `${days}d ${hours}h ${mins}m ${secs}s`;
      }
    }
    
    // Press Conference Tracker (Modi became PM: May 26, 2014 — has NEVER held a solo press conference)
    const pressStart = new Date("2014-05-26T00:00:00");
    const diffPress = now - pressStart;
    if (pressEl) {
      if (diffPress < 0) {
        pressEl.textContent = "0 days";
      } else {
        const days = Math.floor(diffPress / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffPress % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diffPress % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diffPress % (1000 * 60)) / 1000);
        pressEl.innerHTML = `${days}d ${hours}h ${mins}m ${secs}s`;
      }
    }
  }
  
  updateTrackers();
  trackersInterval = setInterval(updateTrackers, 1000);
}

const state = {
  query: "",
  category: "all",
  actor: "all",
  status: "all",
  evidence: "all",
  year: "all",
  sort: "desc"
};

const categoryFilter = document.querySelector("#categoryFilter");
const actorFilter = document.querySelector("#actorFilter");
const statusFilter = document.querySelector("#statusFilter");
const evidenceFilter = document.querySelector("#evidenceFilter");
const sortFilter = document.querySelector("#sortFilter");
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

function byTimelineAsc(a, b) {
  if (a.year !== b.year) return a.year - b.year;
  return String(a.date).localeCompare(String(b.date));
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
  const uniqueSources = [];
  const seenPublishers = new Set();
  
  // Sort to process sources with URLs first
  const sortedIds = [...new Set(ids)].sort((a, b) => {
    const hasA = sources[a] && sources[a].url ? 1 : 0;
    const hasB = sources[b] && sources[b].url ? 1 : 0;
    return hasB - hasA;
  });

  for (const id of sortedIds) {
    if (!sources[id]) continue;
    const rawLabel = sources[id].publisher;
    const label = rawLabel
      .replace("Press Information Bureau", "PIB")
      .replace("Reporters Without Borders", "RSF")
      .replace("Association for Democratic Reforms", "ADR")
      .replace("Human Rights Watch", "HRW")
      .replace("Amnesty International", "Amnesty")
      .replace("Election Commission of India", "ECI")
      .replace("National Testing Agency", "NTA");
    
    if (seenPublishers.has(label)) continue;
    seenPublishers.add(label);
    uniqueSources.push({ id, label, title: esc(sources[id].title) });
  }

  return uniqueSources
    .map(({ id, label, title }) => {
      if (!sources[id].url) {
        return `<span class="source-pending" title="${title}">${esc(label)}</span>`;
      }
      return `<a href="${sources[id].url}" target="_blank" rel="noopener" title="${title}" aria-label="Open source: ${esc(label)} — ${title}">${esc(label)}</a>`;
    })
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

let cruiseFrame = 0;

function cancelCruise() {
  if (cruiseFrame) cancelAnimationFrame(cruiseFrame);
  cruiseFrame = 0;
}

function cruiseTo(targetY) {
  cancelCruise();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    scrollToY(targetY, "auto");
    return;
  }
  const startY = window.scrollY;
  const target = clampScroll(targetY);
  const distance = target - startY;
  if (Math.abs(distance) < 4) return;
  const duration = Math.min(4200, Math.max(900, Math.abs(distance) * 0.32));
  const startTime = performance.now();
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const step = (now) => {
    const progress = Math.min(1, (now - startTime) / duration);
    window.scrollTo(0, startY + distance * ease(progress));
    if (progress < 1) {
      cruiseFrame = requestAnimationFrame(step);
    } else {
      cruiseFrame = 0;
    }
  };
  cruiseFrame = requestAnimationFrame(step);
}

["wheel", "touchstart", "pointerdown"].forEach((eventName) => {
  window.addEventListener(eventName, cancelCruise, { passive: true });
});

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

function matchesExcept(event, skip) {
  const query = state.query.trim().toLowerCase();
  const searchText = [event.title, event.summary, event.outcome, event.category, event.status, event.actors.join(" "), event.year, event.date].join(" ").toLowerCase();
  return (
    (!query || searchText.includes(query)) &&
    (skip === "category" || state.category === "all" || event.category === state.category) &&
    (skip === "actor" || state.actor === "all" || event.actors.includes(state.actor)) &&
    (skip === "status" || state.status === "all" || event.status === state.status) &&
    (state.evidence === "all" || sourceStatus(event.sources).className === state.evidence) &&
    (skip === "year" || state.year === "all" || String(event.year) === state.year)
  );
}

function fillSelect(select, allLabel, values, current) {
  select.innerHTML = `<option value="all">${allLabel}</option>` +
    values.map((value) => `<option value="${esc(value)}">${esc(value)}</option>`).join("");
  select.value = values.includes(current) ? current : "all";
}

function renderOptions() {
  if (!categoryFilter || !actorFilter || !statusFilter || !yearRail) return;
  const pool = (skip) => events.filter((e) => matchesExcept(e, skip));
  const categories = uniqueSorted(pool("category").map((e) => e.category));
  const actors = uniqueSorted(pool("actor").flatMap((e) => e.actors));
  const statuses = uniqueSorted(pool("status").map((e) => e.status));
  fillSelect(categoryFilter, "All categories", categories, state.category);
  fillSelect(actorFilter, "All actors", actors, state.actor);
  fillSelect(statusFilter, "All statuses", statuses, state.status);
  if (categoryFilter.value !== state.category) state.category = categoryFilter.value;
  if (actorFilter.value !== state.actor) state.actor = actorFilter.value;
  if (statusFilter.value !== state.status) state.status = statusFilter.value;

  const years = uniqueSorted(pool("year").map((e) => e.year)).sort((a, b) => b - a);
  yearRail.innerHTML = [
    `<button class="year-pill${state.year === "all" ? " active" : ""}" data-year="all">All years</button>`,
    ...years.map((year) => `<button class="year-pill${state.year === String(year) ? " active" : ""}" data-year="${year}">${year}</button>`)
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
  renderOptions();
  const filtered = events.filter(matches).sort(state.sort === "asc" ? byTimelineAsc : byTimeline);
  const activeTotal = events.length;
  if (resultCount) resultCount.textContent = `${filtered.length} of ${activeTotal} records`;
  if (evidenceSummary) {
    const linked = filtered.filter((event) => sourceStatus(event.sources).className === "linked").length;
    const pending = filtered.filter((event) => sourceStatus(event.sources).className === "pending").length;
    const missing = filtered.length - linked - pending;
    evidenceSummary.textContent = (pending || missing)
      ? `${linked} linked • ${pending} pending URLs • ${missing} source gaps`
      : `Every entry links to its sources`;
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
        <span>${year} <b class="year-timeline-label" style="font-family: sans-serif; font-size: 14px; font-weight: 900; letter-spacing: 0.05em; margin-left: 6px; vertical-align: middle; color: var(--muted); text-transform: uppercase;">TIMELINE</b></span>
        <b>${yearEvents.length} records</b>
      </div>
      <div class="year-records">
        ${yearEvents.map((event, index) => `
          <article class="event-card ${String(event.severity || "").toLowerCase()}" style="--i:${index}">
            <div class="event-body">
              ${(() => { const evidence = sourceStatus(event.sources); return evidence.className === "linked" ? "" : `<span class="evidence-status ${evidence.className}" title="Evidence link status">${esc(evidence.label)}</span>`; })()}
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

function generateChartHtml(chart, directionTone) {
  if (!chart || chart.length === 0) return "";

  // Check if labels are categories or years
  const isCategory = chart.some(item => isNaN(item.label));
  
  // Highlight color based on direction tone
  const accentColor = directionTone === "tone-better" ? "#138808" : directionTone === "tone-worse" ? "#b3261e" : "#8f3200";

  // CASE 1: Category Breakdown (e.g. IPC cases, SLL cases) -> Donut Chart
  if (isCategory) {
    const totalItem = chart.find(item => item.label.toLowerCase() === "total");
    const segments = chart.filter(item => item.label.toLowerCase() !== "total");
    
    const sum = segments.reduce((acc, item) => acc + item.value, 0);
    const displayTotal = totalItem ? totalItem.value : sum;
    
    let accumulatedPercent = 0;
    const paths = segments.map((item, index) => {
      const val = item.value;
      const percent = sum > 0 ? val / sum : 0;
      const strokeDash = `${percent * 100} ${100 - (percent * 100)}`;
      const strokeOffset = 100 - accumulatedPercent + 25; // start at top (12 o'clock)
      accumulatedPercent += percent * 100;
      
      const segmentColors = [accentColor, "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"];
      const color = segmentColors[index % segmentColors.length];
      
      return {
        label: item.label,
        value: val.toLocaleString("en-IN"),
        color,
        strokeDash,
        strokeOffset
      };
    });

    return `
      <div class="donut-chart-wrapper">
        <div class="donut-svg-container">
          <svg viewBox="0 0 36 36" class="donut-svg">
            <circle class="donut-ring" cx="18" cy="18" r="15.915" fill="transparent" stroke="rgba(0,0,0,0.06)" stroke-width="3.5"></circle>
            ${paths.map(p => `
              <circle class="donut-segment" cx="18" cy="18" r="15.915" fill="transparent" 
                stroke="${p.color}" stroke-width="3.5" 
                stroke-linecap="round"
                stroke-dasharray="${p.strokeDash}" stroke-dashoffset="${p.strokeOffset}">
              </circle>
            `).join("")}
          </svg>
          <div class="donut-center-text">
            <span class="donut-center-label">Total</span>
            <span class="donut-center-value">${displayTotal.toLocaleString("en-IN")}</span>
          </div>
        </div>
        <div class="donut-legend">
          ${paths.map(p => `
            <div class="donut-legend-item">
              <span class="legend-indicator" style="background-color: ${p.color};"></span>
              <span class="legend-text"><strong>${p.value}</strong> <small>${p.label}</small></span>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  // CASE 2: Exactly 2 data points (e.g. 2014 vs 2023) -> Premium Comparison Cards + Split Bar
  if (chart.length === 2) {
    const val1 = chart[0].value;
    const val2 = chart[1].value;
    const label1 = chart[0].label;
    const label2 = chart[1].label;
    
    let pctChangeText = "";
    let isIncrease = val2 > val1;
    if (val1 > 0) {
      const pct = Math.abs(((val2 - val1) / val1) * 100).toFixed(1);
      pctChangeText = `${isIncrease ? "↑" : "↓"} ${pct}% ${isIncrease ? "increase" : "decrease"}`;
    }

    const pctColor = directionTone === "tone-better" ? "#0d6a04" : directionTone === "tone-worse" ? "#b3261e" : "#8f3200";
    const barPercent = val1 + val2 > 0 ? (val2 / (val1 + val2)) * 100 : 50;

    return `
      <div class="comparison-chart-wrapper">
        <div class="comparison-cards">
          <div class="comp-card start">
            <span class="comp-label">${label1}</span>
            <span class="comp-value">${val1.toLocaleString("en-IN")}</span>
          </div>
          ${pctChangeText ? `
            <div class="comp-change-badge" style="color: ${pctColor}; background: ${pctColor}10;">
              ${pctChangeText}
            </div>
          ` : ""}
          <div class="comp-card end">
            <span class="comp-label">${label2}</span>
            <span class="comp-value">${val2.toLocaleString("en-IN")}</span>
          </div>
        </div>
        <div class="comparison-bar-track">
          <div class="comparison-bar-fill" style="width: ${barPercent}%; background: ${accentColor};"></div>
          <span class="bar-marker marker-start">${label1}</span>
          <span class="bar-marker marker-end">${label2}</span>
        </div>
      </div>
    `;
  }

  // CASE 3: 3 or more data points -> SVG Trend Line / Area Sparkline
  const values = chart.map(item => item.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const valRange = maxVal - minVal;

  const width = 360;
  const height = 90;
  const paddingX = 20;
  const paddingY = 15;

  const points = chart.map((item, idx) => {
    const x = paddingX + (idx * ((width - (paddingX * 2)) / (chart.length - 1)));
    const y = valRange === 0 
      ? height / 2 
      : height - paddingY - (((item.value - minVal) / valRange) * (height - (paddingY * 2)));
    return { x, y, label: item.label, value: item.value };
  });

  const pathD = `M ${points.map(p => `${p.x} ${p.y}`).join(" L ")}`;
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return `
    <div class="trend-chart-wrapper">
      <svg viewBox="0 0 ${width} ${height}" class="trend-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGrad-${points[0].value}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.16"></stop>
            <stop offset="100%" stop-color="${accentColor}" stop-opacity="0.0"></stop>
          </linearGradient>
        </defs>
        <!-- Area Grid lines -->
        <line x1="${paddingX}" y1="${height - paddingY}" x2="${width - paddingX}" y2="${height - paddingY}" stroke="rgba(0,0,0,0.05)" stroke-width="1"></line>
        <line x1="${paddingX}" y1="${paddingY}" x2="${width - paddingX}" y2="${paddingY}" stroke="rgba(0,0,0,0.05)" stroke-width="1"></line>
        
        <!-- Fill Area -->
        <path d="${areaD}" fill="url(#areaGrad-${points[0].value})"></path>
        
        <!-- Stroke Line -->
        <path d="${pathD}" fill="none" stroke="${accentColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
        
        <!-- Interactive Dots -->
        ${points.map(p => `
          <g class="trend-point-group">
            <circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#ffffff" stroke="${accentColor}" stroke-width="2" class="trend-dot"></circle>
            <circle cx="${p.x}" cy="${p.y}" r="12" fill="transparent" class="trend-hitbox">
              <title>${p.label}: ${p.value.toLocaleString("en-IN")}</title>
            </circle>
          </g>
        `).join("")}
      </svg>
      <div class="trend-labels">
        ${points.map(p => `
          <div class="trend-label-item">
            <span class="trend-year">${p.label}</span>
            <span class="trend-val">${p.value.toLocaleString("en-IN")}</span>
          </div>
        `).join("")}
      </div>
    </div>
  `;
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
        <div class="indicator-chart-container" aria-label="${esc(indicator.title)} comparison chart">
          ${generateChartHtml(indicator.chart, directionTone)}
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

const SHARE_ICONS = {
  wa: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>`,
  x: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>`,
  fb: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  ig: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>`,
  copy: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`
};

function shareBarHtml(url, text) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  return `
    <span class="share-label">Share</span>
    <a class="share-btn share-wa" href="https://wa.me/?text=${t}%20${u}" target="_blank" rel="noopener" aria-label="Share on WhatsApp">${SHARE_ICONS.wa}<span>WhatsApp</span></a>
    <a class="share-btn share-x" href="https://twitter.com/intent/tweet?text=${t}&url=${u}" target="_blank" rel="noopener" aria-label="Share on X">${SHARE_ICONS.x}<span>X</span></a>
    <a class="share-btn share-fb" href="https://www.facebook.com/sharer/sharer.php?u=${u}" target="_blank" rel="noopener" aria-label="Share on Facebook">${SHARE_ICONS.fb}<span>Facebook</span></a>
    <a class="share-btn share-ig" href="https://www.instagram.com/letsfixindia" target="_blank" rel="noopener" aria-label="LetsFixIndia on Instagram">${SHARE_ICONS.ig}<span>Instagram</span></a>
    <button type="button" class="share-btn share-copy" data-share-url="${esc(url)}" aria-label="Copy link">${SHARE_ICONS.copy}<span>Copy link</span></button>
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
    button.classList.add("is-copied");
    setTimeout(() => { button.classList.remove("is-copied"); }, 1600);
  } catch {
    button.title = "Copy failed";
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
  } else if (route.page === "contact") {
    title = "Contact | LetsFixIndia";
    description = "Contact Basith and Devit directly for corrections, collaboration, or software development work.";
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
  if (path === "/contact") return { page: "contact" };
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


  renderedPages.add(route.page);
}

function renderRoute(options = {}) {
  const route = resolveRoute();
  updatePageMeta(route);
  ensureRouteContent(route);
  routePages.forEach((section) => section.classList.toggle("is-active", section.dataset.page === route.page));
  setActiveNav(route.page);
  const shouldRestoreTimeline = route.page === "timeline" && (options.restoreTimeline || history.state?.restoreTimeline);
  
  if (route.page === "statistics") {
    startLiveTrackers();
  } else {
    if (trackersInterval) {
      clearInterval(trackersInterval);
      trackersInterval = null;
    }
  }
  
  requestAnimationFrame(() => {
    if (shouldRestoreTimeline) {
      restoreTimelineScroll("auto");
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
    updateScrollDock();
    updateMobileScrollProgress();
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

  let scrollSaveTimeout = null;
  window.addEventListener("scroll", () => {
    updateMobileScrollProgress();
    if (resolveRoute().page !== "timeline") return;
    if (!scrollSaveQueued) {
      scrollSaveQueued = true;
      requestAnimationFrame(() => {
        updateScrollDock();
        scrollSaveQueued = false;
      });
    }
    if (scrollSaveTimeout) window.clearTimeout(scrollSaveTimeout);
    scrollSaveTimeout = window.setTimeout(() => {
      saveTimelineScroll(false);
    }, 200);
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
      cruiseTo(0);
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
      cruiseTo(maxScrollY());
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
    saveTimelineScroll(true);
    state.evidence = event.target.value;
    renderTimeline();
    updateScrollDock();
  });
  
  sortFilter?.addEventListener("change", (event) => {
    saveTimelineScroll(true);
    state.sort = event.target.value;
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
    
    // Save to local drafts as a fallback
    const drafts = getDrafts();
    drafts.unshift(draft);
    saveDrafts(drafts);
    submissionForm.reset();
    renderSubmissions();
    
    setSubmitFeedback("Sending submission to editor review queue...");
    
    // Direct persistence to Supabase
    if (db) {
      db.from("letsfixindia_submissions").insert([{ data: draft }])
        .then(({ error }) => {
          if (error) throw error;
          setSubmitFeedback("Submission sent directly to the editor's queue! Thank you.");
          window.setTimeout(() => setSubmitFeedback(""), 6000);
        })
        .catch((error) => {
          console.error("Supabase submission failed:", error);
          setSubmitFeedback("Saved locally in this browser. Cloud submission failed: " + error.message);
          window.setTimeout(() => setSubmitFeedback(""), 6000);
        });
    } else {
      setSubmitFeedback("Saved locally in this browser (Cloud offline).");
      window.setTimeout(() => setSubmitFeedback(""), 6000);
    }
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

// Initialize splash screen alert
function initSplash() {
  const splash = document.getElementById("splashScreen");
  const dismissBtn = document.getElementById("dismissSplash");
  const dontShowCheckbox = document.getElementById("dontShowAgain");

  if (splash && dismissBtn) {
    const isDismissed = localStorage.getItem("letsfixindia_splash_dismissed_july20") || sessionStorage.getItem("letsfixindia_splash_dismissed_july20");
    if (!isDismissed) {
      splash.style.display = "flex";
      document.body.style.overflow = "hidden";
    }

    const backdrop = splash.querySelector(".splash-backdrop");
    const dismissSplash = () => {
      splash.style.display = "none";
      document.body.style.overflow = "";
      if (dontShowCheckbox && dontShowCheckbox.checked) {
        localStorage.setItem("letsfixindia_splash_dismissed_july20", "true");
      } else {
        sessionStorage.setItem("letsfixindia_splash_dismissed_july20", "true");
      }
    };

    dismissBtn.addEventListener("click", dismissSplash);
    if (backdrop) {
      backdrop.addEventListener("click", dismissSplash);
    }
    splash.addEventListener("click", (e) => {
      if (e.target === splash) {
        dismissSplash();
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", initSplash);
// Also run immediately in case DOMContentLoaded has already fired
if (document.readyState === "interactive" || document.readyState === "complete") {
  initSplash();
}

init();
