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

  function render(items) {
    queue.innerHTML = items.length ? items.map((item) => {
      const data = item.data || {};
      const mediaUrl = trustedMediaUrl(data.secureUrl);
      const media = mediaUrl
        ? `<a href="${escapeHtml(mediaUrl)}" target="_blank" rel="noopener noreferrer">Open media</a>`
        : "No valid media URL";
      const status = ["approved", "rejected"].includes(data.reviewStatus) ? data.reviewStatus : "pending";
      const approveCurrent = status === "approved";
      const rejectCurrent = status === "rejected";
      return `<article class="submission"><div><strong>${escapeHtml(data.eventTitle || data.caption || "Untitled submission")}</strong><span>${escapeHtml(data.state || "State unknown")} &middot; ${escapeHtml(data.mediaType || "media")} &middot; ${escapeHtml(status)}</span><p>${escapeHtml(data.caption || "")}</p>${media}</div><div class="actions"><button data-id="${Number(item.id)}" data-status="approved"${approveCurrent ? ' class="is-current" disabled aria-current="true"' : ""}>${approveCurrent ? "Approved" : "Approve"}</button><button data-id="${Number(item.id)}" data-status="rejected" class="reject${rejectCurrent ? " is-current" : ""}"${rejectCurrent ? ' disabled aria-current="true"' : ""}>${rejectCurrent ? "Rejected" : "Reject"}</button></div></article>`;
    }).join("") : "<p>No submissions found.</p>";
  }

  async function load() {
    try {
      const data = await request();
      render(data.items || []);
      queueStatus.textContent = `${(data.items || []).length} submissions`;
    } catch (error) {
      queueStatus.textContent = serviceMessage(error);
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
    const actionLabel = nextStatus === "approved" ? "Approve" : "Reject";
    button.disabled = true;
    button.textContent = nextStatus === "approved" ? "Approving…" : "Rejecting…";
    try {
      await request({
        method: "PATCH",
        body: JSON.stringify({ id: Number(button.dataset.id), status: nextStatus }),
      });
      await load();
      showToast(nextStatus === "approved" ? "Submission approved." : "Submission rejected.");
    } catch (error) {
      const message = serviceMessage(error);
      queueStatus.textContent = message;
      showToast(message, "error");
      button.textContent = actionLabel;
      button.disabled = false;
    }
  });
})();
