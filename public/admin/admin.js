(() => {
  const loginPanel = document.querySelector("#loginPanel");
  const queuePanel = document.querySelector("#queuePanel");
  const loginStatus = document.querySelector("#loginStatus");
  const queue = document.querySelector("#queue");
  const queueStatus = document.querySelector("#queueStatus");
  const queueFilters = document.querySelector("#queueFilters");
  const toast = document.querySelector("#adminToast");
  const toastIcon = document.querySelector("#adminToastIcon");
  const toastMessage = document.querySelector("#adminToastMessage");
  let toastTimer;
  let submissions = [];
  let activeFilter = "all";

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
  })[char]);

  function trustedMedia(value, declaredType) {
    try {
      const url = new URL(String(value || ""));
      const match = url.pathname.match(/^\/[^/]+\/(image|video)\/private\/.+\.([a-z0-9]+)$/i);
      if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com" || !match) return null;
      const resourceType = match[1].toLowerCase();
      const format = match[2].toLowerCase();
      const allowed = resourceType === "image" ? ["jpg", "jpeg", "png", "webp"] : ["mp4", "mov", "webm"];
      if (declaredType !== resourceType || !allowed.includes(format)) return null;
      return { url: url.href, resourceType, format };
    } catch {
      return null;
    }
  }

  async function request(options = {}) {
    const response = await fetch("/api/admin", {
      ...options,
      headers: { "content-type": "application/json", ...(options.headers || {}) },
    });
    const contentType = String(response.headers.get("content-type") || "").toLowerCase();
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(data?.error || "Request failed.");
      error.code = data?.code || "";
      error.status = response.status;
      throw error;
    }
    if (!contentType.includes("application/json") || !data || typeof data !== "object") {
      const error = new Error("Admin service returned an invalid response.");
      error.code = "invalid_admin_response";
      error.status = 502;
      throw error;
    }
    return data;
  }

  function serviceMessage(error) {
    if (error.code === "moderation_not_configured") {
      return "Signed in. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel, then redeploy.";
    }
    if (error.code === "admin_password_not_configured") {
      return "Add GALLERY_ADMIN_PASSWORD in Vercel, then redeploy.";
    }
    return error.message;
  }

  function showToast(message, state = "success") {
    window.clearTimeout(toastTimer);
    toast.dataset.state = state;
    toastIcon.textContent = state === "error" ? "!" : "✓";
    toastMessage.textContent = message;
    toast.hidden = false;
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 3600);
  }

  function reviewStatus(item) {
    return ["approved", "rejected"].includes(item?.data?.reviewStatus) ? item.data.reviewStatus : "pending";
  }

  function detailRow(label, value) {
    if (value === undefined || value === null || value === "") return "";
    const displayed = typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);
    return `<div class="detail-row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(displayed)}</dd></div>`;
  }

  function linkRow(label, value) {
    if (!value) return "";
    let url;
    try {
      url = new URL(String(value));
      if (!["http:", "https:"].includes(url.protocol)) return detailRow(label, value);
    } catch {
      return detailRow(label, value);
    }
    return `<div class="detail-row detail-row-link"><dt>${escapeHtml(label)}</dt><dd><a href="${escapeHtml(url.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url.href)}</a><button type="button" class="copy-value" data-copy-value="${escapeHtml(url.href)}">Copy</button></dd></div>`;
  }

  function formatBytes(value) {
    const bytes = Number(value);
    if (!Number.isFinite(bytes) || bytes < 0) return value;
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB (${bytes} bytes)`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB (${bytes} bytes)`;
  }

  function submissionDetails(item, data) {
    const sourceUrls = Array.isArray(data.sourceUrls)
      ? data.sourceUrls
      : String(data.sourceUrl || "").split(/\r?\n/).filter(Boolean);
    const dimensions = data.width || data.height ? `${data.width || "?"} × ${data.height || "?"}` : "";
    const cloudinary = data.submissionKind === "original-media" || data.privateOriginal || data.secureUrl
      ? `<div class="record-group" role="group" aria-label="Cloudinary asset details"><h4>Cloudinary asset</h4><dl>
          ${linkRow("Delivery URL", data.secureUrl)}
          ${linkRow("Private original URL", data.privateOriginal?.secureUrl)}
          ${detailRow("Public ID", data.privateOriginal?.publicId || data.publicId)}
          ${detailRow("Resource type", data.privateOriginal?.resourceType || data.resourceType)}
          ${detailRow("Delivery type", data.privateOriginal?.deliveryType)}
          ${detailRow("Format", data.privateOriginal?.format || data.format)}
          ${detailRow("Version", data.privateOriginal?.version)}
          ${detailRow("File size", data.bytes !== undefined ? formatBytes(data.bytes) : "")}
          ${detailRow("Dimensions", dimensions)}
          ${detailRow("Duration", data.duration !== undefined && data.duration !== null ? `${data.duration} seconds` : "")}
        </dl><p class="record-note">These are the exact stored Cloudinary references. A private URL may return 401 outside an authorized Cloudinary delivery flow; use the public ID to locate the asset in Cloudinary.</p></div>`
      : "";
    const rawRecord = JSON.stringify({ id: item.id, created_at: item.created_at, data }, null, 2);
    return `<div class="submission-record">
      <div class="record-group" role="group" aria-label="Submitter-provided details"><h4>Submitted details</h4><dl>
        ${detailRow("Submission ID", item.id)}
        ${detailRow("Reference", data.reference)}
        ${detailRow("Database created", item.created_at)}
        ${detailRow("Submitted", data.submittedAt)}
        ${detailRow("Submission kind", data.submissionKind)}
        ${detailRow("Date recorded", data.recordedDate)}
        ${detailRow("State / union territory", data.state)}
        ${detailRow("Incident type", data.incidentType)}
        ${detailRow("Place", data.location)}
        ${detailRow("What happened", data.caption)}
        ${detailRow("Public credit", data.credit)}
        ${detailRow("Social handle", data.socialHandle)}
        ${detailRow("Contact phone", data.contactPhone)}
        ${detailRow("Rights confirmed", data.rightsConfirmed)}
        ${linkRow("Social post", data.externalUrl)}
        ${sourceUrls.map((url, index) => linkRow(sourceUrls.length > 1 ? `Source link ${index + 1}` : "Source link", url)).join("")}
      </dl></div>
      ${cloudinary}
      <details class="raw-record"><summary>Raw stored record — all fields</summary><button type="button" class="copy-record" data-copy-record="${Number(item.id)}">Copy raw JSON</button><pre>${escapeHtml(rawRecord)}</pre></details>
    </div>`;
  }

  async function copyText(value) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied) throw new Error("Copy failed.");
  }

  function mediaPreview(item, data) {
    const media = trustedMedia(data.secureUrl, data.mediaType);
    if (media?.resourceType === "image") {
      return `<figure class="admin-preview" data-admin-preview="${Number(item.id)}"><img src="${escapeHtml(media.url)}" alt="Submitted evidence preview" loading="lazy" decoding="async" referrerpolicy="no-referrer"><figcaption>Image preview &middot; ${escapeHtml(media.format.toUpperCase())} &middot; no download action</figcaption><p class="preview-status" role="status">Loading preview&hellip;</p></figure>`;
    }
    if (media?.resourceType === "video") {
      const mime = media.format === "webm" ? "video/webm" : media.format === "mov" ? "video/quicktime" : "video/mp4";
      return `<figure class="admin-preview" data-admin-preview="${Number(item.id)}"><video controls controlslist="nodownload noremoteplayback" disablepictureinpicture playsinline preload="metadata" referrerpolicy="no-referrer"><source src="${escapeHtml(media.url)}" type="${mime}"></video><figcaption>Video preview &middot; ${escapeHtml(media.format.toUpperCase())} &middot; click play to review</figcaption><p class="preview-status" role="status">Loading preview&hellip;</p></figure>`;
    }
    const social = window.LetsFixIndiaEmbeds?.parse(data.externalUrl);
    if (social) return `<a class="social-preview-link" href="${escapeHtml(social.canonicalUrl)}" target="_blank" rel="noopener noreferrer">Review the validated ${escapeHtml(social.platformName)} post <span aria-hidden="true">&nearr;</span></a>`;
    return `<p class="preview-error">Preview unavailable. Do not approve this submission.</p>`;
  }

  function updateFilterCounts() {
    const counts = submissions.reduce((result, item) => {
      result[reviewStatus(item)] += 1;
      return result;
    }, { pending: 0, approved: 0, rejected: 0 });
    counts.all = submissions.length;
    queueFilters?.querySelectorAll("button[data-filter]").forEach((button) => {
      const filter = button.dataset.filter;
      button.setAttribute("aria-pressed", String(filter === activeFilter));
      const count = button.querySelector("[data-filter-count]");
      if (count) count.textContent = String(counts[filter] || 0);
    });
  }

  function bindPreviewGuards() {
    queue.querySelectorAll("[data-admin-preview]").forEach((preview) => {
      const id = Number(preview.dataset.adminPreview);
      const media = preview.querySelector("img, video");
      const status = preview.querySelector(".preview-status");
      const approve = queue.querySelector(`button[data-id="${id}"][data-status="approved"]`);
      if (!media || !approve) return;
      const ready = () => {
        preview.dataset.state = "ready";
        if (status) status.textContent = "Preview loaded. Review it before approving.";
        approve.disabled = false;
        approve.removeAttribute("title");
      };
      const failed = () => {
        preview.dataset.state = "error";
        if (status) status.textContent = "Preview failed. Reject or delete this submission.";
        approve.disabled = true;
        approve.title = "Preview must load before approval";
      };
      media.addEventListener(media.tagName === "IMG" ? "load" : "loadedmetadata", ready, { once: true });
      media.addEventListener("error", failed, { once: true });
      if ((media.tagName === "IMG" && media.complete && media.naturalWidth) || (media.tagName === "VIDEO" && media.readyState >= 1)) ready();
    });
  }

  function render() {
    const visible = activeFilter === "all" ? submissions : submissions.filter((item) => reviewStatus(item) === activeFilter);
    updateFilterCounts();
    queueStatus.textContent = activeFilter === "all" ? `${submissions.length} submissions` : `${visible.length} ${activeFilter} of ${submissions.length}`;
    queue.innerHTML = visible.length ? visible.map((item) => {
      const data = item.data || {};
      const status = reviewStatus(item);
      const approveCurrent = status === "approved";
      const rejectCurrent = status === "rejected";
      const hasValidPreview = Boolean(trustedMedia(data.secureUrl, data.mediaType) || window.LetsFixIndiaEmbeds?.parse(data.externalUrl));
      const approveLocked = !approveCurrent && (!hasValidPreview || ["image", "video"].includes(data.mediaType));
      return `<article class="submission" data-review-status="${status}"><div class="submission-main"><strong>${escapeHtml(data.eventTitle || data.caption || "Untitled submission")}</strong><span>${escapeHtml(data.state || "State unknown")} &middot; ${escapeHtml(data.mediaType || "media")} &middot; ${escapeHtml(status)}</span><p>${escapeHtml(data.caption || "")}</p>${submissionDetails(item, data)}${mediaPreview(item, data)}</div><div class="actions"><button data-action="moderate" data-id="${Number(item.id)}" data-status="${approveCurrent ? "pending" : "approved"}" class="${approveCurrent ? "is-current" : ""}"${approveLocked ? ' disabled title="A valid preview must load before approval"' : ""}>${approveCurrent ? "Undo approval" : "Approve"}</button><button data-action="moderate" data-id="${Number(item.id)}" data-status="${rejectCurrent ? "pending" : "rejected"}" class="reject${rejectCurrent ? " is-current" : ""}">${rejectCurrent ? "Undo rejection" : "Reject"}</button><button data-action="delete" data-id="${Number(item.id)}" class="delete">Delete</button></div></article>`;
    }).join("") : "<p>No submissions found for this filter.</p>";
    bindPreviewGuards();
  }

  async function load({ reportError = true } = {}) {
    try {
      const data = await request();
      submissions = Array.isArray(data.items) ? data.items : [];
      render();
      return { ok: true };
    } catch (error) {
      if (reportError) queueStatus.textContent = serviceMessage(error);
      return { ok: false, error };
    }
  }

  async function restoreSession() {
    const result = await load({ reportError: false });
    if (result.ok) {
      loginPanel.hidden = true;
      queuePanel.hidden = false;
    } else if (result.error.status !== 401) {
      loginStatus.textContent = serviceMessage(result.error);
    }
  }

  document.querySelector("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    loginStatus.textContent = "";
    try {
      await request({
        method: "POST",
        body: JSON.stringify({ action: "login", password: document.querySelector("#password").value }),
      });
      loginPanel.hidden = true;
      queuePanel.hidden = false;
      await load();
    } catch (error) {
      loginStatus.textContent = serviceMessage(error);
    }
  });

  document.querySelector("#refreshButton").addEventListener("click", load);
  queueFilters?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;
    activeFilter = activeFilter === button.dataset.filter && activeFilter !== "all" ? "all" : button.dataset.filter;
    render();
  });
  queue.addEventListener("click", async (event) => {
    const copyValueButton = event.target.closest("button[data-copy-value]");
    const copyRecordButton = event.target.closest("button[data-copy-record]");
    if (copyValueButton || copyRecordButton) {
      let value = copyValueButton?.dataset.copyValue || "";
      if (copyRecordButton) {
        const item = submissions.find((entry) => Number(entry.id) === Number(copyRecordButton.dataset.copyRecord));
        if (item) value = JSON.stringify({ id: item.id, created_at: item.created_at, data: item.data || {} }, null, 2);
      }
      try {
        await copyText(value);
        showToast(copyRecordButton ? "Raw submission JSON copied." : "Link copied.");
      } catch {
        showToast("Could not copy automatically. Select the value manually.", "error");
      }
      return;
    }
    const button = event.target.closest("button[data-id]");
    if (!button || button.disabled) return;
    const nextStatus = button.dataset.status;
    const id = Number(button.dataset.id);
    if (button.dataset.action === "delete") {
      const item = submissions.find((entry) => Number(entry.id) === id);
      const title = item?.data?.eventTitle || item?.data?.caption || "this submission";
      if (!window.confirm(`Permanently delete ${title}? Uploaded media will also be removed from Cloudinary.`)) return;
      button.disabled = true;
      button.textContent = "Deleting...";
      try {
        const result = await request({ method: "DELETE", body: JSON.stringify({ id }) });
        submissions = submissions.filter((entry) => Number(entry.id) !== id);
        render();
        showToast(result.cloudinaryDeleted ? "Submission and Cloudinary media deleted." : "Submission deleted.");
      } catch (error) {
        showToast(serviceMessage(error), "error");
        render();
      }
      return;
    }
    const actionLabel = nextStatus === "approved" ? "Approve" : nextStatus === "rejected" ? "Reject" : "Undo";
    button.disabled = true;
    button.textContent = nextStatus === "approved" ? "Approving…" : nextStatus === "rejected" ? "Rejecting…" : "Undoing…";
    try {
      await request({
        method: "PATCH",
        body: JSON.stringify({ id, status: nextStatus }),
      });
      submissions = submissions.map((item) => Number(item.id) === id
        ? { ...item, data: { ...(item.data || {}), reviewStatus: nextStatus, reviewedAt: new Date().toISOString() } }
        : item);
      render();
      showToast(nextStatus === "approved" ? "Submission approved." : nextStatus === "rejected" ? "Submission rejected." : "Submission returned to pending.");
    } catch (error) {
      const message = serviceMessage(error);
      queueStatus.textContent = message;
      showToast(message, "error");
      button.textContent = actionLabel;
      button.disabled = false;
    }
  });

  restoreSession();
})();
