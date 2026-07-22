async function loadJson(path) {
  const response = await fetch(path.startsWith("/") ? path : `/${path}`);
  if (!response.ok) {
    throw new Error(`Unable to load ${path}`);
  }
  return response.json();
}

async function init() {
  try {
    const initialRoute = resolveRoute();
    if (initialRoute.page === "map") {
      void ensureStateExplorerData();
      void ensureStateMapAssets().catch(() => {});
    } else if (initialRoute.page === "gallery") {
      void ensureGalleryAssets().catch(() => {});
    }
    let voicesData;
    let backlogData;
    let boundariesData;
    let jurisdictionData, groupsData, outletsData, peopleData, connectionsData;
    [sources, indicators, events, voicesData, backlogData, boundariesData, jurisdictionData, groupsData, outletsData, peopleData, connectionsData] = await Promise.all([
      loadJson("data/sources.json"),
      loadJson("data/indicators.json"),
      loadJson("data/events.json"),
      loadJson("data/voices.json").catch(() => []),
      loadJson("data/research_backlog.json").catch(() => []),
      loadJson("data/india-states.geojson").catch(() => null),
      loadJson("data/event-jurisdictions.json").catch(() => null),
      loadJson("data/media-groups.json").catch(() => []), loadJson("data/media-outlets.json").catch(() => []),
      loadJson("data/media-people.json").catch(() => []), loadJson("data/media-connections.json").catch(() => [])
    ]);
    voices = voicesData || [];
    researchBacklog = backlogData || [];
    stateBoundaries = boundariesData;
    eventJurisdictions = jurisdictionData?.eventStates || {};
    mediaGroups = groupsData; mediaOutlets = outletsData; mediaPeople = peopleData; mediaConnections = connectionsData;
    renderOptions();
    populateIndicatorTopics();
    renderStatsOverview();
    populateVoiceIssues();
    populateMediaFilters();
    calculateTenure();
    bindEvents();
    bindMediaMapEvents();
    window.LetsFixIndiaStatistics?.init({ indicators, getTopic: indicatorTopic, getTone: indicatorTone, render: renderIndicators });
    if (!history.state) {
      history.replaceState({ restoreTimeline: false }, "", `${window.location.pathname}${window.location.search}${window.location.hash}`);
    }
    renderShareBars();
    setSoundEnabled(soundEnabled);
    ensureScrollProgress();
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
  voiceState.sort = "editorial";
  if (voiceSearchInput) voiceSearchInput.value = "";
  if (voiceFieldFilter) voiceFieldFilter.value = "all";
  if (voiceStanceFilter) voiceStanceFilter.value = "all";
  if (voiceIssueFilter) voiceIssueFilter.value = "all";
  if (voiceSortFilter) voiceSortFilter.value = "editorial";
  renderVoices();
}

// Initialize splash screen alert
function initSplash() {
  const splash = document.getElementById("splashScreen");
  const dismissBtn = document.getElementById("dismissSplash");
  const dontShowCheckbox = document.getElementById("dontShowAgain");

  if (splash && dismissBtn) {
    const isEnabled = splash.dataset.active === "true";
    if (!isEnabled) {
      splash.hidden = true;
      splash.classList.remove("is-visible");
      splash.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      return;
    }

    const isDismissed = localStorage.getItem("letsfixindia_splash_dismissed_july20") || sessionStorage.getItem("letsfixindia_splash_dismissed_july20");
    if (!isDismissed) {
      splash.hidden = false;
      splash.classList.add("is-visible");
      splash.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    const backdrop = splash.querySelector(".splash-backdrop");
    const dismissSplash = () => {
      splash.hidden = true;
      splash.classList.remove("is-visible");
      splash.setAttribute("aria-hidden", "true");
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
