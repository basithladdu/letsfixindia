function setSideNav(open) {
  const sideNav = document.querySelector("#sideNav");
  const backdrop = document.querySelector("#navBackdrop");
  const toggle = document.querySelector("#menuToggle");
  if (!sideNav || !backdrop || !toggle) return;
  if (open) backdrop.hidden = false;
  requestAnimationFrame(() => {
    sideNav.classList.toggle("is-open", open);
    backdrop.classList.toggle("is-open", open);
  });
  sideNav.setAttribute("aria-hidden", String(!open));
  toggle.setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("side-nav-open", open);
  if (open) {
    setTimeout(() => document.querySelector("#menuClose")?.focus(), 80);
  }
  if (!open) {
    setTimeout(() => { backdrop.hidden = true; }, 240);
  }
}

function bindEvents() {
  syncFilterDisclosure();

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
    if (event.key === "/" && !typing) {
      const routeSearch = [searchInput, indicatorSearchInput, voiceSearchInput, sourceSearchInput].find((input) => input && input.closest(".route-page")?.classList.contains("is-active"));
      if (routeSearch) {
        event.preventDefault();
        routeSearch.focus();
      }
    }
    if (event.key === "Escape" && typing && target.type === "search" && target.value) {
      target.value = "";
      target.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });

  document.querySelector("#menuToggle")?.addEventListener("click", () => {
    const isOpen = document.querySelector("#sideNav")?.classList.contains("is-open");
    setSideNav(!isOpen);
  });
  document.querySelector("#menuClose")?.addEventListener("click", () => setSideNav(false));
  document.querySelector("#navBackdrop")?.addEventListener("click", () => setSideNav(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setSideNav(false);
  });

  document.addEventListener("click", (event) => {
    const link = closestFromEvent(event, "a[data-link]");
    if (!link) return;
    if (link.closest("#sideNav")) setSideNav(false);
    const url = new URL(link.href);
    if (url.origin !== window.location.origin) return;
    const fromRoute = resolveRoute();
    const toRoute = routeFromPath(url.pathname);
    if (fromRoute.page === "timeline") {
      saveTimelineScroll(true);
    }
    event.preventDefault();
    const restoreTimeline = toRoute.page === "timeline" && fromRoute.page === "record";
    history.pushState({ restoreTimeline }, "", `${url.pathname}${url.search}${url.hash}`);
    renderRoute({ restoreTimeline });
    if (url.hash) {
      requestAnimationFrame(() => scrollToHashTarget(url.hash, "smooth"));
    }
  });

  window.addEventListener("popstate", () => {
    renderRoute({ restoreTimeline: resolveRoute().page === "timeline" });
  });

  let scrollSaveTimeout = null;
  window.addEventListener("scroll", () => {
    updateMobileScrollProgress();
    updateScrollProgress();
    if (resolveRoute().page !== "timeline") return;
    if (!scrollSaveQueued) {
      scrollSaveQueued = true;
      requestAnimationFrame(() => {
        updateScrollDock();
        scrollSaveQueued = false;
      });
    }
    if (scrollSaveTimeout) window.clearTimeout(scrollSaveTimeout);
    scrollSaveTimeout = window.setTimeout(() => {
      saveTimelineScroll(false);
    }, 200);
  }, { passive: true });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 720) setSideNav(false);
    syncFilterDisclosure();
    updateScrollDock();
    updateScrollProgress();
    if (resolveRoute().page === "map") stateMapInstance?.resize();
  });

  scrollDock?.addEventListener("click", (event) => {
    const button = closestFromEvent(event, "button[data-scroll-action]");
    if (!button) return;
    const action = button.dataset.scrollAction;
    if (action === "top") {
      localStorage.setItem(TIMELINE_JUMP_ORIGIN_KEY, String(Math.round(window.scrollY)));
      jumpDockToY(0);
      updateScrollDock();
    }
    if (action === "saved") {
      const jumpOrigin = storedScroll(TIMELINE_JUMP_ORIGIN_KEY);
      if (jumpOrigin > 24) {
        localStorage.removeItem(TIMELINE_JUMP_ORIGIN_KEY);
        jumpDockToY(jumpOrigin);
      } else {
        restoreTimelineScroll();
      }
      updateScrollDock();
    }
    if (action === "bottom") {
      localStorage.setItem(TIMELINE_JUMP_ORIGIN_KEY, String(Math.round(window.scrollY)));
      jumpDockToY(maxScrollY());
      updateScrollDock();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (resolveRoute().page !== "timeline") return;
    const tag = (event.target?.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select" || event.target?.isContentEditable) return;
    if (event.key === "Home" && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      scrollDock.querySelector("[data-scroll-action='top']")?.click();
    } else if (event.key === "End" && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      scrollDock.querySelector("[data-scroll-action='bottom']")?.click();
    } else if (event.key === "." && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      scrollDock.querySelector("[data-scroll-action='saved']")?.click();
    }
  });

  timelineList?.addEventListener("click", (event) => {
    if (closestFromEvent(event, "[data-clear-filters]")) {
      clearTimelineFilters();
    }
  });

  searchInput?.addEventListener("input", (event) => {
    state.query = event.target.value;
    playUiSound("filter");
    renderTimeline();
    updateScrollDock();
  });

  categoryFilter?.addEventListener("change", (event) => {
    state.category = event.target.value;
    playUiSound("filter");
    renderTimeline();
    updateScrollDock();
  });

  actorFilter?.addEventListener("change", (event) => {
    state.actor = event.target.value;
    playUiSound("filter");
    renderTimeline();
    updateScrollDock();
  });

  statusFilter?.addEventListener("change", (event) => {
    state.status = event.target.value;
    playUiSound("filter");
    renderTimeline();
    updateScrollDock();
  });

  evidenceFilter?.addEventListener("change", (event) => {
    saveTimelineScroll(true);
    state.evidence = event.target.value;
    playUiSound("filter");
    renderTimeline();
    updateScrollDock();
  });
  
  sortFilter?.addEventListener("change", (event) => {
    saveTimelineScroll(true);
    state.sort = event.target.value;
    playUiSound("filter");
    renderTimeline();
    updateScrollDock();
  });

  clearFiltersButton?.addEventListener("click", clearTimelineFilters);

  yearRail?.addEventListener("click", (event) => {
    const button = closestFromEvent(event, "button[data-year]");
    if (!button) return;
    saveTimelineScroll(true);
    state.year = button.dataset.year;
    playUiSound("filter");
    yearRail.querySelectorAll(".year-pill").forEach((pill) => {
      const isActive = pill === button;
      pill.classList.toggle("active", isActive);
      pill.setAttribute("aria-pressed", String(isActive));
    });
    renderTimeline();
    updateScrollDock();
  });

  // Handle big buttons mode selector
  const submitModeSelector = document.getElementById("submitModeSelector");

  submitModeSelector?.addEventListener("click", (event) => {
    const btn = closestFromEvent(event, ".mode-btn");
    if (!btn) return;
    
    // Highlight active button by toggling active class
    submitModeSelector.querySelectorAll(".mode-btn").forEach(b => {
      b.classList.remove("active");
    });
    btn.classList.add("active");
    
    const mode = btn.dataset.mode;
    const radio = document.getElementById(mode === "new" ? "submitTypeNew" : "submitTypeCorrection");
    if (radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event("change", { bubbles: true }));
    }
    
    revealSubmissionForm(mode === "correction" ? "#eventSearchInput" : "input[name='title']");
  });

  // Handle submission type toggle
  submissionForm?.addEventListener("change", (event) => {
    if (event.target.name === "submissionType") {
      const type = event.target.value;
      const newFields = document.getElementById("newEventFields");
      const corrFields = document.getElementById("correctionEventFields");
      const summaryLabel = document.getElementById("summaryLabel");
      const summaryTextarea = document.querySelector('textarea[name="summary"]');
      const sourcesTextarea = document.querySelector('textarea[name="sources"]');
      
      if (!newFields || !corrFields) return;
      
      const newRequiredInputs = newFields.querySelectorAll("input, select");
      const hiddenInput = document.getElementById("eventSelectHidden");
      
      if (type === "correction") {
        newFields.style.display = "none";
        corrFields.style.display = "block";
        newRequiredInputs.forEach(el => el.removeAttribute("required"));
        if (hiddenInput) hiddenInput.setAttribute("required", "required");
        
        if (summaryLabel) summaryLabel.textContent = "What needs to be corrected or added?";
        if (summaryTextarea) {
          summaryTextarea.placeholder = "Describe the correction, source updates, or extra details that should be added to the selected event.";
        }
        if (sourcesTextarea) {
          sourcesTextarea.placeholder = "Additional source URLs supporting your correction, one per line.";
        }
      } else {
        newFields.style.display = "contents";
        corrFields.style.display = "none";
        newRequiredInputs.forEach(el => {
          if (el.name !== "affected") {
            el.setAttribute("required", "required");
          }
        });
        if (hiddenInput) hiddenInput.removeAttribute("required");
        
        if (summaryLabel) summaryLabel.textContent = "What happened";
        if (summaryTextarea) {
          summaryTextarea.placeholder = "Write the factual claim, the BJP/RSS/government connection, and what still needs verification.";
        }
        if (sourcesTextarea) {
          sourcesTextarea.placeholder = "Paste URLs, one per line. Prefer court, official, NCRB, ADR, HRW, Amnesty, RSF, Reuters, The Hindu, Indian Express, BBC.";
        }
      }
    }
  });

  // Handle event search and custom combobox dropdown filter
  const eventSearchInput = document.getElementById("eventSearchInput");
  const eventDropdownList = document.getElementById("eventDropdownList");
  const eventSelectHidden = document.getElementById("eventSelectHidden");

  eventSearchInput?.addEventListener("focus", () => {
    if (events) {
      renderEventDropdownList(events);
      if (eventDropdownList) eventDropdownList.style.display = "block";
    }
  });

  eventSearchInput?.addEventListener("blur", () => {
    setTimeout(() => {
      if (eventDropdownList) eventDropdownList.style.display = "none";
    }, 200);
  });

  eventSearchInput?.addEventListener("input", (event) => {
    const query = event.target.value.toLowerCase().trim();
    if (!events || !eventDropdownList) return;
    
    const filtered = events.filter(ev => 
      ev.title.toLowerCase().includes(query) || 
      String(ev.year).includes(query) ||
      (ev.summary && ev.summary.toLowerCase().includes(query))
    );
    
    renderEventDropdownList(filtered);
    eventDropdownList.style.display = "block";
  });

  eventDropdownList?.addEventListener("click", (event) => {
    const item = closestFromEvent(event, ".combobox-item");
    if (!item) return;
    
    if (eventSearchInput) eventSearchInput.value = item.dataset.title;
    if (eventSelectHidden) eventSelectHidden.value = item.dataset.id;
    eventDropdownList.style.display = "none";
  });

  submissionForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(submissionForm);
    const draft = Object.fromEntries(formData.entries());
    draft.createdAt = new Date().toISOString();
    
    // Enrich draft if it's a correction suggestion
    if (draft.submissionType === "correction" && draft.targetEventId) {
      const matchedEvent = events.find(ev => ev.id === draft.targetEventId);
      if (matchedEvent) {
        draft.targetEventTitle = matchedEvent.title;
        draft.targetEventYear = matchedEvent.year;
      }
    }
    
    // Save to local drafts as a fallback
    const drafts = getDrafts();
    drafts.unshift(draft);
    saveDrafts(drafts);
    
    submissionForm.reset();
    
    // Hide form and reset buttons state
    submissionForm.style.display = "none";
    if (submitModeSelector) {
      submitModeSelector.classList.remove("is-compact");
      submitModeSelector.querySelectorAll(".mode-btn").forEach(b => {
        b.classList.remove("active");
      });
    }
    document.querySelector(".submit-rules")?.classList.remove("is-compact");
    
    renderSubmissions();
    
    setSubmitFeedback("Sending submission to editor review queue...");
    
    // Direct persistence to Supabase
    if (db) {
      db.from("letsfixindia_submissions").insert([{ data: draft }])
        .then(({ error }) => {
          if (error) throw error;
          setSubmitFeedback("Submission sent directly to the editor's queue! Thank you.");
          window.setTimeout(() => setSubmitFeedback(""), 6000);
        })
        .catch((error) => {
          console.warn("Supabase submission failed; draft saved locally:", error);
          setSubmitFeedback("Saved locally in this browser. Cloud submission is offline: " + error.message);
          window.setTimeout(() => setSubmitFeedback(""), 6000);
        });
    } else {
      setSubmitFeedback("Saved locally in this browser (Cloud offline).");
      window.setTimeout(() => setSubmitFeedback(""), 6000);
    }
  });

  stateMapSelect?.addEventListener("change", (event) => {
    playUiSound("nav");
    updateMapSelection(event.target.value);
  });
  stateMapReset?.addEventListener("click", () => {
    playUiSound("success");
    updateMapSelection("");
  });
  stateDirectory?.addEventListener("click", (event) => {
    const button = closestFromEvent(event, "button[data-state-name]");
    if (!button) return;
    playUiSound("nav");
    updateMapSelection(button.dataset.stateName || "");
    document.querySelector(".state-map-panel")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
  });
  voiceIssueSpotlight?.addEventListener("click", (event) => {
    const button = closestFromEvent(event, "button[data-voice-issue]");
    if (!button) return;
    const issue = button.dataset.voiceIssue || "all";
    voiceState.issue = voiceState.issue === issue ? "all" : issue;
    if (voiceIssueFilter) voiceIssueFilter.value = voiceState.issue;
    playUiSound("filter");
    renderVoices();
  });

  voiceFieldFilter?.addEventListener("change", (event) => {
    voiceState.field = event.target.value;
    playUiSound("filter");
    renderVoices();
  });

  voiceStanceFilter?.addEventListener("change", (event) => {
    voiceState.stance = event.target.value;
    playUiSound("filter");
    renderVoices();
  });

  voiceIssueFilter?.addEventListener("change", (event) => {
    voiceState.issue = event.target.value;
    playUiSound("filter");
    renderVoices();
  });
  voiceSortFilter?.addEventListener("change", (event) => {
    voiceState.sort = event.target.value;
    playUiSound("filter");
    renderVoices();
  });
  voiceSearchInput?.addEventListener("input", (event) => {
    voiceState.query = event.target.value.trim().toLowerCase();
    playUiSound("filter");
    renderVoices();
  });
  sourceSearchInput?.addEventListener("input", (event) => {
    sourceState.query = event.target.value.trim().toLowerCase();
    playUiSound("filter");
    renderSources();
  });
  indicatorSearchInput?.addEventListener("input", () => {
    playUiSound("filter");
    window.LetsFixIndiaStatistics?.resetPage();
    renderIndicators();
  });
  indicatorToneFilter?.addEventListener("change", () => {
    playUiSound("filter");
    window.LetsFixIndiaStatistics?.resetPage();
    renderIndicators();
  });
  indicatorTopicFilter?.addEventListener("change", () => {
    playUiSound("filter");
    window.LetsFixIndiaStatistics?.resetPage();
    renderIndicators();
  });
  indicatorSortFilter?.addEventListener("change", () => {
    playUiSound("filter");
    window.LetsFixIndiaStatistics?.resetPage();
    renderIndicators();
  });
  clearIndicatorFiltersButton?.addEventListener("click", () => {
    playUiSound("success");
    clearIndicatorFilters();
  });
  clearVoiceFiltersButton?.addEventListener("click", () => {
    playUiSound("success");
    clearVoiceFilters();
  });
  clearSourceFiltersButton?.addEventListener("click", () => {
    playUiSound("success");
    clearSourceFilters();
  });
  sourceStatusFilter?.addEventListener("change", (event) => {
    sourceState.status = event.target.value;
    playUiSound("filter");
    renderSources();
  });

  submissionQueue?.addEventListener("click", (event) => {
    const button = closestFromEvent(event, "button[data-remove-draft]");
    if (!button) return;
    const index = Number(button.dataset.removeDraft);
    const drafts = getDrafts();
    drafts.splice(index, 1);
    saveDrafts(drafts);
    renderSubmissions();
  });
}
