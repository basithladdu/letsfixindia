(() => {
  "use strict";

  const PAGE_SIZE = 24;
  const DENSITY_KEY = "letsfixindia_statistics_density";
  const state = {
    indicators: [],
    getTopic: () => "Other national indicators",
    getTone: () => "tone-flat",
    render: () => {},
    visibleLimit: PAGE_SIZE,
    density: "comfortable",
    initialized: false
  };

  const nodes = {};

  function cacheNodes() {
    nodes.root = document.querySelector('[data-page="statistics"]');
    nodes.search = document.querySelector("#indicatorSearchInput");
    nodes.topic = document.querySelector("#indicatorTopicFilter");
    nodes.tone = document.querySelector("#indicatorToneFilter");
    nodes.sort = document.querySelector("#indicatorSortFilter");
    nodes.quickTopics = document.querySelector("#statsQuickTopics");
    nodes.activeFilters = document.querySelector("#statsActiveFilters");
    nodes.signalMeter = document.querySelector("#statsSignalMeter");
    nodes.pagination = document.querySelector("#statsPagination");
    nodes.showing = document.querySelector("#statsShowingCount");
    nodes.loadMore = document.querySelector("#statsLoadMore");
    nodes.showAll = document.querySelector("#statsShowAll");
    nodes.densityButtons = Array.from(document.querySelectorAll("[data-stats-density]"));
  }

  function safeStoredDensity() {
    try {
      return localStorage.getItem(DENSITY_KEY) === "compact" ? "compact" : "comfortable";
    } catch {
      return "comfortable";
    }
  }

  function setDensity(value, persist = true) {
    state.density = value === "compact" ? "compact" : "comfortable";
    if (nodes.root) nodes.root.dataset.statsDensity = state.density;
    nodes.densityButtons.forEach((button) => {
      const active = button.dataset.statsDensity === state.density;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    if (persist) {
      try {
        localStorage.setItem(DENSITY_KEY, state.density);
      } catch {
        // Density preference is optional when storage is unavailable.
      }
    }
  }

  function requestRender({ resetPage = true } = {}) {
    if (resetPage) state.visibleLimit = PAGE_SIZE;
    state.render();
  }

  function setFilterValue(filterName, value) {
    const control = nodes[filterName];
    if (!control) return;
    control.value = value;
    requestRender();
    if (filterName !== "search") control.focus({ preventScroll: true });
  }

  function topicCounts() {
    return state.indicators.reduce((counts, indicator) => {
      const topic = state.getTopic(indicator);
      counts.set(topic, (counts.get(topic) || 0) + 1);
      return counts;
    }, new Map());
  }

  function renderQuickTopics() {
    if (!nodes.quickTopics) return;
    const counts = topicCounts();
    const topics = Array.from(counts.keys()).sort((a, b) => a.localeCompare(b));
    const button = (value, label, count) => `
      <button type="button" class="stats-topic-chip" data-stats-topic="${escapeAttribute(value)}" aria-pressed="false">
        <span>${escapeHtml(label)}</span><strong>${count}</strong>
      </button>`;
    nodes.quickTopics.innerHTML = [
      button("all", "All", state.indicators.length),
      ...topics.map((topic) => button(topic, topic, counts.get(topic)))
    ].join("");
  }

  function renderSignalMeter() {
    if (!nodes.signalMeter || !state.indicators.length) return;
    const counts = state.indicators.reduce((summary, indicator) => {
      const tone = state.getTone(indicator);
      summary[tone] = (summary[tone] || 0) + 1;
      return summary;
    }, { "tone-better": 0, "tone-worse": 0, "tone-flat": 0 });
    const total = state.indicators.length;
    const favorablePercent = (counts["tone-better"] / total) * 100;
    const adversePercent = (counts["tone-worse"] / total) * 100;
    const mixedPercent = Math.max(0, 100 - favorablePercent - adversePercent);
    nodes.signalMeter.innerHTML = `
      <div class="stats-signal-copy">
        <span>Signal mix</span>
        <small>Descriptive direction labels across all ${total} indicators</small>
      </div>
      <div class="stats-signal-visual">
        <div class="stats-signal-track" aria-hidden="true">
          <i class="is-favorable" style="width:${favorablePercent.toFixed(2)}%"></i>
          <i class="is-adverse" style="width:${adversePercent.toFixed(2)}%"></i>
          <i class="is-mixed" style="width:${mixedPercent.toFixed(2)}%"></i>
        </div>
        <div class="stats-signal-values">
          <span><i class="is-favorable"></i>${counts["tone-better"]} favorable</span>
          <span><i class="is-adverse"></i>${counts["tone-worse"]} adverse</span>
          <span><i class="is-mixed"></i>${counts["tone-flat"]} mixed</span>
        </div>
      </div>`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }

  function renderActiveFilters(meta) {
    if (!nodes.activeFilters) return;
    const filters = [];
    if (meta.query) filters.push({ key: "search", label: `Search: ${meta.query}` });
    if (meta.topic !== "all") filters.push({ key: "topic", label: meta.topic });
    if (meta.tone !== "all") {
      const label = nodes.tone?.selectedOptions?.[0]?.textContent || meta.tone;
      filters.push({ key: "tone", label: label.trim() });
    }
    if (meta.sort !== "editorial") {
      const label = nodes.sort?.selectedOptions?.[0]?.textContent || meta.sort;
      filters.push({ key: "sort", label: `Order: ${label.trim()}` });
    }
    nodes.activeFilters.hidden = filters.length === 0;
    nodes.activeFilters.innerHTML = filters.length ? `
      <span class="stats-active-label">Active</span>
      ${filters.map((filter) => `<button type="button" data-stats-clear="${filter.key}" aria-label="Remove ${escapeAttribute(filter.label)} filter">${escapeHtml(filter.label)}<span aria-hidden="true">×</span></button>`).join("")}
    ` : "";
  }

  function syncQuickTopicSelection(topic) {
    nodes.quickTopics?.querySelectorAll("[data-stats-topic]").forEach((button) => {
      const active = button.dataset.statsTopic === topic;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function updatePagination(meta) {
    if (!nodes.pagination) return;
    const shown = Math.min(meta.filteredCount, state.visibleLimit);
    const remaining = Math.max(0, meta.filteredCount - shown);
    nodes.pagination.hidden = meta.filteredCount === 0;
    if (nodes.showing) nodes.showing.textContent = `Showing ${shown} of ${meta.filteredCount}`;
    if (nodes.loadMore) {
      nodes.loadMore.hidden = remaining === 0;
      nodes.loadMore.textContent = `Show ${Math.min(PAGE_SIZE, remaining)} more`;
    }
    if (nodes.showAll) {
      nodes.showAll.hidden = remaining === 0;
      nodes.showAll.textContent = `Show all ${meta.filteredCount}`;
    }
  }

  function sync(meta) {
    renderActiveFilters(meta);
    syncQuickTopicSelection(meta.topic);
    updatePagination(meta);
  }

  function page(items) {
    return items.slice(0, state.visibleLimit);
  }

  async function copyIndicatorLink(button) {
    const id = button.dataset.copyIndicatorLink;
    if (!id) return;
    const url = new URL(location.href);
    url.hash = id;
    try {
      await navigator.clipboard.writeText(url.toString());
      const original = button.textContent;
      button.textContent = "Copied";
      button.classList.add("is-copied");
      window.setTimeout(() => {
        button.textContent = original;
        button.classList.remove("is-copied");
      }, 1400);
    } catch {
      location.hash = id;
    }
  }

  function clearOneFilter(key) {
    if (key === "search" && nodes.search) nodes.search.value = "";
    if (key === "topic" && nodes.topic) nodes.topic.value = "all";
    if (key === "tone" && nodes.tone) nodes.tone.value = "all";
    if (key === "sort" && nodes.sort) nodes.sort.value = "editorial";
    requestRender();
  }

  function clearAllFilters() {
    if (nodes.search) nodes.search.value = "";
    if (nodes.topic) nodes.topic.value = "all";
    if (nodes.tone) nodes.tone.value = "all";
    if (nodes.sort) nodes.sort.value = "editorial";
    requestRender();
  }

  function bindEvents() {
    nodes.quickTopics?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-stats-topic]");
      if (!button) return;
      setFilterValue("topic", button.dataset.statsTopic || "all");
    });
    nodes.activeFilters?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-stats-clear]");
      if (button) clearOneFilter(button.dataset.statsClear);
    });
    nodes.densityButtons.forEach((button) => {
      button.addEventListener("click", () => setDensity(button.dataset.statsDensity));
    });
    nodes.loadMore?.addEventListener("click", () => {
      state.visibleLimit += PAGE_SIZE;
      requestRender({ resetPage: false });
    });
    nodes.showAll?.addEventListener("click", () => {
      state.visibleLimit = Number.MAX_SAFE_INTEGER;
      requestRender({ resetPage: false });
    });
    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-stats-reset-all]")) {
        clearAllFilters();
        return;
      }
      const copyButton = event.target.closest("[data-copy-indicator-link]");
      if (copyButton) copyIndicatorLink(copyButton);
    });
  }

  function resetPage() {
    state.visibleLimit = PAGE_SIZE;
  }

  function revealHashTarget() {
    const targetId = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (!targetId.startsWith("indicator-") || document.getElementById(targetId)) return;
    state.visibleLimit = Number.MAX_SAFE_INTEGER;
    state.render();
    window.requestAnimationFrame(() => document.getElementById(targetId)?.scrollIntoView({ block: "start" }));
  }

  function init(config = {}) {
    if (state.initialized) return;
    cacheNodes();
    if (!nodes.root) return;
    state.indicators = Array.isArray(config.indicators) ? config.indicators : [];
    if (typeof config.getTopic === "function") state.getTopic = config.getTopic;
    if (typeof config.getTone === "function") state.getTone = config.getTone;
    if (typeof config.render === "function") state.render = config.render;
    if (location.hash.startsWith("#indicator-")) state.visibleLimit = Number.MAX_SAFE_INTEGER;
    state.density = safeStoredDensity();
    renderQuickTopics();
    renderSignalMeter();
    bindEvents();
    window.addEventListener("hashchange", revealHashTarget);
    setDensity(state.density, false);
    state.initialized = true;
  }

  window.LetsFixIndiaStatistics = { init, page, sync, resetPage };
})();
