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
  let dbClient;
  let initialized = false;
  let initialization;
  let lastOpener = null;
  let previewUrl = "";
  let selectedFile = null;
  let selectedInspection = null;
  let inspectionTask = null;
  let inspectionToken = 0;

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

  function cloudinaryAssetUrl(value, expectedCloudName = "") {
    try {
      const url = new URL(String(value || ""));
      const cloudPath = expectedCloudName ? `/${expectedCloudName}/` : null;
      const isMediaPath = cloudPath
        ? url.pathname.startsWith(`${cloudPath}image/upload/`) || url.pathname.startsWith(`${cloudPath}video/upload/`)
        : /^\/[^/]+\/(image|video)\/upload\//.test(url.pathname);
      return url.protocol === "https:" && url.hostname === "res.cloudinary.com" && isMediaPath ? url.href : "";
    } catch {
      return "";
    }
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
    if (storage) storage.textContent = "Photos + video · reviewed before publication";
    if (!submit) return;
    submit.disabled = false;
    submit.textContent = "Submit for review";
  }

  function mediaMarkup(item, index) {
    const url = cloudinaryAssetUrl(item.secureUrl || item.url);
    if (!url) return "";
    const title = item.eventTitle || item.title || `Gallery item ${index + 1}`;
    const type = item.mediaType === "video" || new URL(url).pathname.includes("/video/upload/") ? "video" : "image";
    if (type === "video") {
      const poster = cloudinaryAssetUrl(item.posterUrl);
      return `<video controls playsinline preload="metadata"${poster ? ` poster="${esc(poster)}"` : ""} aria-label="${esc(title)}"><source src="${esc(url)}"></video>`;
    }
    return `<img src="${esc(url)}" alt="${esc(item.alt || title)}" loading="lazy" decoding="async">`;
  }

  function renderGallery() {
    const grid = document.getElementById("galleryGrid");
    const count = document.getElementById("galleryCount");
    if (!grid || !count) return;

    const items = approvedItems
      .filter((item) => item && item.reviewStatus === "approved" && cloudinaryAssetUrl(item.secureUrl || item.url))
      .sort((a, b) => String(b.publishedAt || b.recordedDate || "").localeCompare(String(a.publishedAt || a.recordedDate || "")));

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
      const socialHandle = String(item.socialHandle || "").trim();
      const credit = item.credit || socialHandle || "Anonymous contributor";
      const initial = credit.replace(/^@/, "").charAt(0).toUpperCase() || "A";
      const title = item.eventTitle || item.title || "Documented public event";
      const warning = WARNING_LABELS[item.contentWarning];
      const record = item.relatedRecordId ? `/record/${encodeURIComponent(item.relatedRecordId)}` : "";
      return `
        <article id="${id}" class="gallery-card">
          <header class="gallery-card-head">
            <span class="gallery-avatar" aria-hidden="true">${esc(initial)}</span>
            <div><strong>${esc(credit)}</strong><span>${socialHandle && socialHandle !== credit ? `${esc(socialHandle)} · ` : ""}${esc(item.location || item.state || "Location checked by editor")} · ${esc(formatDate(item.recordedDate))}</span></div>
            <button type="button" class="gallery-share-button" data-gallery-share="${esc(id)}" aria-label="Copy link to ${esc(title)}">Share</button>
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
              ${record ? `<a href="${record}" data-link>Related record</a>` : ""}
            </div>
          </div>
        </article>`;
    }).join("");
  }

  function revokePreview() {
    inspectionToken += 1;
    selectedInspection = null;
    inspectionTask = null;
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
        document.getElementById("galleryUploadTitle")?.focus({ preventScroll: true });
      } else {
        document.getElementById("galleryDropzone")?.focus();
      }
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
    const isSubmitRoute = window.location.pathname.replace(/\/+$/, "") === "/gallery/submit";
    hideModal();
    if (!isSubmitRoute) return;
    window.history.pushState({}, "", "/gallery");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  function setProgress(percent) {
    const progress = document.getElementById("galleryUploadProgress");
    const fill = progress?.querySelector("span");
    if (!progress || !fill) return;
    const safe = Math.max(0, Math.min(100, Number(percent) || 0));
    progress.hidden = false;
    progress.setAttribute("aria-hidden", "false");
    fill.style.width = `${safe}%`;
  }

  async function uploadToCloudinary(file) {
    const signatureResponse = await fetch("/api/gallery-signature", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mediaType: VIDEO_TYPES.has(file.type) ? "video" : "image" }),
    });
    let signature;
    try { signature = await signatureResponse.json(); } catch { signature = {}; }
    if (!signatureResponse.ok || !signature.signature || !signature.timestamp || !signature.apiKey || !signature.cloudName) {
      throw new Error(signature.error || "The secure upload service is not configured.");
    }

    return new Promise((resolve, reject) => {
      const payload = new FormData();
      payload.append("file", file);
      payload.append("api_key", signature.apiKey);
      payload.append("timestamp", String(signature.timestamp));
      payload.append("signature", signature.signature);
      payload.append("folder", signature.folder);
      if (signature.uploadPreset) payload.append("upload_preset", signature.uploadPreset);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/auto/upload`);
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
      xhr.send(payload);
    });
  }

  function saveReceipt(submission) {
    try {
      const key = "letsFixIndia.gallerySubmissionReceipts";
      const receipts = JSON.parse(localStorage.getItem(key) || "[]");
      receipts.unshift({
        publicId: submission.publicId,
        eventTitle: submission.eventTitle,
        submittedAt: submission.submittedAt,
        integrity: submission.integrity,
      });
      localStorage.setItem(key, JSON.stringify(receipts.slice(0, 10)));
    } catch {
      // A receipt is optional; upload and queue errors are still shown directly.
    }
  }

  async function queueForReview(submission) {
    if (!dbClient) throw new Error("The editor queue is unavailable.");
    const { error } = await dbClient.from("letsfixindia_submissions").insert([{ data: submission }]);
    if (error) throw error;
  }

  async function submitMedia(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fileInput = document.getElementById("galleryFile");
    const file = selectedFile || fileInput?.files?.[0];
    if (!isConfigured()) {
      setStatus("Submissions are temporarily paused. Please DM @basithladdu on Instagram.", "error");
      return;
    }
    if (!file) {
      document.getElementById("galleryDropzone")?.setAttribute("aria-invalid", "true");
      document.getElementById("galleryDropzone")?.focus();
      setStatus("Choose a photo or video first.", "error");
      return;
    }
    const inputWasRequired = Boolean(fileInput?.required);
    if (selectedFile && fileInput) fileInput.required = false;
    const formIsValid = form.reportValidity();
    if (fileInput) fileInput.required = inputWasRequired;
    if (!formIsValid) return;
    const validationError = validateFile(file);
    if (validationError) {
      setStatus(validationError, "error");
      return;
    }
    if (!selectedFile) selectedFile = file;

    const submit = document.getElementById("gallerySubmitButton");
    submit.disabled = true;
    setStatus(IMAGE_TYPES.has(file.type) ? "Finishing media review check…" : "Preparing secure upload…");
    setProgress(2);

    try {
      const inspection = IMAGE_TYPES.has(file.type) ? selectedInspection || await (inspectionTask || inspectImage(file)) : null;
      if (selectedFile !== file) throw new Error("The selected file changed. Check the preview and submit again.");
      setStatus("Preparing secure upload…");
      const uploaded = await uploadToCloudinary(file);
      if (!cloudinaryAssetUrl(uploaded.secure_url, uploaded.cloudName)) throw new Error("The returned media URL did not match the signed Cloudinary environment.");

      const values = new FormData(form);
      const submission = {
        submissionType: "gallery-media",
        reviewStatus: "pending",
        mediaType: VIDEO_TYPES.has(file.type) ? "video" : "image",
        secureUrl: uploaded.secure_url,
        publicId: uploaded.public_id,
        resourceType: uploaded.resource_type,
        format: uploaded.format,
        bytes: uploaded.bytes,
        width: uploaded.width,
        height: uploaded.height,
        duration: uploaded.duration || null,
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
        reviewConfirmed: true,
        integrity: inspection?.integrity || null,
        duplicateReview: VIDEO_TYPES.has(file.type)
          ? { level: "video-review", reason: "Browser preflight currently covers images only.", requiresManualReview: true }
          : ["exact", "likely", "possible", "unavailable"].includes(inspection?.match?.level)
            ? { ...inspection.match, requiresManualReview: true }
            : inspection?.integrity ? null : { level: "unavailable", reason: "Image preflight did not return an integrity fingerprint.", requiresManualReview: true },
        cloudinaryFolder: config.folder,
        submittedAt: new Date().toISOString(),
      };

      try {
        await queueForReview(submission);
      } catch (queueError) {
        saveReceipt(submission);
        throw new Error(`The file uploaded, but the editor queue did not confirm it. Save this reference: ${submission.publicId}`);
      }

      saveReceipt(submission);
      setProgress(100);
      form.reset();
      selectedFile = null;
      revokePreview();
      setStatus("Received for editorial review. It is not public yet.", "success");
    } catch (error) {
      setStatus(error.message || "The submission failed. No gallery item was published.", "error");
    } finally {
      submit.disabled = !isConfigured();
    }
  }

  async function copyItemLink(id, button) {
    const url = `${window.location.origin}/gallery#${encodeURIComponent(id)}`;
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
    document.querySelector("[data-gallery-back]")?.addEventListener("click", (event) => {
      event.preventDefault();
      closeModal();
    });
    document.getElementById("galleryUploadForm")?.addEventListener("submit", submitMedia);
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
      const share = event.target.closest("[data-gallery-share]");
      if (share) copyItemLink(share.dataset.galleryShare, share);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeModal();
    });
    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-link]") && !event.target.closest("#galleryUploadModal")) hideModal();
    });
  }

  function populateStates() {
    const select = document.getElementById("galleryState");
    if (!select || select.options.length > 1) return;
    STATES_AND_UTS.forEach((name) => select.add(new Option(name, name)));
    const recordedDate = document.querySelector('#galleryUploadForm input[name="recordedDate"]');
    const today = new Date().toISOString().slice(0, 10);
    if (recordedDate) {
      recordedDate.max = today;
      recordedDate.value = today;
    }
    select.value = "Delhi";
  }

  async function initialize(options = {}) {
    dbClient = options.db;
    const [configData, galleryData] = await Promise.all([
      loadJson("/data/gallery-config.json", {}),
      loadJson("/data/gallery.json", { items: [] }),
    ]);
    config = { ...DEFAULT_CONFIG, ...(configData || {}) };
    approvedItems = Array.isArray(galleryData) ? galleryData : Array.isArray(galleryData?.items) ? galleryData.items : [];
    populateStates();
    bindEvents();
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
    if (window.location.pathname.replace(/\/+$/, "") !== "/gallery/submit") hideModal();
    renderConfigurationState();
    renderGallery();
    return Promise.resolve();
  }

  function openUpload() {
    openModal(document.getElementById("galleryUploadOpen"));
  }

  window.LetsFixIndiaGallery = { init, renderRoute, openUpload, closeUpload: hideModal };
})();
