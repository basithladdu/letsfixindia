let events = [];
let sources = {};
let indicators = [];
let voices = [];

const state = {
  query: "",
  category: "all",
  actor: "all",
  status: "all",
  year: "all"
};

const categoryFilter = document.querySelector("#categoryFilter");
const actorFilter = document.querySelector("#actorFilter");
const statusFilter = document.querySelector("#statusFilter");
const searchInput = document.querySelector("#searchInput");
const timelineList = document.querySelector("#timelineList");
const resultCount = document.querySelector("#resultCount");
const yearRail = document.querySelector("#yearRail");
const indicatorGrid = document.querySelector("#indicatorGrid");
const sourceList = document.querySelector("#sourceList");
const submissionForm = document.querySelector("#submissionForm");
const submissionQueue = document.querySelector("#submissionQueue");
const tenureValue = document.querySelector("#tenureValue");
const homeRecentList = document.querySelector("#homeRecentList");
const recordView = document.querySelector("#recordView");
const routePages = Array.from(document.querySelectorAll("[data-page]"));
const advancedFilters = document.querySelector("#advancedFilters");
const scrollDock = document.querySelector("#scrollDock");
const voicesGrid = document.querySelector("#voicesGrid");
const voicesSummary = document.querySelector("#voicesSummary");
const voiceFieldFilter = document.querySelector("#voiceFieldFilter");
const voiceStanceFilter = document.querySelector("#voiceStanceFilter");
const voiceIssueFilter = document.querySelector("#voiceIssueFilter");

const voiceState = { field: "all", stance: "all", issue: "all" };

const TIMELINE_LAST_SCROLL_KEY = "indiaDossier.timeline.lastY";
const TIMELINE_RETURN_SCROLL_KEY = "indiaDossier.timeline.returnY";
const TIMELINE_JUMP_ORIGIN_KEY = "indiaDossier.timeline.jumpOrigin";
let scrollSaveQueued = false;
let filtersWideState = null;

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

function esc(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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
      return `<a href="${sources[id].url}" target="_blank" rel="noopener" title="${sources[id].title}">${label}</a>`;
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
    } else {
      middleButton.textContent = "Saved spot";
      middleButton.disabled = timelineSavedY() < 24;
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
  const active = events.filter((e) => !e.archived);
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
  if (event.archived) return false;
  const query = state.query.trim().toLowerCase();
  const searchText = [event.title, event.summary, event.outcome, event.category, event.status, event.actors.join(" "), event.year, event.date].join(" ").toLowerCase();
  return (
    (!query || searchText.includes(query)) &&
    (state.category === "all" || event.category === state.category) &&
    (state.actor === "all" || event.actors.includes(state.actor)) &&
    (state.status === "all" || event.status === state.status) &&
    (state.year === "all" || String(event.year) === state.year)
  );
}

function renderTimeline() {
  const filtered = events.filter(matches).sort(byTimeline);
  const activeTotal = events.filter((e) => !e.archived).length;
  resultCount.textContent = `${filtered.length} records shown from ${activeTotal} total`;
  if (!filtered.length) {
    timelineList.innerHTML = `<div class="empty-state">No records match the current filters.</div>`;
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
              <div class="event-meta">
                <span>${event.date}</span>
                <span>${event.status}</span>
              </div>
              <div class="event-title-row">
                <a class="event-title-link" href="${eventUrl(event)}" data-link>${event.title}</a>
                <div class="source-links source-inline" aria-label="Sources for ${event.title}">
                  <span>Sources</span>
                  ${sourceLinks(event.sources)}
                </div>
              </div>
              <div class="chips">
                <span class="${chipClass(event.category)}">${event.category}</span>
                ${event.actors.map((actor) => `<span class="${chipClass(actor)}">${actor}</span>`).join("")}
              </div>
              <p>${event.summary}</p>
              <p class="outcome">${event.outcome}</p>
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `).join("");
}

function renderHomeRecent() {
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
  indicatorGrid.innerHTML = indicators.map((indicator) => {
    const max = Math.max(...indicator.chart.map((item) => item.value));
    return `
      <article class="indicator">
        <div class="indicator-head">
          <span>${indicator.direction}</span>
          <h3>${indicator.title}</h3>
          <strong>${indicator.value}</strong>
        </div>
        <p>${indicator.detail}</p>
        <div class="bars" aria-label="${indicator.title} bar chart">
          ${indicator.chart.map((item, index) => `
            <div class="bar-row">
              <span>${item.label}</span>
              <div class="bar-track"><div class="bar-fill" style="width:${Math.max(8, (item.value / max) * 100)}%;--i:${index}"></div></div>
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
  sourceList.innerHTML = Object.entries(sources).map(([id, source]) => `
    <article class="source-item">
      <div>
        <span>${source.type}</span>
        <h3>${source.title}</h3>
        <p>${source.publisher}</p>
      </div>
      <a href="${source.url}" target="_blank" rel="noopener">Open source</a>
    </article>
  `).join("");
}

function renderRecord(id) {
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
      <div class="record-kicker">${event.year} - ${event.date} - ${event.status}</div>
      <h1>${event.title}</h1>
      <div class="chips">
        <span class="${chipClass(event.category)}">${event.category}</span>
        ${event.actors.map((actor) => `<span class="${chipClass(actor)}">${actor}</span>`).join("")}
      </div>
      <div class="record-columns">
        <article>
          <h2>Record</h2>
          <p>${event.summary}</p>
          <p>${event.outcome}</p>
        </article>
        <aside>
          <h2>Sources</h2>
          <div class="source-links record-source-links">${sourceLinks(event.sources)}</div>
        </aside>
      </div>
    </div>
  `;
}

function routeFromPath(pathname) {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path.startsWith("/record/")) {
    return { page: "record", id: decodeURIComponent(path.slice("/record/".length)) };
  }
  if (path === "/" || path === "/timeline") return { page: "timeline" };
  if (path === "/statistics" || path === "/indicators") return { page: "statistics" };
  if (path === "/voices") return { page: "voices" };
  if (path === "/submit") return { page: "submit" };
  if (path === "/sources") return { page: "sources" };
  if (path === "/methodology") return { page: "methodology" };
  if (path === "/faq") return { page: "faq" };
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

function renderRoute(options = {}) {
  const route = resolveRoute();
  routePages.forEach((section) => section.classList.toggle("is-active", section.dataset.page === route.page));
  setActiveNav(route.page);
  if (route.page === "record") {
    renderRecord(route.id);
  }
  if (route.page === "voices") {
    renderVoices();
  }
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
  tenureValue.textContent = fmtYMD(modiYMD);
  document.getElementById("tenureSubtitle").textContent = `From 26 May 2014 to ${fmt.format(now)}`;
  document.getElementById("footerDate").textContent = `Updated ${fmt.format(now)}`;
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
  document.getElementById("bjpTotalValue").textContent = fmtYMD(bjpYMD);
  document.getElementById("bjpTotalSubtitle").textContent =
    `Vajpayee 1996; 1998-2004 (${Math.round(vajpayee2Days / 365.25 * 10) / 10} yrs); Modi 2014-present`;
}

function getDrafts() {
  try {
    return JSON.parse(localStorage.getItem("publicRecordDrafts") || "[]");
  } catch {
    return [];
  }
}

function saveDrafts(drafts) {
  localStorage.setItem("publicRecordDrafts", JSON.stringify(drafts));
}

function renderSubmissions() {
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
  const { field, stance, issue } = voiceState;
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

  if (!filtered.length) {
    voicesGrid.innerHTML = `<div class="empty-state">No figures match the current filters.</div>`;
    return;
  }

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

    let dominantClass = "voice-neutral";
    if (spokeCount > 0 && spokeCount >= govtCnt) dominantClass = "voice-spoke";
    else if (govtCnt > 0) dominantClass = "voice-govt";
    else if (silentCnt === voice.stances.length) dominantClass = "voice-silent";

    return `
      <article class="voice-card ${dominantClass}">
        <div class="voice-header">
          <div class="voice-avatar">${esc(voice.name.charAt(0))}</div>
          <div>
            <h3 class="voice-name">${esc(voice.name)}</h3>
            <div class="voice-fields">${fieldChips}</div>
          </div>
        </div>
        <p class="voice-desc">${esc(voice.description)}</p>
        <div class="voice-tally">
          <span class="tally spoke-out" title="Spoke out">${spokeCount}</span>
          <span class="tally supported-govt" title="Supported govt">${govtCnt}</span>
          <span class="tally silent" title="Silent">${silentCnt}</span>
        </div>
        <div class="voice-stances">
          ${stancesHtml}
        </div>
      </article>
    `;
  }).join("");
}

function bindEvents() {
  syncFilterDisclosure();

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-link]");
    if (!link) return;
    const url = new URL(link.href);
    if (url.origin !== window.location.origin) return;
    const fromRoute = resolveRoute();
    const toRoute = routeFromPath(url.pathname);
    if (fromRoute.page === "timeline") {
      saveTimelineScroll(true);
    }
    event.preventDefault();
    const restoreTimeline = toRoute.page === "timeline" && fromRoute.page === "record";
    history.pushState({ restoreTimeline }, "", url.pathname);
    renderRoute({ restoreTimeline });
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
    const button = event.target.closest("button[data-scroll-action]");
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
  });

  searchInput.addEventListener("input", (event) => {
    state.query = event.target.value;
    renderTimeline();
    updateScrollDock();
  });

  categoryFilter.addEventListener("change", (event) => {
    state.category = event.target.value;
    renderTimeline();
    updateScrollDock();
  });

  actorFilter.addEventListener("change", (event) => {
    state.actor = event.target.value;
    renderTimeline();
    updateScrollDock();
  });

  statusFilter.addEventListener("change", (event) => {
    state.status = event.target.value;
    renderTimeline();
    updateScrollDock();
  });

  yearRail.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-year]");
    if (!button) return;
    saveTimelineScroll(true);
    state.year = button.dataset.year;
    yearRail.querySelectorAll(".year-pill").forEach((pill) => pill.classList.toggle("active", pill === button));
    renderTimeline();
    updateScrollDock();
  });

  submissionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(submissionForm);
    const draft = Object.fromEntries(formData.entries());
    draft.createdAt = new Date().toISOString();
    const drafts = getDrafts();
    drafts.unshift(draft);
    saveDrafts(drafts);
    submissionForm.reset();
    renderSubmissions();
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

  submissionQueue.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-remove-draft]");
    if (!button) return;
    const index = Number(button.dataset.removeDraft);
    const drafts = getDrafts();
    drafts.splice(index, 1);
    saveDrafts(drafts);
    renderSubmissions();
  });
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Unable to load ${path}`);
  }
  return response.json();
}

async function init() {
  try {
    let voicesData;
    [sources, indicators, events, voicesData] = await Promise.all([
      loadJson("data/sources.json"),
      loadJson("data/indicators.json"),
      loadJson("data/events.json"),
      loadJson("data/voices.json").catch(() => [])
    ]);
    voices = voicesData || [];
    renderOptions();
    renderIndicators();
    renderSources();
    renderHomeRecent();
    populateVoiceIssues();
    calculateTenure();
    bindEvents();
    renderTimeline();
    renderVoices();
    renderSubmissions();
    if (!history.state) {
      history.replaceState({ restoreTimeline: false }, "", window.location.pathname);
    }
    renderRoute();
  } catch (error) {
    timelineList.innerHTML = `<div class="empty-state">The JSON data files did not load. Run this folder through a local web server, then reload.</div>`;
    resultCount.textContent = "JSON load failed";
    console.error(error);
  }
}

init();
