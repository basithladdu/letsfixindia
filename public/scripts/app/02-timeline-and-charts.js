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
  const activeAdvancedFilters = [
    state.category !== "all",
    state.actor !== "all",
    state.status !== "all",
    state.evidence !== "all",
    state.sort !== "desc"
  ].filter(Boolean).length;
  if (advancedFilterBadge) {
    advancedFilterBadge.hidden = activeAdvancedFilters === 0;
    advancedFilterBadge.textContent = `${activeAdvancedFilters} active`;
  }
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
    clearFiltersButton.disabled = !state.query && state.category === "all" && state.actor === "all" && state.status === "all" && state.evidence === "all" && state.year === "all" && state.sort === "desc";
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
              </div>
              <div class="chips">
                <span class="${chipClass(event.category)}">${esc(event.category)}</span>
                ${event.actors.map((actor) => `<span class="${chipClass(actor)}">${esc(actor)}</span>`).join("")}
              </div>
              <p>${esc(event.summary)}</p>
              <p class="outcome">${esc(event.outcome)}</p>
              <div style="margin-top: 14px; display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed rgba(0,0,0,0.08); padding-top: 12px; flex-wrap: wrap; gap: 12px;">
                <div class="source-links source-inline" aria-label="Sources for ${esc(event.title)}" style="margin-top: 0; background: none; border: none; padding: 0; display: inline-flex; align-items: center; gap: 6px;">
                  <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--muted); margin-right: 4px; letter-spacing: 0.05em;">Sources</span>
                  ${sourceLinks(event.sources)}
                </div>
                <a href="/submit?correct=${event.id}" data-link class="correction-link">Suggest a correction or update</a>
              </div>
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

