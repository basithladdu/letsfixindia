import crypto from "node:crypto";

const windows = new Map();

export function sendJson(response, status, body, headers = {}) {
  response.status(status);
  response.setHeader("cache-control", "no-store");
  Object.entries(headers).forEach(([name, value]) => response.setHeader(name, value));
  return response.json(body);
}

export function clientIp(request) {
  const forwarded = request.headers["x-vercel-forwarded-for"]
    || request.headers["x-forwarded-for"]
    || request.headers["x-real-ip"]
    || "unknown";
  return String(forwarded).split(",")[0].trim().slice(0, 128) || "unknown";
}

export function requestIsSameSite(request) {
  const fetchSite = String(request.headers["sec-fetch-site"] || "").toLowerCase();
  if (fetchSite === "cross-site") return false;

  const origin = String(request.headers.origin || "").trim();
  if (!origin) return true;
  try {
    const originHost = new URL(origin).host.toLowerCase();
    const requestHost = String(request.headers["x-forwarded-host"] || request.headers.host || "").split(",")[0].trim().toLowerCase();
    return Boolean(requestHost) && originHost === requestHost;
  } catch {
    return false;
  }
}

export function contentLengthWithin(request, maximumBytes) {
  const raw = String(request.headers["content-length"] || "");
  if (!raw) return true;
  const length = Number(raw);
  return Number.isFinite(length) && length >= 0 && length <= maximumBytes;
}

export async function readJsonBody(request) {
  if (request.body && typeof request.body === "object") return request.body;
  if (typeof request.body === "string") {
    try { return JSON.parse(request.body); } catch { return {}; }
  }
  return new Promise((resolve) => {
    let raw = "";
    request.on("data", (chunk) => { raw += chunk; });
    request.on("end", () => {
      try { resolve(JSON.parse(raw || "{}")); } catch { resolve({}); }
    });
  });
}

export function consumeWindow(key, { maximum, windowMs }) {
  const now = Date.now();
  const record = windows.get(key) || { count: 0, since: now };
  if (now - record.since >= windowMs) {
    record.count = 0;
    record.since = now;
  }
  record.count += 1;
  windows.set(key, record);

  if (windows.size > 5000) {
    for (const [entryKey, entry] of windows) {
      if (now - entry.since >= windowMs) windows.delete(entryKey);
    }
  }

  return {
    allowed: record.count <= maximum,
    retryAfterSeconds: Math.max(1, Math.ceil((record.since + windowMs - now) / 1000)),
  };
}

export function opaqueHash(value, secret) {
  return crypto.createHmac("sha256", String(secret || "")).update(String(value || "")).digest("hex");
}

export function safeEqual(left, right) {
  const a = Buffer.from(String(left || ""));
  const b = Buffer.from(String(right || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
