/* MapLibre state explorer: state boundaries, record counts, and state timelines. */
const STATE_DISPLAY_NAMES = {
  "Jammu And Kashmir": "Jammu and Kashmir",
  "Andaman And Nicobar Islands": "Andaman and Nicobar Islands",
  "The Dadra And Nagar Haveli And Daman And Diu": "Dadra and Nagar Haveli and Daman and Diu"
};

function stateDisplayName(name) {
  return STATE_DISPLAY_NAMES[name] || name;
}

function stateEvents(name) {
  if (!name) return [];
  return events
    .filter((event) => (eventJurisdictions[event.id] || []).includes(name))
    .sort(byTimeline);
}

function stateFeatures() {
  return Array.isArray(stateBoundaries?.features) ? stateBoundaries.features : [];
}

function stateCountMap() {
  return new Map(stateFeatures().map((feature) => [feature.properties.name, stateEvents(feature.properties.name).length]));
}

function enrichedStateGeojson() {
  const counts = stateCountMap();
  return {
    type: "FeatureCollection",
    features: stateFeatures().map((feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        display_name: stateDisplayName(feature.properties.name),
        event_count: counts.get(feature.properties.name) || 0
      }
    }))
  };
}

function geojsonBounds(feature) {
  const bounds = { minLng: Infinity, minLat: Infinity, maxLng: -Infinity, maxLat: -Infinity };
  const visit = (value) => {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && Number.isFinite(value[0]) && Number.isFinite(value[1])) {
      bounds.minLng = Math.min(bounds.minLng, value[0]);
      bounds.minLat = Math.min(bounds.minLat, value[1]);
      bounds.maxLng = Math.max(bounds.maxLng, value[0]);
      bounds.maxLat = Math.max(bounds.maxLat, value[1]);
      return;
    }
    value.forEach(visit);
  };
  visit(feature?.geometry?.coordinates);
  return Number.isFinite(bounds.minLng)
    ? [[bounds.minLng, bounds.minLat], [bounds.maxLng, bounds.maxLat]]
    : null;
}

function mappedRecordCount() {
  return events.filter((event) => Array.isArray(eventJurisdictions[event.id]) && eventJurisdictions[event.id].length).length;
}

function renderStateDirectory() {
  if (!stateDirectory || !stateMapSelect) return;
  const counts = stateCountMap();
  const features = [...stateFeatures()].sort((a, b) => stateDisplayName(a.properties.name).localeCompare(stateDisplayName(b.properties.name)));
  stateMapSelect.innerHTML = `<option value="">Choose a state or UT</option>${features.map((feature) => {
    const name = feature.properties.name;
    const count = counts.get(name) || 0;
    return `<option value="${esc(name)}">${esc(stateDisplayName(name))} (${count})</option>`;
  }).join("")}`;
  stateMapSelect.value = selectedStateName;
  stateDirectory.innerHTML = features.map((feature) => {
    const name = feature.properties.name;
    const count = counts.get(name) || 0;
    const selected = name === selectedStateName;
    return `<button type="button" class="state-directory-item${selected ? " is-selected" : ""}" data-state-name="${esc(name)}" aria-pressed="${selected}" role="listitem"><span>${esc(stateDisplayName(name))}</span><strong>${count}</strong></button>`;
  }).join("");
}

function renderStateSelection(name) {
  if (!stateMapSelection || !stateTimeline || !stateMapSummary) return;
  const mapped = mappedRecordCount();
  const jurisdictions = stateFeatures().length;
  if (!name) {
    stateMapSelection.innerHTML = `
      <span class="state-map-kicker">India overview</span>
      <h3>Choose a state or union territory</h3>
      <p>${mapped} of ${events.length} records currently carry at least one explicit state/UT tag. India-wide and unreviewed records are not forced into a state.</p>
    `;
    stateTimeline.innerHTML = `<div class="state-timeline-empty"><strong>State timeline ready</strong><p>Click a boundary, use the selector, or choose from the directory below.</p></div>`;
    stateMapSummary.textContent = `${mapped} state-tagged records · ${jurisdictions} selectable jurisdictions`;
    return;
  }

  const matching = stateEvents(name);
  const displayName = stateDisplayName(name);
  const categories = uniqueSorted(matching.map((event) => event.category));
  const years = uniqueSorted(matching.map((event) => event.year));
  stateMapSelection.innerHTML = `
    <span class="state-map-kicker">Selected jurisdiction</span>
    <h3>${esc(displayName)}</h3>
    <p><strong>${matching.length}</strong> mapped record${matching.length === 1 ? "" : "s"}${years.length ? ` across ${years[0]}-${years[years.length - 1]}` : ""}. ${categories.length ? `${categories.length} categories represented.` : "No category is currently represented."}</p>
  `;
  stateMapSummary.textContent = `${displayName} · ${matching.length} mapped record${matching.length === 1 ? "" : "s"}`;
  if (!matching.length) {
    stateTimeline.innerHTML = `<div class="state-timeline-empty"><strong>No tagged records yet</strong><p>This is a coverage gap, not evidence that no relevant events occurred. India-wide records may still affect this jurisdiction.</p></div>`;
    return;
  }
  stateTimeline.innerHTML = matching.map((event) => {
    const evidence = sourceStatus(event.sources);
    return `
      <article class="state-timeline-item">
        <div class="state-timeline-meta"><time>${esc(event.year)}</time><span>${esc(event.date)}</span><span class="${statusClass(event.status)}">${esc(event.status)}</span></div>
        <h4><a href="${eventUrl(event)}" data-link>${esc(event.title)}</a></h4>
        <p>${esc(event.summary)}</p>
        <div class="state-timeline-foot"><span class="chip">${esc(event.category)}</span><span class="evidence-state ${evidence.className}">${esc(evidence.label)}</span></div>
      </article>
    `;
  }).join("");
}

function updateMapSelection(name, fit = true) {
  selectedStateName = name || "";
  if (stateMapSelect) stateMapSelect.value = selectedStateName;
  if (stateMapReset) stateMapReset.disabled = !selectedStateName;
  renderStateSelection(selectedStateName);
  renderStateDirectory();
  if (!stateMapReady || !stateMapInstance) return;
  const filter = ["==", ["get", "name"], selectedStateName || "__none__"];
  ["india-states-selected", "india-states-selected-outline"].forEach((layer) => {
    if (stateMapInstance.getLayer(layer)) stateMapInstance.setFilter(layer, filter);
  });
  if (!fit) return;
  if (!selectedStateName) {
    stateMapInstance.fitBounds([[67.5, 6.2], [98, 37.5]], { padding: 24, duration: 500 });
    return;
  }
  const feature = stateFeatures().find((item) => item.properties.name === selectedStateName);
  const bounds = geojsonBounds(feature);
  if (bounds) stateMapInstance.fitBounds(bounds, { padding: 52, maxZoom: 6.4, duration: 600 });
}

function prepareStateExplorer() {
  if (!stateFeatures().length) {
    if (stateMapSummary) stateMapSummary.textContent = "State boundary data is unavailable.";
    if (indiaStateMap) indiaStateMap.innerHTML = `<div class="state-map-error">The boundary file could not be loaded.</div>`;
    return;
  }
  renderStateDirectory();
  renderStateSelection(selectedStateName);
}

function initStateMap() {
  if (!indiaStateMap || !stateFeatures().length) return;
  if (stateMapInstance) {
    stateMapInstance.resize();
    return;
  }
  if (!window.maplibregl) {
    indiaStateMap.innerHTML = `<div class="state-map-error">Interactive map rendering is unavailable. Use the state selector or directory.</div>`;
    return;
  }
  try {
    stateMapInstance = new window.maplibregl.Map({
      container: indiaStateMap,
      center: [79, 22.5],
      zoom: 3.25,
      minZoom: 2.5,
      maxZoom: 8,
      attributionControl: false,
      style: {
        version: 8,
        sources: {},
        layers: [{ id: "background", type: "background", paint: { "background-color": "#f4efe5" } }]
      }
    });
    stateMapInstance.addControl(new window.maplibregl.NavigationControl({ showCompass: false }), "top-right");
    stateMapInstance.on("load", () => {
      stateMapInstance.addSource("india-states", { type: "geojson", data: enrichedStateGeojson() });
      stateMapInstance.addLayer({
        id: "india-states-fill",
        type: "fill",
        source: "india-states",
        paint: {
          "fill-color": ["interpolate", ["linear"], ["get", "event_count"], 0, "#ece8df", 1, "#f6c66f", 5, "#e98f38", 12, "#bb3e2e", 25, "#6f1d2a"],
          "fill-opacity": 0.9
        }
      });
      stateMapInstance.addLayer({
        id: "india-states-outline",
        type: "line",
        source: "india-states",
        paint: { "line-color": "#34312d", "line-width": 0.85, "line-opacity": 0.78 }
      });
      stateMapInstance.addLayer({
        id: "india-states-selected",
        type: "fill",
        source: "india-states",
        filter: ["==", ["get", "name"], selectedStateName || "__none__"],
        paint: { "fill-color": "#138808", "fill-opacity": 0.48 }
      });
      stateMapInstance.addLayer({
        id: "india-states-selected-outline",
        type: "line",
        source: "india-states",
        filter: ["==", ["get", "name"], selectedStateName || "__none__"],
        paint: { "line-color": "#073d24", "line-width": 3 }
      });
      stateMapInstance.on("click", "india-states-fill", (event) => {
        const name = event.features?.[0]?.properties?.name;
        if (!name) return;
        playUiSound("nav");
        updateMapSelection(name);
      });
      stateMapInstance.on("mouseenter", "india-states-fill", () => { stateMapInstance.getCanvas().style.cursor = "pointer"; });
      stateMapInstance.on("mouseleave", "india-states-fill", () => { stateMapInstance.getCanvas().style.cursor = ""; });
      stateMapReady = true;
      stateMapInstance.fitBounds([[67.5, 6.2], [98, 37.5]], { padding: 24, duration: 0 });
      if (selectedStateName) updateMapSelection(selectedStateName, false);
    });
    stateMapInstance.on("error", (event) => console.warn("State map warning:", event.error || event));
  } catch (error) {
    indiaStateMap.innerHTML = `<div class="state-map-error">Interactive map rendering failed. Use the state selector or directory.</div>`;
    console.error("State map initialization failed:", error);
  }
}
