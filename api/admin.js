import crypto from "node:crypto";

const COOKIE = "letsfixindia_admin";
const MAX_AGE = 8 * 60 * 60;
const loginAttempts = new Map();

class AdminServiceError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function send(res, status, body) {
  res.status(status).setHeader("cache-control", "no-store").json(body);
}

function adminPassword() {
  return String(process.env.GALLERY_ADMIN_PASSWORD || "");
}

function clientKey(req) {
  return String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown").split(",")[0].trim();
}

function sameSecret(left, right) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function tokenFor(timestamp) {
  return `${timestamp}.${crypto.createHmac("sha256", adminPassword()).update(String(timestamp)).digest("hex")}`;
}

function authorized(req) {
  const value = String(req.headers.cookie || "").split(";").map((item) => item.trim()).find((item) => item.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1) || "";
  const [timestamp, signature] = value.split(".");
  if (!timestamp || !signature || !/^\d+$/.test(timestamp) || Date.now() / 1000 - Number(timestamp) > MAX_AGE) return false;
  const expected = tokenFor(timestamp).split(".")[1];
  return signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

async function body(req) {
  if (req.body && typeof req.body === "object") return req.body;
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => { try { resolve(JSON.parse(raw || "{}")); } catch { resolve({}); } });
  });
}

async function supabaseFetch(path, options = {}) {
  const base = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "");
  if (!base || !key) throw new AdminServiceError("moderation_not_configured", "The moderation database is not connected.");
  const response = await fetch(`${base}/rest/v1/${path}`, { ...options, headers: { apikey: key, Authorization: `Bearer ${key}`, "content-type": "application/json", ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || "Supabase moderation request failed.");
  return data;
}

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const input = await body(req);
      if (input.action !== "login") return send(res, 400, { error: "Invalid admin action." });
      const supplied = String(input.password || "");
      const configured = adminPassword();
      if (!configured) return send(res, 503, { error: "Admin login is not configured.", code: "admin_password_not_configured" });
      const key = clientKey(req);
      const attempt = loginAttempts.get(key) || { count: 0, since: Date.now() };
      if (Date.now() - attempt.since > 15 * 60 * 1000) { attempt.count = 0; attempt.since = Date.now(); }
      if (attempt.count >= 5) return send(res, 429, { error: "Too many attempts. Try again later." });
      if (!configured || !sameSecret(supplied, configured)) { attempt.count += 1; loginAttempts.set(key, attempt); return send(res, 401, { error: "Invalid password." }); }
      loginAttempts.delete(key);
      const timestamp = Math.floor(Date.now() / 1000);
      const secure = process.env.VERCEL ? "; Secure" : "";
      res.setHeader("set-cookie", `${COOKIE}=${tokenFor(timestamp)}; Max-Age=${MAX_AGE}; Path=/; HttpOnly; SameSite=Strict${secure}`);
      return send(res, 200, { ok: true });
    }
    if (!authorized(req)) return send(res, 401, { error: "Admin login required." });
    if (req.method === "GET") {
      const rows = await supabaseFetch("letsfixindia_submissions?select=id,created_at,data&order=created_at.desc");
      return send(res, 200, { items: rows });
    }
    if (req.method === "PATCH") {
      const input = await body(req);
      const id = Number(input.id);
      const status = String(input.status || "");
      if (!Number.isInteger(id) || !["pending", "approved", "rejected"].includes(status)) return send(res, 400, { error: "Invalid moderation update." });
      const rows = await supabaseFetch(`letsfixindia_submissions?id=eq.${id}&select=data`);
      const data = rows[0]?.data || {};
      data.reviewStatus = status;
      data.reviewedAt = new Date().toISOString();
      await supabaseFetch(`letsfixindia_submissions?id=eq.${id}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ data }) });
      return send(res, 200, { ok: true, id, status });
    }
    res.setHeader("allow", "GET, POST, PATCH");
    return send(res, 405, { error: "Method not allowed." });
  } catch (error) {
    console.error("Admin moderation error:", error);
    if (error instanceof AdminServiceError) return send(res, 503, { error: error.message, code: error.code });
    return send(res, 503, { error: "The moderation database did not respond.", code: "moderation_request_failed" });
  }
}
