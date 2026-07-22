function mediaSourceLinks(ids = []) { return ids.map((id) => sources[id]?.url ? `<a href="${esc(sources[id].url)}" target="_blank" rel="noopener noreferrer">${esc(sources[id].publisher || "Source")}</a>` : "").filter(Boolean).join(" · "); }
function mediaProfile(route) { return route.kind === "groups" ? mediaGroups.find((item) => item.id === route.id) : mediaOutlets.find((item) => item.id === route.id); }
function populateMediaFilters() {
  const types = new Set(mediaOutlets.map((item) => item.type).filter(Boolean));
  const languages = new Set(mediaOutlets.flatMap((item) => item.languages || []));
  if (mediaMapTypeFilter) mediaMapTypeFilter.innerHTML = `<option value="all">All media types</option>${[...types].sort().map((item) => `<option>${esc(item)}</option>`).join("")}`;
  if (mediaMapLanguageFilter) mediaMapLanguageFilter.innerHTML = `<option value="all">All languages</option>${[...languages].sort().map((item) => `<option>${esc(item)}</option>`).join("")}`;
}
function renderMediaMap() {
  if (!mediaMapGrid) return;
  const route = resolveRoute(); const profile = route.kind ? mediaProfile(route) : null;
  const group = route.kind === "outlets" ? mediaGroups.find((item) => item.id === profile?.groupId) : profile;
  document.body.classList.toggle("media-profile-route", Boolean(profile));
  if (profile) {
    const outlets = route.kind === "groups" ? mediaOutlets.filter((item) => item.groupId === profile.id) : [profile];
    const connections = mediaConnections.filter((item) => item.subjectId === (route.kind === "groups" ? profile.id : group?.id));
    const people = (group?.controllerIds || []).map((id) => mediaPeople.find((item) => item.id === id)).filter(Boolean);
    mediaMapGrid.innerHTML = `<article class="media-profile"><p class="eyebrow">${esc(route.kind === "groups" ? "Media group" : profile.type || "Media outlet")}</p><h3>${esc(profile.name)}</h3>${route.kind === "outlets" ? `<p>Part of <a href="/media-map/groups/${esc(group?.id || "")}" data-link>${esc(group?.name || "an unlisted group")}</a>.</p>` : ""}<div class="media-detail-grid"><section><h4>Current ownership</h4><p>${esc(group?.ownership?.summary || "No verified ownership summary has been published.")}</p>${group?.ownership?.percentage ? `<p><strong>Disclosed stake:</strong> ${esc(group.ownership.percentage)}</p>` : ""}</section><section><h4>Controlling people</h4><p>${people.length ? people.map((item) => esc(item.name)).join(", ") : "No individual controller is listed."}</p></section><section><h4>Material business interests</h4><p>${(group?.businessInterests || []).map((item) => esc(item)).join(" · ") || "No material interests listed."}</p></section><section><h4>Last verified</h4><p>${esc(group?.lastVerified || "Not published")}</p></section></div>${outlets.length ? `<section><h4>Related outlets</h4><ul class="media-links">${outlets.map((item) => `<li><a href="/media-map/outlets/${esc(item.id)}" data-link>${esc(item.name)}</a> <span>${esc(item.type || "")}</span></li>`).join("")}</ul></section>` : ""}${(group?.ownershipHistory || []).length ? `<section><h4>Ownership changes</h4>${group.ownershipHistory.map((item) => `<details><summary>${esc(item.date)} · ${esc(item.title)}</summary><p>${esc(item.summary)}</p>${mediaSourceLinks(item.sourceIds)}</details>`).join("")}</section>` : ""}${connections.length ? `<section><h4>Documented political connections</h4>${connections.map((item) => `<details><summary>${esc(item.connectionType)}${item.party ? ` · ${esc(item.party)}` : ""}</summary><p>${esc(item.description)}</p><p>${esc(item.startDate || "Date not specified")}${item.endDate ? ` – ${esc(item.endDate)}` : ""}</p>${mediaSourceLinks(item.sourceIds)}</details>`).join("")}</section>` : ""}<p class="media-sources">${mediaSourceLinks(profile.sourceIds || group?.sourceIds)}</p></article>`;
    return;
  }
  const query = mediaMapState.query;
  const groups = mediaGroups.filter((groupItem) => { const outlets = mediaOutlets.filter((outlet) => outlet.groupId === groupItem.id); const text = `${groupItem.name} ${groupItem.ownership?.summary || ""} ${outlets.map((item) => `${item.name} ${item.type} ${(item.languages || []).join(" ")}`).join(" ")}`.toLowerCase(); return (!query || text.includes(query)) && (mediaMapState.type === "all" || outlets.some((item) => item.type === mediaMapState.type)) && (mediaMapState.language === "all" || outlets.some((item) => (item.languages || []).includes(mediaMapState.language))); });
  mediaMapSummary.textContent = `${groups.length} of ${mediaGroups.length} verified media groups shown`;
  mediaMapGrid.innerHTML = groups.length ? groups.map((item) => { const outlets = mediaOutlets.filter((outlet) => outlet.groupId === item.id); return `<article class="media-card"><p class="eyebrow">${outlets.length} tracked outlet${outlets.length === 1 ? "" : "s"}</p><h3><a href="/media-map/groups/${esc(item.id)}" data-link>${esc(item.name)}</a></h3><p>${esc(item.ownership?.summary || "Verified ownership details available in the profile.")}</p><p class="media-card-meta">${esc(item.lastVerified || "No verification date")}</p><div>${outlets.slice(0, 5).map((outlet) => `<a class="media-outlet-chip" href="/media-map/outlets/${esc(outlet.id)}" data-link>${esc(outlet.name)}</a>`).join("")}</div></article>`; }).join("") : `<div class="empty-state"><strong>No verified groups match</strong><p>Try a broader search or clear the filters.</p></div>`;
}
function bindMediaMapEvents() {
  mediaMapSearch?.addEventListener("input", (event) => { mediaMapState.query = event.target.value.trim().toLowerCase(); renderMediaMap(); });
  mediaMapTypeFilter?.addEventListener("change", (event) => { mediaMapState.type = event.target.value; renderMediaMap(); });
  mediaMapLanguageFilter?.addEventListener("change", (event) => { mediaMapState.language = event.target.value; renderMediaMap(); });
  clearMediaMapFiltersButton?.addEventListener("click", () => { mediaMapState.query = ""; mediaMapState.type = "all"; mediaMapState.language = "all"; if (mediaMapSearch) mediaMapSearch.value = ""; if (mediaMapTypeFilter) mediaMapTypeFilter.value = "all"; if (mediaMapLanguageFilter) mediaMapLanguageFilter.value = "all"; renderMediaMap(); });
}
