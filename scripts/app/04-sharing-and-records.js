const SITE_URL = "https://letsfixindia.com";
const SITE_SHARE_TEXT = "LetsFixIndia — a sourced public record of India 2014-2026. Every entry has evidence attached.";

const SHARE_ICONS = {
  wa: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>`,
  x: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>`,
  fb: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  ig: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>`,
  li: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.447-2.136 2.943v5.663H9.351V9h3.414v1.561h.049c.476-.9 1.637-1.852 3.368-1.852 3.6 0 4.266 2.37 4.266 5.455v6.288zM5.337 7.433a2.063 2.063 0 1 1 0-4.126 2.063 2.063 0 0 1 0 4.126zM7.114 20.452H3.558V9h3.556v11.452z"/></svg>`,
  tg: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.78 15.37 9.4 20.7c.55 0 .79-.24 1.08-.52l2.59-2.48 5.37 3.93c.98.54 1.67.26 1.94-.91l3.52-16.5c.31-1.45-.52-2.02-1.48-1.66L1.75 10.5c-1.41.55-1.39 1.34-.24 1.7l5.32 1.66L19.18 6.1c.58-.38 1.11-.17.67.21L9.78 15.37z"/></svg>`,
  native: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11A2.99 2.99 0 1 0 15 5c0 .24.04.47.09.7L8.04 9.81A3 3 0 1 0 8.04 14.2l7.12 4.18c-.05.21-.08.43-.08.65a2.92 2.92 0 1 0 2.92-2.95z"/></svg>`,
  copy: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`
};

function shareBarHtml(url, text) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  return `
    <span class="share-label">Share</span>
    <a class="share-btn share-wa" href="https://wa.me/?text=${t}%20${u}" target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp">${SHARE_ICONS.wa}<span>WhatsApp</span></a>
    <a class="share-btn share-x" href="https://twitter.com/intent/tweet?text=${t}&url=${u}" target="_blank" rel="noopener noreferrer" aria-label="Share on X">${SHARE_ICONS.x}<span>X</span></a>
    <a class="share-btn share-fb" href="https://www.facebook.com/sharer/sharer.php?u=${u}" target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook">${SHARE_ICONS.fb}<span>Facebook</span></a>
    <a class="share-btn share-li" href="https://www.linkedin.com/sharing/share-offsite/?url=${u}" target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn">${SHARE_ICONS.li}<span>LinkedIn</span></a>
    <a class="share-btn share-tg" href="https://t.me/share/url?url=${u}&text=${t}" target="_blank" rel="noopener noreferrer" aria-label="Share on Telegram">${SHARE_ICONS.tg}<span>Telegram</span></a>
    <a class="share-btn share-ig" href="https://www.instagram.com/letsfixindia" target="_blank" rel="noopener noreferrer" aria-label="LetsFixIndia on Instagram">${SHARE_ICONS.ig}<span>Instagram</span></a>
    <button type="button" class="share-btn share-native" data-native-share-url="${esc(url)}" data-native-share-text="${esc(text)}" aria-label="Open native share">${SHARE_ICONS.native}<span>Share</span></button>
    <button type="button" class="share-btn share-copy" data-share-url="${esc(url)}" aria-label="Copy link">${SHARE_ICONS.copy}<span>Copy link</span></button>
    <span class="share-status" data-share-status aria-live="polite"></span>
  `;
}

function renderShareBars() {
  document.querySelectorAll(".share-bar[data-share-context='site']").forEach((bar) => {
    bar.innerHTML = shareBarHtml(SITE_URL, SITE_SHARE_TEXT);
  });
  updateSoundButtons();
}

document.addEventListener("click", async (event) => {
  const nativeShare = closestFromEvent(event, "button[data-native-share-url]");
  if (nativeShare) {
    triggerTapFeedback(nativeShare, event);
    const url = nativeShare.dataset.nativeShareUrl || SITE_URL;
    const text = nativeShare.dataset.nativeShareText || SITE_SHARE_TEXT;
    const label = nativeShare.querySelector("span");
    const defaultLabel = label?.textContent || "Share";
    try {
      if (navigator.share) {
        await navigator.share({ title: "LetsFixIndia", text, url });
        setShareStatus(nativeShare, "Shared");
        playUiSound("success");
        return;
      }
    } catch {
      return;
    }
    if (await copyTextToClipboard(url)) {
      nativeShare.classList.add("is-copied");
      if (label) label.textContent = "Copied";
      nativeShare.setAttribute("aria-label", "Link copied");
      setShareStatus(nativeShare, "Link copied");
      playUiSound("success");
      setTimeout(() => {
        nativeShare.classList.remove("is-copied");
        if (label) label.textContent = defaultLabel;
        nativeShare.setAttribute("aria-label", "Open native share");
      }, 1800);
    }
    return;
  }

  const button = closestFromEvent(event, "button[data-share-url]");
  if (!button) return;
  triggerTapFeedback(button, event);
  const label = button.querySelector("span");
  const defaultLabel = label?.textContent || "Copy link";
  if (await copyTextToClipboard(button.dataset.shareUrl)) {
    button.classList.add("is-copied");
    button.setAttribute("aria-label", "Link copied");
    if (label) label.textContent = "Copied";
    setShareStatus(button, "Link copied");
    setTimeout(() => {
      button.classList.remove("is-copied");
      button.setAttribute("aria-label", defaultLabel);
      if (label) label.textContent = defaultLabel;
    }, 1600);
  } else {
    button.title = "Copy failed";
    button.setAttribute("aria-label", "Copy failed");
    if (label) label.textContent = "Copy failed";
    setShareStatus(button, "Copy failed");
    setTimeout(() => {
      button.setAttribute("aria-label", defaultLabel);
      if (label) label.textContent = defaultLabel;
    }, 1800);
  }
});

document.addEventListener("click", async (event) => {
  const button = closestFromEvent(event, "button[data-copy-text]");
  if (!button || button.disabled) return;
  triggerTapFeedback(button, event);
  const label = button.querySelector("[data-copy-label]");
  const defaultLabel = button.dataset.defaultLabel || label?.textContent || "Copy";
  const successLabel = button.dataset.successLabel || "Copied";
  const errorLabel = button.dataset.errorLabel || "Copy failed";
  if (await copyTextToClipboard(button.dataset.copyText || "")) {
    button.classList.add("is-copied");
    if (label) label.textContent = successLabel;
    button.setAttribute("aria-label", successLabel);
    setTimeout(() => {
      button.classList.remove("is-copied");
      if (label) label.textContent = defaultLabel;
      button.setAttribute("aria-label", button.title || defaultLabel);
    }, 1600);
  } else {
    if (label) label.textContent = errorLabel;
    button.setAttribute("aria-label", errorLabel);
    setTimeout(() => {
      if (label) label.textContent = defaultLabel;
      button.setAttribute("aria-label", button.title || defaultLabel);
    }, 1800);
  }
});

document.addEventListener("click", (event) => {
  const toggle = closestFromEvent(event, "button[data-sound-toggle]");
  if (toggle) {
    const next = !soundEnabled;
    setSoundEnabled(next);
    triggerTapFeedback(toggle, event);
    setShareStatus(toggle, next ? "Sound on" : "Sound off");
    playUiSound(next ? "success" : "tap", true);
    return;
  }
  const control = closestFromEvent(event, "a, button, summary");
  if (!control || control.disabled) return;
  triggerTapFeedback(control, event);
  playUiSound(control.hasAttribute("data-link") ? "nav" : "tap");
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
  if (indicatorTopicFilter) indicatorTopicFilter.value = "all";
  if (indicatorToneFilter) indicatorToneFilter.value = "all";
  if (indicatorSortFilter) indicatorSortFilter.value = "editorial";
  window.LetsFixIndiaStatistics?.resetPage();
  renderIndicators();
}

function clearSourceFilters() {
  if (sourceSearchInput) sourceSearchInput.value = "";
  if (sourceStatusFilter) sourceStatusFilter.value = "all";
  sourceState.query = "";
  sourceState.status = "all";
  renderSources();
}

