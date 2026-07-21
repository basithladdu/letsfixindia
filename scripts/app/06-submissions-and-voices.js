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
  state.sort = "desc";
  if (searchInput) searchInput.value = "";
  if (categoryFilter) categoryFilter.value = "all";
  if (actorFilter) actorFilter.value = "all";
  if (statusFilter) statusFilter.value = "all";
  if (evidenceFilter) evidenceFilter.value = "all";
  if (sortFilter) sortFilter.value = "desc";
  yearRail?.querySelectorAll(".year-pill").forEach((pill) => {
    const isActive = pill.dataset.year === "all";
    pill.classList.toggle("active", isActive);
    pill.setAttribute("aria-pressed", String(isActive));
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
    case "silent": return "No statement found";
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
  renderVoiceIssueSpotlight();
}

function renderVoiceIssueSpotlight() {
  if (!voiceIssueSpotlight) return;
  const issueStats = new Map();
  voices.forEach((voice) => voice.stances.forEach((stance) => {
    const current = issueStats.get(stance.issue) || { people: new Set(), sourceLinks: 0 };
    current.people.add(voice.id || voice.name);
    current.sourceLinks += (stance.sources || []).filter((sourceId) => sources[sourceId]?.url).length;
    issueStats.set(stance.issue, current);
  }));
  const ranked = [...issueStats.entries()].sort((a, b) => b[1].people.size - a[1].people.size || b[1].sourceLinks - a[1].sourceLinks || a[0].localeCompare(b[0]));
  const visible = ranked.slice(0, 8);
  if (voiceState.issue !== "all" && !visible.some(([issue]) => issue === voiceState.issue)) {
    const active = ranked.find(([issue]) => issue === voiceState.issue);
    if (active) visible.push(active);
  }
  voiceIssueSpotlight.innerHTML = visible.map(([issue, stats]) => `
    <button type="button" class="voice-issue-chip${voiceState.issue === issue ? " is-active" : ""}" data-voice-issue="${esc(issue)}" aria-pressed="${voiceState.issue === issue}">
      <span>${esc(issue)}</span><strong>${stats.people.size}</strong>
    </button>
  `).join("");
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
  if (voiceState.sort === "name") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (voiceState.sort === "spoke") {
    filtered.sort((a, b) => b.stances.filter((stance) => stance.position === "spoke-out").length - a.stances.filter((stance) => stance.position === "spoke-out").length || a.name.localeCompare(b.name));
  } else if (voiceState.sort === "unfound") {
    filtered.sort((a, b) => b.stances.filter((stance) => stance.position === "silent").length - a.stances.filter((stance) => stance.position === "silent").length || a.name.localeCompare(b.name));
  }
  renderVoiceIssueSpotlight();

  // Summary stats
  const totalPeople = voices.length;
  const spokeOutCount = voices.filter((v) => v.stances.some((s) => s.position === "spoke-out")).length;
  const silentCount = voices.filter((v) => v.stances.every((s) => s.position === "silent")).length;
  const proGovtCount = voices.filter((v) => v.stances.some((s) => s.position === "supported-govt") && !v.stances.some((s) => s.position === "spoke-out")).length;

  if (voicesSummary) {
    voicesSummary.innerHTML = `
      <div class="voice-stat"><strong>${totalPeople}</strong><span>figures tracked</span></div>
      <div class="voice-stat spoke-out"><strong>${spokeOutCount}</strong><span>spoke out on \u2265 1 issue</span></div>
      <div class="voice-stat silent"><strong>${silentCount}</strong><span>no statement found on all issues</span></div>
      <div class="voice-stat supported-govt"><strong>${proGovtCount}</strong><span>supported govt (never spoke out)</span></div>
    `;
  }

  if (voicesMeta) {
    const activeFilterCount = [voiceState.query, voiceState.field !== "all" ? voiceState.field : "", voiceState.stance !== "all" ? voiceState.stance : "", voiceState.issue !== "all" ? voiceState.issue : "", voiceState.sort !== "editorial" ? voiceState.sort : ""].filter(Boolean).length;
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
      silentCnt ? `<span class="tally-label silent">${silentCnt} no statement</span>` : "",
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
          ${ratioSeg(spokeCount, "spoke-out", "Spoke out")}${ratioSeg(govtCnt, "supported-govt", "Supported govt")}${ratioSeg(otherCnt, "ambiguous", "Ambiguous")}${ratioSeg(silentCnt, "silent", "No statement found")}
        </div>
        <div class="voice-tally">${tallyLine}</div>
        <div class="voice-stances">
          ${stancesHtml}
        </div>
      </article>
    `;
  }).join("");
}

