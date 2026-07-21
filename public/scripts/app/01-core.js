// Initialize Supabase using the credentials provided
const supabaseUrl = 'https://pjonynkzgsfwojwboixi.supabase.co';
const supabaseKey = 'sb_publishable_YH3S94knvXqBI3a960u01w_fqgmz0LC';
let db;

try {
  if (typeof window !== 'undefined' && window.supabase) {
    db = window.supabase.createClient(supabaseUrl, supabaseKey);
  }
} catch (error) {
  console.error("Supabase init failed:", error);
}

let events = [];
let sources = {};
let indicators = [];
let voices = [];
let researchBacklog = [];
let stateBoundaries = null;
let eventJurisdictions = {};
let stateMapInstance = null;
let stateMapReady = false;
let selectedStateName = "";

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

  function calendarElapsed(start, end) {
    const addMonthsClamped = (value, months) => {
      const result = new Date(value);
      const day = result.getDate();
      result.setDate(1);
      result.setMonth(result.getMonth() + months);
      const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
      result.setDate(Math.min(day, lastDay));
      return result;
    };
    let totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
    let anchor = addMonthsClamped(start, totalMonths);
    if (anchor > end) {
      totalMonths -= 1;
      anchor = addMonthsClamped(start, totalMonths);
    }
    const remainder = end - anchor;
    return {
      years: Math.floor(totalMonths / 12),
      months: totalMonths % 12,
      days: Math.floor(remainder / (1000 * 60 * 60 * 24)),
      hours: Math.floor((remainder % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    };
  }
  
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
        pressEl.textContent = "0Y · 0M · 0D · 0H";
      } else {
        const elapsed = calendarElapsed(pressStart, now);
        const unitLabel = (value, singular) => `${value} ${singular}${value === 1 ? "" : "s"}`;
        pressEl.setAttribute("aria-label", [unitLabel(elapsed.years, "year"), unitLabel(elapsed.months, "month"), unitLabel(elapsed.days, "day"), unitLabel(elapsed.hours, "hour")].join(", "));
        pressEl.innerHTML = `<span class="tracker-unit"><strong>${elapsed.years}</strong><small>Y</small></span><i aria-hidden="true">&middot;</i><span class="tracker-unit"><strong>${elapsed.months}</strong><small>M</small></span><i aria-hidden="true">&middot;</i><span class="tracker-unit"><strong>${elapsed.days}</strong><small>D</small></span><i aria-hidden="true">&middot;</i><span class="tracker-unit"><strong>${elapsed.hours}</strong><small>H</small></span>`;
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
const indicatorTopicFilter = document.querySelector("#indicatorTopicFilter");
const indicatorToneFilter = document.querySelector("#indicatorToneFilter");
const indicatorSortFilter = document.querySelector("#indicatorSortFilter");
const indicatorResultCount = document.querySelector("#indicatorResultCount");
const clearIndicatorFiltersButton = document.querySelector("#clearIndicatorFiltersButton");
const statsOverview = document.querySelector("#statsOverview");
const stateMapSelect = document.querySelector("#stateMapSelect");
const stateMapReset = document.querySelector("#stateMapReset");
const stateMapSummary = document.querySelector("#stateMapSummary");
const stateMapSelection = document.querySelector("#stateMapSelection");
const stateTimeline = document.querySelector("#stateTimeline");
const stateDirectory = document.querySelector("#stateDirectory");
const indiaStateMap = document.querySelector("#indiaStateMap");
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
const advancedFilterBadge = document.querySelector("#advancedFilterBadge");
const scrollDock = document.querySelector("#scrollDock");
const voicesGrid = document.querySelector("#voicesGrid");
const voicesSummary = document.querySelector("#voicesSummary");
const voicesMeta = document.querySelector("#voicesMeta");
const voiceFieldFilter = document.querySelector("#voiceFieldFilter");
const voiceStanceFilter = document.querySelector("#voiceStanceFilter");
const voiceIssueFilter = document.querySelector("#voiceIssueFilter");
const voiceSearchInput = document.querySelector("#voiceSearchInput");
const voiceSortFilter = document.querySelector("#voiceSortFilter");
const voiceIssueSpotlight = document.querySelector("#voiceIssueSpotlight");
const clearVoiceFiltersButton = document.querySelector("#clearVoiceFiltersButton");

const voiceState = { query: "", field: "all", stance: "all", issue: "all", sort: "editorial" };
const sourceState = { query: "", status: "all" };
const renderedPages = new Set();

const sourceFilterStatus = (id, source, usage) => {
  if (source.url) return usage.has(id) ? "linked" : "unused-linked";
  return usage.has(id) ? "pending" : "unused-pending";
};

const TIMELINE_LAST_SCROLL_KEY = "letsFixIndia.timeline.lastY";
const TIMELINE_RETURN_SCROLL_KEY = "letsFixIndia.timeline.returnY";
const TIMELINE_JUMP_ORIGIN_KEY = "letsFixIndia.timeline.jumpOrigin";
const UI_SOUND_KEY = "letsFixIndia.ui.sound";
let scrollSaveQueued = false;
let filtersWideState = null;
let routeMotionTimer = 0;
let soundEnabled = readUiSoundPreference();
let audioContext = null;
let scrollProgressBar = null;
let globalStatusToast = null;
let globalStatusTimer = 0;

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

function esc(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function closestFromEvent(event, selector) {
  return event.target instanceof Element ? event.target.closest(selector) : null;
}

function readUiSoundPreference() {
  return false;
}

function updateSoundButtons() {
  document.querySelectorAll("[data-sound-toggle]").forEach((button) => {
    button.setAttribute("aria-pressed", String(soundEnabled));
    button.classList.toggle("is-on", soundEnabled);
    const label = soundEnabled ? "Sound on" : "Sound off";
    button.title = label;
    button.setAttribute("aria-label", label);
    const text = button.querySelector("span");
    if (text) text.textContent = label;
  });
}

function setSoundEnabled(enabled) {
  soundEnabled = enabled;
  try {
    localStorage.setItem(UI_SOUND_KEY, enabled ? "on" : "off");
  } catch {
    // Keep the current page state even if browser storage is blocked.
  }
  document.documentElement.classList.toggle("sound-enabled", enabled);
  updateSoundButtons();
}

function playUiSound(kind = "tap", force = false) {
  if (!force && !soundEnabled) return;
  if (navigator.vibrate) {
    try {
      navigator.vibrate(kind === "success" ? [8, 22, 10] : 10);
    } catch {}
  }
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    audioContext ||= new AudioCtx();
    if (audioContext.state === "suspended") audioContext.resume();
    const now = audioContext.currentTime;
    const notes = {
      tap: [[440, 0, 0.035, 0.018]],
      nav: [[520, 0, 0.045, 0.022], [640, 0.048, 0.04, 0.016]],
      filter: [[360, 0, 0.04, 0.016], [420, 0.035, 0.035, 0.012]],
      success: [[660, 0, 0.055, 0.028], [880, 0.06, 0.07, 0.02]]
    };
    (notes[kind] || notes.tap).forEach(([freq, offset, duration, peak]) => {
      const start = now + offset;
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = kind === "success" ? "triangle" : "sine";
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.14, start + duration);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(peak, start + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain).connect(audioContext.destination);
      osc.start(start);
      osc.stop(start + duration + 0.012);
    });
  } catch {}
}

function setGlobalStatus(message, delay = 1800) {
  if (!message) return;
  if (!globalStatusToast) {
    globalStatusToast = document.createElement("div");
    globalStatusToast.className = "ui-toast";
    globalStatusToast.setAttribute("role", "status");
    globalStatusToast.setAttribute("aria-live", "polite");
    document.body.appendChild(globalStatusToast);
  }
  window.clearTimeout(globalStatusTimer);
  globalStatusToast.textContent = message;
  globalStatusToast.classList.add("is-visible");
  globalStatusTimer = window.setTimeout(() => {
    globalStatusToast?.classList.remove("is-visible");
  }, delay);
}

function setShareStatus(control, message, delay = 1800) {
  const status = control?.closest?.(".share-bar")?.querySelector?.("[data-share-status]");
  if (!status) {
    setGlobalStatus(message, delay);
    return;
  }
  window.clearTimeout(status._clearTimer);
  status.textContent = message;
  status.classList.toggle("is-visible", Boolean(message));
  if (message && delay) {
    status._clearTimer = window.setTimeout(() => {
      status.textContent = "";
      status.classList.remove("is-visible");
    }, delay);
  }
}

async function copyTextToClipboard(text) {
  const value = String(text || "");
  if (!value) return false;
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const field = document.createElement("textarea");
    field.value = value;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.left = "-9999px";
    field.style.top = "0";
    document.body.appendChild(field);
    field.select();
    field.setSelectionRange(0, field.value.length);
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    field.remove();
    return copied;
  }
}

function triggerTapFeedback(control, sourceEvent) {
  if (!(control instanceof HTMLElement)) return;
  if (sourceEvent && "clientX" in sourceEvent && "clientY" in sourceEvent) {
    const rect = control.getBoundingClientRect();
    control.style.setProperty("--tap-x", `${sourceEvent.clientX - rect.left}px`);
    control.style.setProperty("--tap-y", `${sourceEvent.clientY - rect.top}px`);
  }
  control.classList.remove("is-tapping");
  void control.offsetWidth;
  control.classList.add("is-tapping");
  window.setTimeout(() => control.classList.remove("is-tapping"), 900);
}

function triggerRouteMotion(page) {
  document.documentElement.dataset.route = page;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  window.clearTimeout(routeMotionTimer);
  document.documentElement.classList.remove("route-motion");
  void document.documentElement.offsetWidth;
  document.documentElement.classList.add("route-motion");
  routeMotionTimer = window.setTimeout(() => {
    document.documentElement.classList.remove("route-motion");
  }, 900);
}

function ensureScrollProgress() {
  if (scrollProgressBar) return;
  scrollProgressBar = document.createElement("div");
  scrollProgressBar.className = "scroll-progress";
  scrollProgressBar.setAttribute("aria-hidden", "true");
  scrollProgressBar.dataset.scrollProgress = "";
  document.body.prepend(scrollProgressBar);
  updateScrollProgress();
}

function updateScrollProgress() {
  if (!scrollProgressBar) return;
  const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const progress = max ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  scrollProgressBar.hidden = max < 80;
  scrollProgressBar.style.transform = `scaleX(${progress})`;
}

function uniqueSorted(values) {
  return Array.from(new Set(values)).sort((a, b) => String(a).localeCompare(String(b)));
}

const MONTHS = ["january","february","march","april","may","june","july","august","september","october","november","december"];

// Turn a free-text date ("20 July 2026", "May-July 2026", "6 February 2026",
// "December 2014", "2026-07-20", "2026") into a sortable number within its year.
// Ranges sort by their latest month; missing month/day sort to the start of the year.
function dateSortKey(event) {
  const raw = String(event.date || "").trim();
  const iso = raw.match(/^\d{4}-(\d{2})-(\d{2})/);
  if (iso) return Number(iso[1]) * 100 + Number(iso[2]);
  const lower = raw.toLowerCase();
  // Use the rightmost month mentioned (handles ranges like "May-July" or
  // cross-year spans like "16 December 2025-4 May 2026").
  let month = 0;
  let monthPos = -1;
  MONTHS.forEach((name, i) => {
    const pos = lower.lastIndexOf(name);
    if (pos > monthPos) { monthPos = pos; month = i + 1; }
  });
  // Use the last 1-2 digit day number (<=31), i.e. the one nearest that month.
  const days = raw.match(/\b(\d{1,2})\b/g) || [];
  const validDays = days.map(Number).filter((n) => n >= 1 && n <= 31);
  const day = validDays.length ? validDays[validDays.length - 1] : 0;
  return month * 100 + day;
}

function byTimeline(a, b) {
  if (a.year !== b.year) return b.year - a.year;
  return dateSortKey(b) - dateSortKey(a);
}

function byTimelineAsc(a, b) {
  if (a.year !== b.year) return a.year - b.year;
  return dateSortKey(a) - dateSortKey(b);
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
  const target = clampScroll(y);
  if (behavior === "auto") {
    const root = document.documentElement;
    const body = document.body;
    const previousBehavior = root.style.scrollBehavior;
    const previousBodyBehavior = body.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    body.style.scrollBehavior = "auto";
    root.scrollTop = target;
    body.scrollTop = target;
    requestAnimationFrame(() => {
      root.style.scrollBehavior = previousBehavior;
      body.style.scrollBehavior = previousBodyBehavior;
    });
    return;
  }
  window.scrollTo({ top: target, behavior });
}

function jumpDockToY(y) {
  cancelCruise();
  scrollToY(y, "auto");
  requestAnimationFrame(updateScrollDock);
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
  const shouldShowDock = isLongTimeline;
  scrollDock.hidden = !shouldShowDock;
  scrollDock.classList.toggle("is-visible", shouldShowDock);
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

function hashTargetFor(hash = window.location.hash) {
  if (!hash || hash === "#") return null;
  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return null;
  }
}

function scrollToHashTarget(hash = window.location.hash, behavior = "auto") {
  const target = hashTargetFor(hash);
  if (!target) return false;
  target.scrollIntoView({ behavior, block: "start" });
  return true;
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
    `<button type="button" class="year-pill${state.year === "all" ? " active" : ""}" data-year="all" aria-pressed="${state.year === "all"}">All years</button>`,
    ...years.map((year) => `<button type="button" class="year-pill${state.year === String(year) ? " active" : ""}" data-year="${year}" aria-pressed="${state.year === String(year)}">${year}</button>`)
  ].join("");
}
