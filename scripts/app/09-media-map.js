function mediaSourceLinks(ids = []) { return ids.map((id) => sources[id]?.url ? `<a href="${esc(sources[id].url)}" target="_blank" rel="noopener noreferrer">${esc(sources[id].publisher || "Source")}</a>` : "").filter(Boolean).join(" · "); }
function mediaEvidenceLinks(ids = []) {
  return ids.map((id) => {
    const source = sources[id];
    if (!source?.url) return "";
    return `<a class="media-evidence-link" href="${esc(source.url)}" target="_blank" rel="noopener noreferrer"><strong>${esc(source.title || source.publisher || "Source")}</strong><span>${esc([source.publisher, source.type].filter(Boolean).join(" · "))}</span></a>`;
  }).filter(Boolean).join("");
}
function mediaOwnershipChain(group, outlet) {
  if (!group) return "";
  const rawSteps = [
    outlet ? { role: "Outlet", name: outlet.name } : null,
    { role: "Operating company", name: group.ownership?.operatingCompany || group.name },
    { role: "Parent or control entity", name: group.ownership?.parentCompany },
    { role: "Ultimate owner or beneficiary", name: group.ownership?.ultimateParent }
  ].filter((item) => item?.name);
  const steps = rawSteps.filter((item, index) => !index || item.name.trim().toLowerCase() !== rawSteps[index - 1].name.trim().toLowerCase());
  return `<section class="media-ownership-visual" aria-labelledby="ownership-path-heading"><div class="media-visual-heading"><h4 id="ownership-path-heading">Ownership path</h4><span>Follow the documented control relationship</span></div><div class="media-ownership-chain">${steps.map((item) => `<div class="media-ownership-node"><span>${esc(item.role)}</span><strong>${esc(item.name)}</strong></div>`).join("")}</div></section>`;
}
function mediaStakeVisual(stake, fallbackPercentage) {
  if (!stake) return fallbackPercentage ? `<p><strong>Disclosed stake:</strong> ${esc(fallbackPercentage)}</p>` : "";
  const statusLabels = {
    "verified-current": "Current verified disclosure",
    historical: "Historical disclosure — current split not independently verified",
    "not-disclosed": "Not publicly disclosed",
    "no-single-owner": "No single controlling owner disclosed",
    unknown: "Unknown"
  };
  const segments = stake.segments || [];
  const bar = segments.length ? `<div class="media-stake-bar" role="img" aria-label="${esc(`Stake breakdown: ${segments.map((item) => `${item.label} ${item.displayValue}`).join(", ")}`)}">${segments.map((item) => `<span class="media-stake-segment media-stake-${esc(item.kind || "known")}" style="width:${Number(item.percentage)}%" title="${esc(`${item.label}: ${item.displayValue}`)}"></span>`).join("")}</div><div class="media-stake-legend">${segments.map((item) => `<div><span class="media-stake-key media-stake-${esc(item.kind || "known")}"></span><span>${esc(item.label)}</span><strong>${esc(item.displayValue)}</strong></div>`).join("")}</div>` : `<div class="media-stake-unavailable"><strong>${esc(statusLabels[stake.status] || "Unknown")}</strong><span>A proportional chart is not shown because a verified numerical split is unavailable.</span></div>`;
  return `<div class="media-stake"><p class="media-stake-disclosure"><strong>Disclosed stake:</strong> ${esc(stake.label || fallbackPercentage || "Unknown")}</p><p class="media-stake-status"><span>${esc(statusLabels[stake.status] || "Unknown")}</span>${stake.asOf ? ` As of ${esc(stake.asOf)}.` : ""}</p>${bar}<div class="media-stake-evidence"><strong>Exact source${stake.sourceIds?.length === 1 ? "" : "s"}</strong>${mediaEvidenceLinks(stake.sourceIds)}</div></div>`;
}
function mediaProfile(route) { return route.kind === "groups" ? mediaGroups.find((item) => item.id === route.id) : mediaOutlets.find((item) => item.id === route.id); }
function mediaOutletCards(outlets = []) {
  return outlets.map((item) => `<a class="media-outlet-card" href="/media-map/outlets/${esc(item.id)}" data-link><strong>${esc(item.name)}</strong><span>${esc(item.type || "Media outlet")}${item.languages?.length ? ` · ${esc(item.languages.join(", "))}` : ""}</span></a>`).join("");
}
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
  document.body.classList.toggle("media-outlet-profile-route", route.kind === "outlets" && Boolean(profile));
  if (profile) {
    const outlets = route.kind === "groups" ? mediaOutlets.filter((item) => item.groupId === profile.id) : [profile];
    const associatedPeople = mediaPeople.filter((item) => (item.groupIds || []).includes(group?.id));
    const associatedIds = new Set([group?.id, ...associatedPeople.map((item) => item.id)]);
    const connections = mediaConnections.filter((item) => associatedIds.has(item.subjectId));
    const people = (group?.controllerIds || []).map((id) => mediaPeople.find((item) => item.id === id)).filter(Boolean);
    const outletSection = route.kind === "groups" ? `<section class="media-profile-outlets"><h4>Outlets owned or operated by this group</h4><div class="media-outlet-grid">${mediaOutletCards(outlets)}</div></section>` : "";
    mediaMapGrid.innerHTML = `<article class="media-profile"><p class="eyebrow">${esc(route.kind === "groups" ? "Ownership group" : profile.type || "Media outlet")}</p><h3>${esc(profile.name)}</h3>${route.kind === "groups" ? `<p class="media-profile-count"><strong>${outlets.length} outlet${outlets.length === 1 ? "" : "s"} tracked</strong></p>` : `<p>Part of the ownership group <a href="/media-map/groups/${esc(group?.id || "")}" data-link>${esc(group?.name || "not yet listed")}</a>.</p>`}${mediaOwnershipChain(group, route.kind === "outlets" ? profile : null)}${outletSection}<div class="media-detail-grid"><section class="media-current-ownership"><h4>Current ownership</h4><p>${esc(group?.ownership?.summary || "No verified ownership summary has been published.")}</p>${mediaStakeVisual(group?.stake, group?.ownership?.percentage)}</section><section><h4>Controlling people</h4><p>${people.length ? people.map((item) => esc(item.name)).join(", ") : "No individual controller is listed."}</p></section><section><h4>Material business interests</h4><p>${(group?.businessInterests || []).map((item) => esc(item)).join(" · ") || "No material interests listed."}</p></section><section><h4>Last verified</h4><p>${esc(group?.lastVerified || "Not published")}</p></section></div>${(group?.ownershipHistory || []).length ? `<section><h4>Ownership changes</h4>${group.ownershipHistory.map((item) => `<details><summary>${esc(item.date)} · ${esc(item.title)}</summary><p>${esc(item.summary)}</p>${mediaSourceLinks(item.sourceIds)}</details>`).join("")}</section>` : ""}${connections.length ? `<section><h4>Documented political connections</h4>${connections.map((item) => { const subject = mediaPeople.find((person) => person.id === item.subjectId); const connectionLabel = item.connectionType.replace(/-/g, " "); return `<details><summary>${subject ? `${esc(subject.name)} · ` : ""}${esc(connectionLabel)}${item.party ? ` · ${esc(item.party)}` : ""}</summary><p>${esc(item.description)}</p><p>Documented from ${esc(item.startDate || "date not specified")}${item.endDate ? ` to ${esc(item.endDate)}` : ""}</p>${mediaSourceLinks(item.sourceIds)}</details>`; }).join("")}</section>` : ""}<p class="media-sources">${mediaSourceLinks([...(group?.sourceIds || []), ...(profile === group ? [] : profile.sourceIds || [])])}</p></article>`;
    return;
  }
  const query = mediaMapState.query;
  const outlets = mediaOutlets.filter((outlet) => {
    const owner = mediaGroups.find((item) => item.id === outlet.groupId);
    const text = `${outlet.name} ${outlet.type || ""} ${(outlet.languages || []).join(" ")} ${owner?.name || ""} ${owner?.ownership?.operatingCompany || ""} ${owner?.ownership?.parentCompany || ""} ${owner?.ownership?.ultimateParent || ""}`.toLowerCase();
    return (!query || text.includes(query)) && (mediaMapState.type === "all" || outlet.type === mediaMapState.type) && (mediaMapState.language === "all" || (outlet.languages || []).includes(mediaMapState.language));
  }).sort((a, b) => a.name.localeCompare(b.name));
  mediaMapSummary.textContent = `${outlets.length} of ${mediaOutlets.length} verified outlets shown`;
  mediaMapGrid.innerHTML = outlets.length ? outlets.map((outlet) => {
    const owner = mediaGroups.find((item) => item.id === outlet.groupId);
    return `<article class="media-card media-directory-outlet"><p class="eyebrow">${esc(outlet.type || "Media outlet")}${outlet.languages?.length ? ` · ${esc(outlet.languages.join(", "))}` : ""}</p><h3><a href="/media-map/outlets/${esc(outlet.id)}" data-link>${esc(outlet.name)}</a></h3><p class="media-outlet-owner"><span>Ownership group</span><a href="/media-map/groups/${esc(owner?.id || "")}" data-link>${esc(owner?.name || "Not yet listed")}</a></p><p>${esc(owner?.ownership?.summary || "Verified ownership information is not yet available.")}</p><p class="media-card-meta">Ownership last verified ${esc(owner?.lastVerified || "date unavailable")}</p></article>`;
  }).join("") : `<div class="empty-state"><strong>No verified outlets match</strong><p>Try a broader search or clear the filters.</p></div>`;
}
function bindMediaMapEvents() {
  mediaMapSearch?.addEventListener("input", (event) => { mediaMapState.query = event.target.value.trim().toLowerCase(); renderMediaMap(); });
  mediaMapTypeFilter?.addEventListener("change", (event) => { mediaMapState.type = event.target.value; renderMediaMap(); });
  mediaMapLanguageFilter?.addEventListener("change", (event) => { mediaMapState.language = event.target.value; renderMediaMap(); });
  clearMediaMapFiltersButton?.addEventListener("click", () => { mediaMapState.query = ""; mediaMapState.type = "all"; mediaMapState.language = "all"; if (mediaMapSearch) mediaMapSearch.value = ""; if (mediaMapTypeFilter) mediaMapTypeFilter.value = "all"; if (mediaMapLanguageFilter) mediaMapLanguageFilter.value = "all"; renderMediaMap(); });
}
