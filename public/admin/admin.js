(() => {
  const loginPanel = document.querySelector("#loginPanel");
  const queuePanel = document.querySelector("#queuePanel");
  const loginStatus = document.querySelector("#loginStatus");
  const queue = document.querySelector("#queue");
  const queueStatus = document.querySelector("#queueStatus");
  const toast = document.querySelector("#adminToast");
  const toastIcon = document.querySelector("#adminToastIcon");
  const toastMessage = document.querySelector("#adminToastMessage");
  let toastTimer;
  let submissions = [];

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
  })[char]);

  function trustedMediaUrl(value) {
    try {
      const url = new URL(String(value || ""));
      return url.protocol === "https:" && url.hostname === "res.cloudinary.com" ? url.href : "";
    } catch {
      return "";
    }
  }

  async function request(options = {}) {
    const response = await fetch("/api/admin", {
      ...options,
      headers: { "content-type": "application/json", ...(options.headers || {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || "Request failed.");
      error.code = data.code || "";
      error.status = response.status;
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

  function render() {
    queue.innerHTML = submissions.length ? submissions.map((item) => {
      const data = item.data || {};
      const mediaUrl = trustedMediaUrl(data.secureUrl);
      const social = window.LetsFixIndiaEmbeds?.parse(data.externalUrl);
      const media = mediaUrl
        ? `<a href="${escapeHtml(mediaUrl)}" target="_blank" rel="noopener noreferrer">Open media</a>`
        : social
          ? `<a href="${escapeHtml(social.canonicalUrl)}" target="_blank" rel="noopener noreferrer">Open ${escapeHtml(social.platformName)} post</a>`
          : "No valid media URL";
      const status = ["approved", "rejected"].includes(data.reviewStatus) ? data.reviewStatus : "pending";
      const approveCurrent = status === "approved";
      const rejectCurrent = status === "rejected";
      return `<article class="submission"><div><strong>${escapeHtml(data.eventTitle || data.caption || "Untitled submission")}</strong><span>${escapeHtml(data.state || "State unknown")} &middot; ${escapeHtml(data.mediaType || "media")} &middot; ${escapeHtml(status)}</span><p>${escapeHtml(data.caption || "")}</p>${media}</div><div class="actions"><button data-id="${Number(item.id)}" data-status="approved"${approveCurrent ? ' class="is-current" disabled aria-current="true"' : ""}>${approveCurrent ? "Approved" : "Approve"}</button><button data-id="${Number(item.id)}" data-status="rejected" class="reject${rejectCurrent ? " is-current" : ""}"${rejectCurrent ? ' disabled aria-current="true"' : ""}>${rejectCurrent ? "Rejected" : "Reject"}</button></div></article>`;
    }).join("") : "<p>No submissions found.</p>";
  }

  async function load({ reportError = true } = {}) {
    try {
      const data = await request();
      submissions = Array.isArray(data.items) ? data.items : [];
      render();
      queueStatus.textContent = `${submissions.length} submissions`;
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
  queue.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-id]");
    if (!button || button.disabled) return;
    const nextStatus = button.dataset.status;
    const id = Number(button.dataset.id);
    const actionLabel = nextStatus === "approved" ? "Approve" : "Reject";
    button.disabled = true;
    button.textContent = nextStatus === "approved" ? "Approving…" : "Rejecting…";
    try {
      await request({
        method: "PATCH",
        body: JSON.stringify({ id, status: nextStatus }),
      });
      submissions = submissions.map((item) => Number(item.id) === id
        ? { ...item, data: { ...(item.data || {}), reviewStatus: nextStatus, reviewedAt: new Date().toISOString() } }
        : item);
      render();
      showToast(nextStatus === "approved" ? "Submission approved." : "Submission rejected.");
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
