(() => {
  const STATES_AND_UTS = [
    "Andaman and Nicobar Islands",
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chandigarh",
    "Chhattisgarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jammu and Kashmir",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Ladakh",
    "Lakshadweep",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Puducherry",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ];

  const WARNING_LABELS = {
    "police-force": "Police force / lathi charge",
    "tear-gas": "Tear gas / smoke",
    injury: "Visible injury",
    distress: "People in distress",
  };

  const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
  const VIDEO_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm"]);

  const DEFAULT_CONFIG = {
    cloudName: "",
    uploadPreset: "",
    folder: "letsfixindia",
    maxImageBytes: 20 * 1024 * 1024,
    maxVideoBytes: 100 * 1024 * 1024,
    moderationMode: "review-before-publish",
  };

  let config = { ...DEFAULT_CONFIG };
  let approvedItems = [];
  let staticApprovedItems = [];
  let liveApprovedItems = [];
  let liveRefreshTask;
  let lastLiveRefresh = 0;
  let dbClient;
  let initialized = false;
  let initialization;
  let lastOpener = null;
  let successOpener = null;
  let previewUrl = "";
  let selectedFile = null;
  let selectedInspection = null;
  let inspectionTask = null;
  let inspectionToken = 0;
  let stagedUpload = null;
  let isSubmitting = false;
  let submissionCompleted = false;
  let currentReceipt = null;

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function cleanId(value, fallback) {
    const cleaned = String(value || "").replace(/[^a-zA-Z0-9_-]/g, "");
    return cleaned || fallback;
  }

  function publicUrl(value) {
    try {
      const url = new URL(String(value || ""), window.location.origin);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  function socialPost(value) {
    return window.LetsFixIndiaEmbeds?.parse(value) || null;
  }

  function cloudinaryAssetUrl(value, expectedCloudName = "") {
    try {
      const url = new URL(String(value || ""));
      const cloudPath = expectedCloudName ? `/${expectedCloudName}/` : null;
      const isMediaPath = cloudPath
        ? ["upload", "private"].some((deliveryType) => url.pathname.startsWith(`${cloudPath}image/${deliveryType}/`) || url.pathname.startsWith(`${cloudPath}video/${deliveryType}/`))
        : /^\/[^/]+\/(image|video)\/(upload|private)\//.test(url.pathname);
      return url.protocol === "https:" && url.hostname === "res.cloudinary.com" && isMediaPath ? url.href : "";
    } catch {
      return "";
    }
  }

  function cloudinaryVideoPosterUrl(value) {
    const assetUrl = cloudinaryAssetUrl(value);
    if (!assetUrl) return "";
    const url = new URL(assetUrl);
    const marker = url.pathname.includes("/video/private/") ? "/video/private/" : "/video/upload/";
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex < 0) return "";

    const assetPath = url.pathname.slice(markerIndex + marker.length);
    const lastSlash = assetPath.lastIndexOf("/");
    const lastDot = assetPath.lastIndexOf(".");
    const posterPath = lastDot > lastSlash ? `${assetPath.slice(0, lastDot)}.jpg` : `${assetPath}.jpg`;
    url.pathname = `${url.pathname.slice(0, markerIndex + marker.length)}c_limit,w_960,q_auto:eco/${posterPath}`;
    url.search = "";
    url.hash = "";
    return url.href;
  }

  function formatDate(value) {
    if (!value) return "Date under review";
    const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
  }

  function formatBytes(bytes) {
    const amount = Number(bytes) || 0;
    if (amount < 1024 * 1024) return `${Math.max(1, Math.round(amount / 1024))} KB`;
    return `${(amount / (1024 * 1024)).toFixed(amount >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
  }

  async function loadJson(path, fallback) {
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Unable to load ${path}`);
      return await response.json();
    } catch (error) {
      console.warn(error.message);
      return fallback;
    }
  }

  function mergeApprovedItems() {
    const merged = new Map();
    [...liveApprovedItems, ...staticApprovedItems].forEach((item, index) => {
      const key = item?.publicId || item?.externalUrl || item?.secureUrl || item?.url || item?.id || `gallery-item-${index}`;
      if (!merged.has(key)) merged.set(key, item);
    });
    approvedItems = [...merged.values()];
  }

  async function refreshApprovedItems({ force = false } = {}) {
    if (liveRefreshTask) return liveRefreshTask;
    if (!force && Date.now() - lastLiveRefresh < 15000) {
      return Promise.resolve();
    }
    liveRefreshTask = (async () => {
      const response = await fetch("/api/gallery");
      if (!response.ok) throw new Error("Unable to refresh approved gallery media.");
      const data = await response.json();
      const nextLiveItems = Array.isArray(data?.items) ? data.items : [];
      const changed = JSON.stringify(nextLiveItems) !== JSON.stringify(liveApprovedItems);
      liveApprovedItems = nextLiveItems;
      lastLiveRefresh = Date.now();
      if (changed) {
        mergeApprovedItems();
        renderGallery();
      }
    })().catch((error) => console.warn(error.message)).finally(() => { liveRefreshTask = null; });
    return liveRefreshTask;
  }

  function isConfigured() {
    return config.folder === "letsfixindia";
  }

  function setStatus(message, state = "") {
    const status = document.getElementById("galleryUploadStatus");
    if (!status) return;
    status.textContent = message;
    if (state) status.dataset.state = state;
    else delete status.dataset.state;
  }

  function setIntegrityStatus(message, state = "") {
    const status = document.getElementById("galleryIntegrityStatus");
    if (!status) return;
    status.textContent = message;
    if (state) status.dataset.state = state;
    else delete status.dataset.state;
  }

  function renderConfigurationState() {
    const storage = document.getElementById("galleryStorageLabel");
    const submit = document.getElementById("gallerySubmitButton");
    if (storage) storage.textContent = "Photos + video + public posts · reviewed before publication";
    if (!submit) return;
    submit.disabled = false;
    submit.textContent = "Submit for review";
  }

  function mediaMarkup(item, index) {
    const social = socialPost(item.externalUrl);
    const title = item.eventTitle || item.title || `Gallery item ${index + 1}`;
    if (social) {
      return `<div class="gallery-embed-shell" data-platform="${esc(social.platform)}"><iframe class="gallery-embed-frame" src="${esc(social.embedUrl)}" title="${esc(`${social.platformName} post: ${title}`)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; fullscreen" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-presentation" allowfullscreen></iframe><p class="gallery-embed-fallback">Embed unavailable? <a href="${esc(social.canonicalUrl)}" target="_blank" rel="noopener noreferrer">Open the original post</a></p></div>`;
    }
    const url = cloudinaryAssetUrl(item.secureUrl || item.url);
    if (!url) return "";
    const type = item.mediaType === "video" || new URL(url).pathname.includes("/video/upload/") ? "video" : "image";
    if (type === "video") {
      const posterUrl = cloudinaryVideoPosterUrl(url);
      const poster = posterUrl ? `<img class="gallery-video-poster" src="${esc(posterUrl)}" alt="" loading="lazy" decoding="async">` : "";
      return `<div class="gallery-video-gate">${poster}<span class="gallery-video-shade" aria-hidden="true"></span><span class="gallery-video-play" aria-hidden="true">▶</span><strong>Video evidence</strong><small>Press play to load the original video</small><button type="button" data-gallery-video-src="${esc(url)}" data-gallery-video-title="${esc(title)}">Play video</button></div>`;
    }
    return `<img src="${esc(url)}" alt="${esc(item.alt || title)}" loading="lazy" decoding="async">`;
  }

  function postPath(id) {
    return `/gallery?post=${encodeURIComponent(id)}`;
  }

  function revealRequestedItem() {
    const queryId = new URLSearchParams(window.location.search).get("post") || "";
    const hashId = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
    const requestedId = cleanId(queryId || hashId, "");
    if (!requestedId) return;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const card = document.getElementById(requestedId);
        if (!card) return;
        document.querySelectorAll(".gallery-card.is-shared").forEach((item) => item.classList.remove("is-shared"));
        card.classList.add("is-shared");
        card.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  }

  function renderGallery() {
    const grid = document.getElementById("galleryGrid");
    const count = document.getElementById("galleryCount");
    if (!grid || !count) return;

    const items = approvedItems
      .filter((item) => item && item.reviewStatus === "approved" && (socialPost(item.externalUrl) || cloudinaryAssetUrl(item.secureUrl || item.url)))
      .sort((a, b) => {
        if (Boolean(a.pinToEnd) !== Boolean(b.pinToEnd)) return a.pinToEnd ? 1 : -1;
        if (a.pinToEnd && b.pinToEnd) return Number(a.displayOrder || 0) - Number(b.displayOrder || 0);
        return String(b.publishedAt || b.recordedDate || "").localeCompare(String(a.publishedAt || a.recordedDate || ""));
      });

    count.textContent = `${items.length} approved ${items.length === 1 ? "item" : "items"}`;
    if (!items.length) {
      grid.innerHTML = `
        <div class="gallery-empty">
          <span class="gallery-empty-mark" aria-hidden="true">+</span>
          <div><strong>No approved media yet.</strong><p>Photos and videos appear here after review.</p></div>
        </div>`;
      return;
    }

    grid.innerHTML = items.map((item, index) => {
      const id = cleanId(item.id, `gallery-item-${index + 1}`);
      const social = socialPost(item.externalUrl);
      const socialHandle = String(item.socialHandle || "").trim();
      const credit = item.credit || socialHandle || "Anonymous contributor";
      const initial = credit.replace(/^@/, "").charAt(0).toUpperCase() || "A";
      const title = item.eventTitle || item.title || "Documented public event";
      const warning = WARNING_LABELS[item.contentWarning];
      const record = item.relatedRecordId ? `/record/${encodeURIComponent(item.relatedRecordId)}` : "";
      const permalink = postPath(id);
      const locationLabel = item.location || item.state || (social ? "Public social post" : "Location checked by editor");
      const dateLabel = item.recordedDate ? ` · ${formatDate(item.recordedDate)}` : "";
      return `
        <article id="${id}" class="gallery-card">
          <header class="gallery-card-head">
            <span class="gallery-avatar" aria-hidden="true">${esc(initial)}</span>
            <div><strong>${esc(credit)}</strong><span>${socialHandle && socialHandle !== credit ? `${esc(socialHandle)} · ` : ""}${esc(locationLabel)}${esc(dateLabel)}</span></div>
            <button type="button" class="gallery-share-button" data-gallery-url="${esc(permalink)}" data-gallery-title="${esc(title)}" aria-label="Share ${esc(title)}">Share</button>
          </header>
          <div class="gallery-media">
            ${warning ? `<span class="gallery-warning">Content warning: ${esc(warning)}</span>` : ""}
            ${mediaMarkup(item, index)}
          </div>
          <div class="gallery-card-body">
            <h3>${esc(title)}</h3>
            <p><strong>${esc(socialHandle || credit)}</strong> ${esc(item.caption || "Context available from the editor.")}</p>
            <div class="gallery-card-foot">
              <span>Reviewed before publication</span>
              <span class="gallery-card-links">${record ? `<a href="${record}" data-link>Related record</a>` : ""}<a href="${esc(permalink)}" data-link>Post link</a></span>
            </div>
          </div>
        </article>`;
    }).join("");
    revealRequestedItem();
  }

  function setSocialStatus(message, state = "") {
    const status = document.getElementById("gallerySocialStatus");
    if (!status) return;
    status.textContent = message;
    if (state) status.dataset.state = state;
    else delete status.dataset.state;
  }

  function resetProgress() {
    const progress = document.getElementById("galleryUploadProgress");
    const fill = progress?.querySelector("[data-gallery-progress-fill]");
    const track = progress?.querySelector("[role='progressbar']");
    const label = document.getElementById("galleryUploadProgressLabel");
    const retry = document.getElementById("galleryRetryButton");
    if (progress) {
      progress.hidden = true;
      progress.setAttribute("aria-hidden", "true");
    }
    if (fill) fill.style.width = "0%";
    if (track) track.setAttribute("aria-valuenow", "0");
    if (label) label.textContent = "Preparing upload";
    if (retry) retry.hidden = true;
  }

  function markFormStarted({ force = false } = {}) {
    const startedAt = document.getElementById("galleryStartedAt");
    if (startedAt && (force || !startedAt.value)) startedAt.value = String(Date.now());
  }

  function hasIncompleteSubmission() {
    if (submissionCompleted) return false;
    if (isSubmitting || selectedFile) return true;
    const form = document.getElementById("galleryUploadForm");
    if (!form) return false;
    const values = new FormData(form);
    return ["submissionKind", "externalUrl", "caption", "location", "credit", "socialHandle", "phone", "sourceUrl"]
      .some((name) => String(values.get(name) || "").trim()) || values.get("rightsConfirmed") === "on";
  }

  function confirmDiscard() {
    return !hasIncompleteSubmission() || window.confirm("Leave this unfinished submission? Your entered details will be lost.");
  }

  function setSubmissionKind(kind) {
    const isSocial = kind === "social-link";
    const isOriginal = kind === "original-media";
    const fields = document.getElementById("gallerySubmissionFields");
    const socialField = document.getElementById("gallerySocialField");
    const originalFields = document.getElementById("galleryOriginalMediaFields");
    const socialInput = document.getElementById("gallerySocialUrl");
    const fileInput = document.getElementById("galleryFile");
    const consent = document.getElementById("galleryConsentCopy");

    if (fields) fields.hidden = !isSocial && !isOriginal;
    if (socialField) socialField.hidden = !isSocial;
    if (originalFields) originalFields.hidden = !isOriginal;
    if (socialInput) {
      socialInput.disabled = !isSocial;
      socialInput.required = isSocial;
      socialInput.removeAttribute("aria-invalid");
    }
    if (fileInput) {
      fileInput.disabled = !isOriginal;
      fileInput.required = isOriginal;
    }
    if (consent) {
      consent.textContent = isOriginal
        ? "I recorded this media or have permission to submit it, and the description is accurate to the best of my knowledge."
        : "I confirm this is a public post and the description is accurate to the best of my knowledge.";
    }
    if (isSocial) {
      selectedFile = null;
      stagedUpload = null;
      revokePreview();
      setSocialStatus("The post must be public. Tracking parameters are removed before publication.");
    }
    setStatus("");
    resetProgress();
  }

  function validateSocialInput({ report = false } = {}) {
    const input = document.getElementById("gallerySocialUrl");
    const value = input?.value.trim() || "";
    const info = socialPost(value);
    if (!value) {
      if (report) {
        input?.setAttribute("aria-invalid", "true");
        setSocialStatus("Paste a public Instagram, X/Twitter, or YouTube post link.", "error");
      }
      return null;
    }
    if (!info) {
      input?.setAttribute("aria-invalid", "true");
      setSocialStatus("Use a public Instagram post or Reel, X/Twitter post, or YouTube video link.", "error");
      return null;
    }
    input?.removeAttribute("aria-invalid");
    setSocialStatus(`${info.platformName} link ready. It will be embedded after editorial approval.`, "success");
    return info;
  }

  function resetSubmissionKind() {
    setSubmissionKind("");
    setSocialStatus("The post must be public. Tracking parameters are removed before publication.");
  }

  function revokePreview() {
    inspectionToken += 1;
    selectedInspection = null;
    inspectionTask = null;
    stagedUpload = null;
    setIntegrityStatus("We’ll review your media before publication.");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = "";
    const preview = document.getElementById("galleryPreview");
    const image = document.getElementById("galleryImagePreview");
    const video = document.getElementById("galleryVideoPreview");
    if (image) {
      image.hidden = true;
      image.removeAttribute("src");
    }
    if (video) {
      video.pause();
      video.hidden = true;
      video.removeAttribute("src");
      video.load();
    }
    if (preview) preview.hidden = true;
    const dropzone = document.getElementById("galleryDropzone");
    dropzone?.classList.remove("has-file");
    dropzone?.removeAttribute("aria-invalid");
    const dropTitle = document.getElementById("galleryDropTitle");
    if (dropTitle) dropTitle.textContent = "Drop evidence here";
  }

  function validateFile(file) {
    if (!file) return "Choose a photo or video first.";
    const isImage = IMAGE_TYPES.has(file.type);
    const isVideo = VIDEO_TYPES.has(file.type);
    if (!isImage && !isVideo) return "Use JPEG, PNG, WebP, MP4, MOV, or WebM.";
    const limit = isImage ? Number(config.maxImageBytes) : Number(config.maxVideoBytes);
    if (file.size > limit) return `${isImage ? "Image" : "Video"} is too large. The limit is ${formatBytes(limit)}.`;
    return "";
  }

  function recentReceipts() {
    try {
      const receipts = JSON.parse(localStorage.getItem("letsFixIndia.gallerySubmissionReceipts") || "[]");
      return Array.isArray(receipts) ? receipts : [];
    } catch {
      return [];
    }
  }

  function describeInspection(match) {
    if (match?.level === "exact") return ["This exact file was already approved or submitted from this browser. You can still add new witness context; an editor will review the duplicate.", "warning"];
    if (match?.level === "likely") return ["A near-identical image was found. This submission will be flagged for duplicate review.", "warning"];
    if (match?.level === "possible") return ["A visually similar image was found. An editor will compare both copies.", "warning"];
    return ["Media review check complete. Your submission can continue.", "success"];
  }

  function inspectImage(file) {
    const token = ++inspectionToken;
    selectedInspection = null;
    const deduplication = window.LetsFixIndiaGalleryDedup;
    if (!deduplication?.fingerprintImage) {
      inspectionTask = Promise.resolve({ integrity: null, match: { level: "unavailable" } });
      setIntegrityStatus("We could not complete the media review check. An editor will review it.", "warning");
      return inspectionTask;
    }

    setIntegrityStatus("Checking your media…", "checking");
    inspectionTask = deduplication.fingerprintImage(file)
      .then((integrity) => {
        const match = deduplication.compareFingerprint(integrity, [...approvedItems, ...recentReceipts()]);
        const inspection = { integrity, match };
        if (token !== inspectionToken || selectedFile !== file) return null;
        selectedInspection = inspection;
        const [message, state] = describeInspection(match);
        setIntegrityStatus(message, state);
        return inspection;
      })
      .catch((error) => {
        const inspection = { integrity: null, match: { level: "unavailable" }, error: error.message };
        if (token !== inspectionToken || selectedFile !== file) return null;
        selectedInspection = inspection;
        setIntegrityStatus("We could not complete the media review check. An editor will review it.", "warning");
        return inspection;
      });
    return inspectionTask;
  }

  function previewFile(file) {
    revokePreview();
    const error = validateFile(file);
    if (error) {
      selectedFile = null;
      document.getElementById("galleryDropzone")?.setAttribute("aria-invalid", "true");
      setStatus(error, "error");
      return;
    }
    selectedFile = file;
    document.getElementById("galleryDropzone")?.removeAttribute("aria-invalid");
    const preview = document.getElementById("galleryPreview");
    const image = document.getElementById("galleryImagePreview");
    const video = document.getElementById("galleryVideoPreview");
    const meta = document.getElementById("galleryFileMeta");
    previewUrl = URL.createObjectURL(file);
    if (VIDEO_TYPES.has(file.type)) {
      video.src = previewUrl;
      video.hidden = false;
    } else {
      image.src = previewUrl;
      image.hidden = false;
    }
    preview.hidden = false;
    meta.textContent = `${file.name} · ${formatBytes(file.size)}`;
    document.getElementById("galleryDropzone")?.classList.add("has-file");
    const dropTitle = document.getElementById("galleryDropTitle");
    if (dropTitle) dropTitle.textContent = file.name;
    setStatus("Media selected. Complete the details below.");
    if (IMAGE_TYPES.has(file.type)) inspectImage(file);
    else setIntegrityStatus("Video duplicate screening is completed during editorial review.");
  }

  function openModal(opener) {
    const modal = document.getElementById("galleryUploadModal");
    if (!modal) return;
    const isSubmitRoute = window.location.pathname.replace(/\/+$/, "") === "/gallery/submit";
    lastOpener = opener || document.activeElement;
    document.body.classList.remove("gallery-status-route");
    markFormStarted();
    modal.hidden = false;
    modal.setAttribute("role", isSubmitRoute ? "region" : "dialog");
    if (isSubmitRoute) {
      modal.removeAttribute("aria-modal");
      document.body.classList.add("gallery-submit-route");
    } else {
      modal.setAttribute("aria-modal", "true");
    }
    document.body.classList.add("gallery-modal-open");
    window.requestAnimationFrame(() => {
      if (isSubmitRoute) {
        window.scrollTo(0, 0);
      }
      const kindInput = document.querySelector('#galleryUploadForm input[name="submissionKind"]:checked')
        || document.querySelector('#galleryUploadForm input[name="submissionKind"]');
      kindInput?.focus({ preventScroll: true });
    });
  }

  function hideModal() {
    const modal = document.getElementById("galleryUploadModal");
    if (modal) modal.hidden = true;
    document.body.classList.remove("gallery-modal-open");
    document.body.classList.remove("gallery-submit-route");
    lastOpener?.focus?.();
    lastOpener = null;
  }

  function closeModal() {
    if (!confirmDiscard()) return;
    const isSubmitRoute = window.location.pathname.replace(/\/+$/, "") === "/gallery/submit";
    submissionCompleted = true;
    hideModal();
    if (!isSubmitRoute) return;
    window.history.pushState({}, "", "/gallery");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  function showSuccessDialog(receipt) {
    const dialog = document.getElementById("gallerySuccessDialog");
    if (!dialog) return;
    currentReceipt = receipt;
    const reference = document.getElementById("gallerySuccessReference");
    const phrase = document.getElementById("gallerySuccessPhrase");
    const statusLink = document.getElementById("gallerySuccessStatusLink");
    if (reference) reference.textContent = receipt.reference;
    if (phrase) phrase.textContent = receipt.recoveryPhrase;
    if (statusLink) statusLink.href = receipt.statusPath;
    successOpener = document.activeElement;
    document.getElementById("galleryUploadModal")?.setAttribute("inert", "");
    dialog.hidden = false;
    document.body.classList.add("gallery-success-open");
    window.requestAnimationFrame(() => dialog.querySelector("[data-gallery-success-close]")?.focus());
  }

  function closeSuccessDialog() {
    const dialog = document.getElementById("gallerySuccessDialog");
    if (!dialog || dialog.hidden) return false;
    dialog.hidden = true;
    document.getElementById("galleryUploadModal")?.removeAttribute("inert");
    document.body.classList.remove("gallery-success-open");
    successOpener?.focus?.();
    successOpener = null;
    return true;
  }

  function setProgress(percent) {
    const progress = document.getElementById("galleryUploadProgress");
    const fill = progress?.querySelector("[data-gallery-progress-fill]");
    const track = progress?.querySelector("[role='progressbar']");
    const label = document.getElementById("galleryUploadProgressLabel");
    if (!progress || !fill) return;
    const safe = Math.max(0, Math.min(100, Number(percent) || 0));
    progress.hidden = false;
    progress.setAttribute("aria-hidden", "false");
    fill.style.width = `${safe}%`;
    track?.setAttribute("aria-valuenow", String(safe));
    if (label) label.textContent = safe >= 100 ? "Submission received" : `Uploading ${safe}%`;
  }

  function showRetry() {
    const progress = document.getElementById("galleryUploadProgress");
    const retry = document.getElementById("galleryRetryButton");
    if (progress) {
      progress.hidden = false;
      progress.setAttribute("aria-hidden", "false");
    }
    if (retry) retry.hidden = false;
  }

  async function uploadToCloudinary(file, guard) {
    const signatureResponse = await fetch("/api/gallery-signature", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mediaType: VIDEO_TYPES.has(file.type) ? "video" : "image",
        website: guard.website,
        startedAt: guard.startedAt,
      }),
    });
    let signature;
    try { signature = await signatureResponse.json(); } catch { signature = {}; }
    if (!signatureResponse.ok || !signature.signature || !signature.timestamp || !signature.apiKey || !signature.cloudName || !signature.assetFolder || !signature.publicId || !signature.resourceType || !signature.allowedFormats) {
      throw new Error(signature.error || "The secure upload service is not configured.");
    }

    return new Promise((resolve, reject) => {
      const payload = new FormData();
      payload.append("file", file);
      payload.append("api_key", signature.apiKey);
      payload.append("timestamp", String(signature.timestamp));
      payload.append("signature", signature.signature);
      payload.append("asset_folder", signature.assetFolder);
      payload.append("public_id", signature.publicId);
      payload.append("allowed_formats", signature.allowedFormats);
      if (signature.uploadPreset) payload.append("upload_preset", signature.uploadPreset);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/${encodeURIComponent(signature.resourceType)}/${encodeURIComponent(signature.deliveryType)}`);
      xhr.timeout = 3 * 60 * 1000;
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setProgress(percent);
          setStatus(`Uploading media… ${percent}%`);
        }
      });
      xhr.addEventListener("load", () => {
        let response;
        try { response = JSON.parse(xhr.responseText || "{}"); } catch { response = {}; }
        if (xhr.status >= 200 && xhr.status < 300 && response.secure_url && response.public_id) resolve({ ...response, cloudName: signature.cloudName });
        else reject(new Error(response.error?.message || "Cloudinary rejected the upload."));
      });
      xhr.addEventListener("error", () => reject(new Error("The upload could not reach Cloudinary.")));
      xhr.addEventListener("timeout", () => reject(new Error("The upload timed out. Your file is still selected; retry when the connection is stable.")));
      xhr.send(payload);
    });
  }

  function saveReceipt(submission, receipt) {
    try {
      const key = "letsFixIndia.gallerySubmissionReceipts";
      const receipts = JSON.parse(localStorage.getItem(key) || "[]");
      receipts.unshift({
        publicId: submission.publicId,
        eventTitle: submission.eventTitle,
        submittedAt: submission.submittedAt,
        integrity: submission.integrity,
        reference: receipt.reference,
        recoveryPhrase: receipt.recoveryPhrase,
        statusPath: receipt.statusPath,
      });
      localStorage.setItem(key, JSON.stringify(receipts.slice(0, 10)));
    } catch {
      // A receipt is optional; upload and queue errors are still shown directly.
    }
  }

  async function queueForReview(submission) {
    const response = await fetch("/api/gallery-submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(submission),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.reference || !result.recoveryPhrase || !result.statusPath) {
      const error = new Error(result.error || "The editor queue did not accept the submission.");
      error.status = response.status;
      throw error;
    }
    return result;
  }

  async function submitMedia(event) {
    event.preventDefault();
    if (isSubmitting) return;
    const form = event.currentTarget;
    const fileInput = document.getElementById("galleryFile");
    const values = new FormData(form);
    const submissionKind = String(values.get("submissionKind") || "");
    const isSocial = submissionKind === "social-link";
    const isOriginal = submissionKind === "original-media";
    const file = selectedFile || fileInput?.files?.[0];
    if (!isConfigured()) {
      setStatus("Submissions are temporarily paused. Please DM @basithladdu on Instagram.", "error");
      return;
    }
    if (!isSocial && !isOriginal) {
      document.getElementById("gallerySubmissionKind")?.focus();
      setStatus("Choose whether you have a social media link or the original media.", "error");
      return;
    }
    const social = isSocial ? validateSocialInput({ report: true }) : null;
    if (isSocial && !social) {
      document.getElementById("gallerySocialUrl")?.focus();
      setStatus("Check the social media link.", "error");
      return;
    }
    if (isOriginal && !file) {
      document.getElementById("galleryDropzone")?.setAttribute("aria-invalid", "true");
      document.getElementById("galleryDropzone")?.focus();
      setStatus("Choose a photo or video first.", "error");
      return;
    }
    const formIsValid = form.reportValidity();
    if (!formIsValid) return;
    const validationError = isOriginal ? validateFile(file) : "";
    if (validationError) {
      setStatus(validationError, "error");
      return;
    }
    if (isOriginal && !selectedFile) selectedFile = file;

    const submit = document.getElementById("gallerySubmitButton");
    const retry = document.getElementById("galleryRetryButton");
    isSubmitting = true;
    submissionCompleted = false;
    submit.disabled = true;
    if (retry) retry.hidden = true;
    setStatus(isSocial ? `Preparing ${social.platformName} link…` : IMAGE_TYPES.has(file.type) ? "Finishing media review check…" : "Preparing secure upload…");
    setProgress(2);

    try {
      let inspection = null;
      let media = {
        mediaType: "embed",
        externalUrl: social?.canonicalUrl || "",
        embedPlatform: social?.platform || "",
        publicId: social ? `social-${social.platform}-${social.id}` : "",
      };
      if (isOriginal) {
        inspection = IMAGE_TYPES.has(file.type) ? selectedInspection || await (inspectionTask || inspectImage(file)) : null;
        if (selectedFile !== file) throw new Error("The selected file changed. Check the preview and submit again.");
        setStatus("Preparing secure upload…");
        const uploaded = stagedUpload?.file === file
          ? stagedUpload.uploaded
          : await uploadToCloudinary(file, {
              website: String(values.get("website") || ""),
              startedAt: String(values.get("startedAt") || ""),
            });
        stagedUpload = { file, uploaded };
        if (!cloudinaryAssetUrl(uploaded.secure_url, uploaded.cloudName)) throw new Error("The returned media URL did not match the signed Cloudinary environment.");
        media = {
          mediaType: VIDEO_TYPES.has(file.type) ? "video" : "image",
          secureUrl: uploaded.secure_url,
          publicId: uploaded.public_id,
          resourceType: uploaded.resource_type,
          format: uploaded.format,
          bytes: uploaded.bytes,
          width: uploaded.width,
          height: uploaded.height,
          duration: uploaded.duration || null,
          version: uploaded.version,
          deliveryType: uploaded.type,
          cloudinaryFolder: config.folder,
        };
      } else {
        setProgress(45);
        setStatus(`Sending ${social.platformName} link to the editor…`);
      }

      const submission = {
        submissionType: isSocial ? "gallery-link" : "gallery-media",
        submissionKind,
        reviewStatus: "pending",
        ...media,
        eventTitle: String(values.get("caption") || "").trim(),
        recordedDate: String(values.get("recordedDate") || ""),
        state: String(values.get("state") || ""),
        incidentType: String(values.get("incidentType") || ""),
        location: String(values.get("location") || "").trim(),
        caption: String(values.get("caption") || "").trim(),
        credit: String(values.get("credit") || "Anonymous contributor").trim() || "Anonymous contributor",
        socialHandle: String(values.get("socialHandle") || "").trim(),
        contactPhone: String(values.get("phone") || "").trim(),
        contentWarning: "none",
        sourceUrl: String(values.get("sourceUrl") || "").trim(),
        rightsConfirmed: values.get("rightsConfirmed") === "on",
        website: String(values.get("website") || ""),
        startedAt: Number(values.get("startedAt")),
        reviewConfirmed: true,
        integrity: inspection?.integrity || null,
        duplicateReview: isSocial
          ? null
          : VIDEO_TYPES.has(file.type)
            ? { level: "video-review", reason: "Browser preflight currently covers images only.", requiresManualReview: true }
            : ["exact", "likely", "possible", "unavailable"].includes(inspection?.match?.level)
              ? { ...inspection.match, requiresManualReview: true }
              : inspection?.integrity ? null : { level: "unavailable", reason: "Image preflight did not return an integrity fingerprint.", requiresManualReview: true },
        submittedAt: new Date().toISOString(),
      };

      let receipt;
      try {
        receipt = await queueForReview(submission);
      } catch (queueError) {
        throw new Error(queueError.message || (isOriginal
          ? "The file uploaded, but the editor queue did not confirm it. Retry without choosing the file again."
          : "The link did not reach the editor queue. Please try again."));
      }

      saveReceipt(submission, receipt);
      setProgress(100);
      submissionCompleted = true;
      form.reset();
      selectedFile = null;
      stagedUpload = null;
      revokePreview();
      resetSubmissionKind();
      populateStates();
      markFormStarted({ force: true });
      setStatus("Received for editorial review. It is not public yet.", "success");
      showSuccessDialog(receipt);
    } catch (error) {
      setStatus(error.message || "The submission failed. No gallery item was published.", "error");
      showRetry();
    } finally {
      isSubmitting = false;
      submit.disabled = !isConfigured();
    }
  }

  function storedReceipt(reference) {
    try {
      const receipts = JSON.parse(localStorage.getItem("letsFixIndia.gallerySubmissionReceipts") || "[]");
      return receipts.find((receipt) => receipt.reference === reference) || null;
    } catch {
      return null;
    }
  }

  async function checkSubmissionStatus(event) {
    event?.preventDefault();
    const form = document.getElementById("galleryStatusForm");
    const result = document.getElementById("galleryStatusResult");
    if (!form || !result) return;
    const values = new FormData(form);
    result.textContent = "Checking submission statusâ€¦";
    delete result.dataset.state;
    const response = await fetch("/api/gallery-status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        reference: String(values.get("reference") || ""),
        recoveryPhrase: String(values.get("recoveryPhrase") || ""),
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      result.textContent = data.error || "Status could not be checked.";
      result.dataset.state = "error";
      return;
    }
    const statusLabel = data.status === "approved" ? "Approved and published" : data.status === "rejected" ? "Not accepted for publication" : "Awaiting editorial review";
    result.innerHTML = `<strong>${esc(statusLabel)}</strong><br>${esc(data.title || "Gallery submission")} Â· ${esc(data.mediaKind || "Submission")}`;
    result.dataset.state = "success";
  }

  function openStatus(reference) {
    const cleanReference = String(reference || "").trim().toUpperCase();
    const panel = document.getElementById("gallerySubmissionStatus");
    const referenceInput = document.getElementById("galleryStatusReference");
    const phraseInput = document.getElementById("galleryStatusPhrase");
    const result = document.getElementById("galleryStatusResult");
    if (!panel || !referenceInput) return;
    closeSuccessDialog();
    hideModal();
    document.body.classList.add("gallery-status-route");
    panel.hidden = false;
    referenceInput.value = cleanReference;
    if (result) {
      result.textContent = "";
      delete result.dataset.state;
    }
    const receipt = storedReceipt(cleanReference);
    if (phraseInput) phraseInput.value = receipt?.recoveryPhrase || "";
    window.scrollTo(0, 0);
    if (receipt?.recoveryPhrase) document.getElementById("galleryStatusForm")?.requestSubmit();
    else phraseInput?.focus({ preventScroll: true });
  }

  async function copyReceipt() {
    if (!currentReceipt) return;
    const text = `LetsFixIndia submission\nReference: ${currentReceipt.reference}\nRecovery phrase: ${currentReceipt.recoveryPhrase}\nStatus: ${new URL(currentReceipt.statusPath, window.location.origin).href}`;
    try { await navigator.clipboard.writeText(text); } catch { return; }
    const button = document.getElementById("galleryCopyReceipt");
    if (button) {
      button.textContent = "Copied";
      window.setTimeout(() => { button.textContent = "Copy receipt"; }, 1400);
    }
  }

  async function shareItem(path, title, button) {
    const url = new URL(path, window.location.origin).href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${title} | LetsFixIndia`, url });
        return;
      } catch (error) {
        if (error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("textarea");
      input.value = url;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    const original = button.textContent;
    button.textContent = "Copied";
    window.setTimeout(() => { button.textContent = original; }, 1400);
  }

  function bindEvents() {
    document.querySelectorAll("[data-gallery-close]").forEach((control) => control.addEventListener("click", closeModal));
    document.querySelectorAll("[data-gallery-success-close]").forEach((control) => control.addEventListener("click", closeSuccessDialog));
    document.querySelector("[data-gallery-back]")?.addEventListener("click", (event) => {
      event.preventDefault();
      closeModal();
    });
    const uploadForm = document.getElementById("galleryUploadForm");
    uploadForm?.addEventListener("submit", submitMedia);
    uploadForm?.addEventListener("input", () => { submissionCompleted = false; });
    document.getElementById("galleryRetryButton")?.addEventListener("click", () => uploadForm?.requestSubmit());
    document.getElementById("galleryCopyReceipt")?.addEventListener("click", copyReceipt);
    document.getElementById("galleryStatusForm")?.addEventListener("submit", checkSubmissionStatus);
    uploadForm?.querySelectorAll('input[name="submissionKind"]').forEach((input) => {
      input.addEventListener("change", () => setSubmissionKind(input.value));
    });
    const socialInput = document.getElementById("gallerySocialUrl");
    socialInput?.addEventListener("input", () => {
      if (!socialInput.value.trim()) {
        socialInput.removeAttribute("aria-invalid");
        setSocialStatus("The post must be public. Tracking parameters are removed before publication.");
      } else if (socialPost(socialInput.value)) {
        validateSocialInput();
      }
    });
    socialInput?.addEventListener("blur", () => validateSocialInput({ report: Boolean(socialInput.value.trim()) }));
    const fileInput = document.getElementById("galleryFile");
    const dropzone = document.getElementById("galleryDropzone");
    fileInput?.addEventListener("change", (event) => previewFile(event.target.files?.[0]));
    dropzone?.addEventListener("click", () => fileInput?.click());
    dropzone?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        fileInput?.click();
      }
    });
    ["dragenter", "dragover"].forEach((type) => dropzone?.addEventListener(type, (event) => {
      event.preventDefault();
      dropzone.classList.add("is-dragging");
    }));
    ["dragleave", "drop"].forEach((type) => dropzone?.addEventListener(type, (event) => {
      event.preventDefault();
      dropzone.classList.remove("is-dragging");
    }));
    dropzone?.addEventListener("drop", (event) => {
      const file = event.dataTransfer?.files?.[0];
      if (!file) return;
      try { fileInput.files = event.dataTransfer.files; } catch { /* selectedFile is the fallback. */ }
      previewFile(file);
    });
    document.getElementById("galleryGrid")?.addEventListener("click", (event) => {
      const share = event.target.closest("[data-gallery-url]");
      if (share) shareItem(share.dataset.galleryUrl, share.dataset.galleryTitle || "Gallery post", share);
      const videoButton = event.target.closest("[data-gallery-video-src]");
      if (videoButton) {
        const url = cloudinaryAssetUrl(videoButton.dataset.galleryVideoSrc);
        const gate = videoButton.closest(".gallery-video-gate");
        if (!url || !gate) return;
        const video = document.createElement("video");
        video.controls = true;
        video.playsInline = true;
        video.autoplay = true;
        video.preload = "none";
        video.setAttribute("aria-label", videoButton.dataset.galleryVideoTitle || "Gallery video");
        const source = document.createElement("source");
        source.src = url;
        video.appendChild(source);
        gate.replaceWith(video);
        video.play().catch(() => {});
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !closeSuccessDialog()) closeModal();
    });
    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-link]") && !event.target.closest("#galleryUploadModal")) hideModal();
    });
    document.addEventListener("click", (event) => {
      const link = event.target.closest("a[href]");
      if (!link || !hasIncompleteSubmission() || window.location.pathname !== "/gallery/submit") return;
      let url;
      try { url = new URL(link.href, window.location.href); } catch { return; }
      if (url.href === window.location.href) return;
      if (!window.confirm("Leave this unfinished submission? Your entered details will be lost.")) {
        event.preventDefault();
        event.stopImmediatePropagation();
      } else {
        submissionCompleted = true;
      }
    }, true);
    window.addEventListener("beforeunload", (event) => {
      if (!hasIncompleteSubmission()) return;
      event.preventDefault();
      event.returnValue = "";
    });
    window.addEventListener("popstate", () => {
      if (!hasIncompleteSubmission() || window.location.pathname === "/gallery/submit") return;
      if (window.confirm("Leave this unfinished submission? Your entered details will be lost.")) {
        submissionCompleted = true;
      } else {
        window.history.forward();
      }
    });
    window.addEventListener("focus", () => {
      if (window.location.pathname.startsWith("/gallery")) refreshApprovedItems();
    });
  }

  function populateStates() {
    const select = document.getElementById("galleryState");
    if (!select) return;
    if (select.options.length <= 1) STATES_AND_UTS.forEach((name) => select.add(new Option(name, name)));
    const recordedDate = document.querySelector('#galleryUploadForm input[name="recordedDate"]');
    const current = new Date();
    const today = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
    if (recordedDate) {
      recordedDate.max = today;
      recordedDate.value = today;
    }
    select.value = "Delhi";
  }

  async function initialize(options = {}) {
    dbClient = options.db;
    const [configData, galleryData, liveGalleryData] = await Promise.all([
      loadJson("/data/gallery-config.json", {}),
      loadJson("/data/gallery.json", { items: [] }),
      loadJson("/api/gallery", { items: [] }),
    ]);
    config = { ...DEFAULT_CONFIG, ...(configData || {}) };
    staticApprovedItems = Array.isArray(galleryData) ? galleryData : Array.isArray(galleryData?.items) ? galleryData.items : [];
    liveApprovedItems = Array.isArray(liveGalleryData?.items) ? liveGalleryData.items : [];
    lastLiveRefresh = Date.now();
    mergeApprovedItems();
    populateStates();
    markFormStarted({ force: true });
    bindEvents();
    setSubmissionKind(document.querySelector('#galleryUploadForm input[name="submissionKind"]:checked')?.value || "");
    renderConfigurationState();
    renderGallery();
    initialized = true;
  }

  function init(options = {}) {
    if (!initialization) initialization = initialize(options);
    else if (options.db) dbClient = options.db;
    return initialization;
  }

  function renderRoute() {
    if (!initialized) return init({ db: dbClient });
    const path = window.location.pathname.replace(/\/+$/, "");
    const statusMatch = path.match(/^\/gallery\/submission\/(LFI-\d{8}-[A-F0-9]{8})$/i);
    if (statusMatch) openStatus(statusMatch[1]);
    else {
      document.body.classList.remove("gallery-status-route");
      const statusPanel = document.getElementById("gallerySubmissionStatus");
      if (statusPanel) statusPanel.hidden = true;
      if (path !== "/gallery/submit") hideModal();
    }
    renderConfigurationState();
    renderGallery();
    return Promise.resolve();
  }

  function openUpload() {
    document.body.classList.remove("gallery-status-route");
    const statusPanel = document.getElementById("gallerySubmissionStatus");
    if (statusPanel) statusPanel.hidden = true;
    openModal(document.getElementById("galleryUploadOpen"));
  }

  function closeUpload() {
    hideModal();
    document.body.classList.remove("gallery-status-route");
    const statusPanel = document.getElementById("gallerySubmissionStatus");
    if (statusPanel) statusPanel.hidden = true;
  }

  window.LetsFixIndiaGallery = { init, renderRoute, refresh: refreshApprovedItems, openUpload, openStatus, closeUpload };
})();
