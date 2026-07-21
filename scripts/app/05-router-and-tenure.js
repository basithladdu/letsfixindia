function updatePageMeta(route) {
  let title = defaultTitle;
  let description = defaultDescriptionText;
  if (route.page === "voices") {
    title = "Public Voices | LetsFixIndia";
    description = "Documented public statements, silence, and institutional responses to major Modi-era controversies.";
  } else if (route.page === "gallery") {
    title = route.gallerySubmit ? "Submit Protest Media | LetsFixIndia" : "Public Evidence Gallery | LetsFixIndia";
    description = route.gallerySubmit
      ? "Submit original protest photos or video with the date, location, and visible context required for editorial review."
      : "Reviewed photos and video documenting protests, excessive force, lathi charges, tear gas, detentions, injuries, and other public events.";
  } else if (route.page === "sources") {
    title = "Source Ledger | LetsFixIndia";
    description = "Search the public source ledger and inspect linked, pending, and placeholder evidence records.";
  } else if (route.page === "faq") {
    title = "FAQ | LetsFixIndia";
    description = "How LetsFixIndia classifies evidence, handles corrections, and separates public records from unresolved leads.";
  } else if (route.page === "record") {
    const event = events.find((item) => item.id === route.id);
    if (event) {
      title = `${event.title} | LetsFixIndia`;
      description = event.summary;
    } else {
      title = "Record not found | LetsFixIndia";
      description = "The requested record is not present in the current LetsFixIndia data files.";
    }
  } else if (route.page === "statistics") {
    title = "Statistics | LetsFixIndia";
    description = "Source-backed indicators showing where India improved, worsened, or remained broadly flat during the period.";
  } else if (route.page === "map") {
    title = "State Map | LetsFixIndia";
    description = "Explore explicitly state-tagged public records across all 36 Indian states and union territories.";
  } else if (route.page === "contact") {
    title = "Contact | LetsFixIndia";
    description = "Contact Basith and Devit directly for corrections, collaboration, or software development work.";
  } else if (route.page === "methodology") {
    title = "Methodology | LetsFixIndia";
    description = "How LetsFixIndia separates documented events, allegations, outcomes, and evidence caveats.";
  } else if (route.page === "submit") {
    title = "Submit a record | LetsFixIndia";
    description = "Propose a sourced public-record entry. Drafts stay local in your browser until an editor reviews them.";
  } else if (route.page === "support") {
    title = "Support | LetsFixIndia";
    description = "Share the record, contribute sourced corrections, or chip in for hosting. Donations buy uptime, not opinions.";
  } else if (route.page === "partner") {
    title = "Partner with LetsFixIndia";
    description = "Partner with LetsFixIndia on source verification, public-interest media, research, accessibility, or focused technical improvements.";
  } else if (route.page === "donors") {
    title = "Donors and Funding Transparency | LetsFixIndia";
    description = "How LetsFixIndia is funded, who currently supports it, and the rules that keep contributions separate from editorial decisions.";
  } else if (route.page === "about") {
    title = "About | LetsFixIndia";
    description = "Who maintains LetsFixIndia, how to support sourced corrections, and where the public repository lives.";
  } else if (route.page === "not-found") {
    title = "Page not found | LetsFixIndia";
    description = "This address is not part of the current LetsFixIndia site.";
  } else if (route.page === "timeline") {
    title = defaultTitle;
    description = defaultDescriptionText;
  }
  document.title = title;
  if (defaultDescription) defaultDescription.content = description;
  document.querySelector('meta[property="og:title"]')?.setAttribute("content", title);
  document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
  document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", title);
  document.querySelector('meta[name="twitter:description"]')?.setAttribute("content", description);

  const canonicalPaths = {
    timeline: "/",
    gallery: route.gallerySubmit ? "/gallery/submit" : "/gallery",
    map: "/map",
    statistics: "/statistics",
    voices: "/voices",
    sources: "/sources",
    submit: "/submit",
    contact: "/contact",
    methodology: "/methodology",
    faq: "/faq",
    support: "/support",
    partner: "/partner",
    donors: "/donors",
    about: "/about",
  };
  const canonicalPath = route.page === "record" ? `/record/${encodeURIComponent(route.id || "")}` : canonicalPaths[route.page] || window.location.pathname;
  const canonicalUrl = new URL(canonicalPath, "https://letsfixindia.com").href;
  document.querySelector('link[rel="canonical"]')?.setAttribute("href", canonicalUrl);
  document.querySelector('meta[property="og:url"]')?.setAttribute("content", canonicalUrl);
  const shouldIndex = route.page !== "not-found" && !route.gallerySubmit;
  document.querySelector('meta[name="robots"]')?.setAttribute(
    "content",
    shouldIndex ? "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" : "noindex,follow"
  );
}

function routeFromPath(pathname) {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path.startsWith("/record/")) {
    return { page: "record", id: decodeURIComponent(path.slice("/record/".length)) };
  }
  if (path === "/" || path === "/timeline" || path === "/landing") return { page: "timeline" };
  if (path === "/gallery/submit") return { page: "gallery", gallerySubmit: true };
  if (path === "/gallery") return { page: "gallery", gallerySubmit: false };
  if (path === "/map" || path === "/states") return { page: "map" };
  if (path === "/statistics" || path === "/indicators") return { page: "statistics" };
  if (path === "/voices") return { page: "voices" };
  if (path === "/sources") return { page: "sources" };
  if (path === "/submit" || path === "/submissions") return { page: "submit" };
  if (path === "/contact") return { page: "contact" };
  if (path === "/methodology") return { page: "methodology" };
  if (path === "/faq") return { page: "faq" };
  if (path === "/support") return { page: "support" };
  if (path === "/partner") return { page: "partner" };
  if (path === "/donors") return { page: "donors" };
  if (path === "/about") return { page: "about" };
  return { page: "not-found" };
}

function resolveRoute() {
  return routeFromPath(window.location.pathname);
}

function revealSubmissionForm(focusSelector) {
  const form = document.getElementById("submissionForm");
  if (!form) return;
  document.getElementById("submitModeSelector")?.classList.add("is-compact");
  document.querySelector(".submit-rules")?.classList.add("is-compact");
  form.style.display = "grid";
  requestAnimationFrame(() => {
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const topbar = document.querySelector(".topbar");
    const topOffset = (topbar?.getBoundingClientRect().height || 0) + 12;
    const targetTop = Math.max(0, form.getBoundingClientRect().top + window.scrollY - topOffset);
    window.scrollTo({
      top: targetTop,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
    const focusTarget = form.querySelector(focusSelector || "input:not([type='hidden']), textarea, select");
    window.setTimeout(() => {
      focusTarget?.focus({ preventScroll: true });
    }, prefersReducedMotion ? 0 : 220);
  });
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

function ensureRouteContent(route) {
  if (route.page === "record") {
    renderRecord(route.id);
    return;
  }
    if (renderedPages.has(route.page)) {
      if (route.page === "gallery") {
        window.LetsFixIndiaGallery?.refresh();
        requestAnimationFrame(() => route.gallerySubmit
          ? window.LetsFixIndiaGallery?.openUpload()
          : window.LetsFixIndiaGallery?.closeUpload());
      }
      return;
    }

  if (route.page === "timeline") renderTimeline();
  if (route.page === "map") prepareStateExplorer();
  if (route.page === "statistics") renderIndicators();
  if (route.page === "voices") renderVoices();
  if (route.page === "gallery") window.LetsFixIndiaGallery?.renderRoute();
  if (route.page === "sources") renderSources();
  if (route.page === "submit") renderSubmissions();


  renderedPages.add(route.page);
  if (route.page === "gallery" && route.gallerySubmit) {
    requestAnimationFrame(() => window.LetsFixIndiaGallery?.openUpload());
  }
}

function renderRoute(options = {}) {
  const route = resolveRoute();
  updatePageMeta(route);
  ensureRouteContent(route);
  routePages.forEach((section) => section.classList.toggle("is-active", section.dataset.page === route.page));
  if (route.page === "map") {
    requestAnimationFrame(() => {
      initStateMap();
      stateMapInstance?.resize();
    });
  }
  triggerRouteMotion(route.page);
  setActiveNav(route.page);
  const hasHashTarget = Boolean(hashTargetFor());
  const shouldRestoreTimeline = route.page === "timeline" && !hasHashTarget && (options.restoreTimeline || history.state?.restoreTimeline);
  
  if (route.page === "submit") {
    renderEventDropdownList(events);
    
    // Check URL parameters for suggesting a correction to a specific event
    const params = new URLSearchParams(window.location.search);
    const correctId = params.get("correct");
    const modeSelector = document.getElementById("submitModeSelector");
    const form = document.getElementById("submissionForm");
    
    if (correctId) {
      setTimeout(() => {
        const btnCorrection = document.querySelector('.mode-btn[data-mode="correction"]');
        if (btnCorrection) {
          btnCorrection.classList.add("active");
        }
        const radioCorrection = document.querySelector('input[name="submissionType"][value="correction"]');
        if (radioCorrection) {
          radioCorrection.checked = true;
          radioCorrection.dispatchEvent(new Event("change", { bubbles: true }));
        }
        
        const matched = events.find(ev => ev.id === correctId);
        if (matched) {
          const searchInput = document.getElementById("eventSearchInput");
          const hiddenInput = document.getElementById("eventSelectHidden");
          if (searchInput) searchInput.value = matched.title;
          if (hiddenInput) hiddenInput.value = matched.id;
        }
        
        revealSubmissionForm("textarea[name='summary']");
      }, 50);
    } else {
      if (form) form.style.display = "none";
      if (modeSelector) {
        modeSelector.classList.remove("is-compact");
        modeSelector.querySelectorAll(".mode-btn").forEach(b => {
          b.classList.remove("active");
        });
      }
      document.querySelector(".submit-rules")?.classList.remove("is-compact");
    }
  }

  if (route.page === "statistics") {
    startLiveTrackers();
  } else {
    if (trackersInterval) {
      clearInterval(trackersInterval);
      trackersInterval = null;
    }
  }
  
  requestAnimationFrame(() => {
    if (shouldRestoreTimeline) {
      restoreTimelineScroll("auto");
    } else if (hasHashTarget) {
      scrollToHashTarget(window.location.hash, "auto");
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
    updateScrollDock();
    updateMobileScrollProgress();
    updateScrollProgress();
    requestAnimationFrame(() => {
      updateScrollDock();
      updateMobileScrollProgress();
      updateScrollProgress();
    });
  });
  window.setTimeout(() => {
    updateScrollDock();
    updateMobileScrollProgress();
    updateScrollProgress();
  }, 140);
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

function renderEventDropdownList(filteredEvents) {
  const list = document.getElementById("eventDropdownList");
  if (!list || !events) return;
  
  const sorted = [...filteredEvents].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return String(a.title).localeCompare(String(b.title));
  });
  
  if (sorted.length === 0) {
    list.innerHTML = `<li style="padding: 10px 14px; color: var(--muted); font-size: 13px;">No matching events found</li>`;
    return;
  }
  
  list.innerHTML = sorted.map(ev => `
    <li class="combobox-item" data-id="${ev.id}" data-title="${esc(ev.title)}" style="padding: 10px 14px; cursor: pointer; font-size: 13px; display: flex; flex-direction: column; gap: 4px; border-bottom: 1px solid rgba(0,0,0,0.03); transition: background 0.15s;">
      <span style="font-size: 10px; font-weight: 700; color: var(--muted); text-transform: uppercase;">${ev.year} | ${esc(ev.category)}</span>
      <strong style="color: var(--ink); font-weight: 500; line-height: 1.3;">${esc(ev.title)}</strong>
    </li>
  `).join('');
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
  if (tenureValue) {
    tenureValue.textContent = fmtYMD(modiYMD);
  }
  const tenureSubtitle = document.getElementById("tenureSubtitle");
  if (tenureSubtitle) {
    tenureSubtitle.textContent = `From 26 May 2014 to ${fmt.format(now)}`;
  }
  const footerDate = document.getElementById("footerDate");
  if (footerDate) {
    footerDate.textContent = `Updated ${fmt.format(now)}`;
  }
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
  const bjpTotalValue = document.getElementById("bjpTotalValue");
  if (bjpTotalValue) {
    bjpTotalValue.textContent = fmtYMD(bjpYMD);
  }
  const bjpTotalSubtitle = document.getElementById("bjpTotalSubtitle");
  if (bjpTotalSubtitle) {
    bjpTotalSubtitle.textContent =
      `Vajpayee 1996; 1998-2004 (${Math.round(vajpayee2Days / 365.25 * 10) / 10} yrs); Modi 2014-present`;
  }
}
