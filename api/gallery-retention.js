import crypto from "node:crypto";
import { safeEqual, sendJson } from "../lib/request-guard.js";

function cloudinarySignature(parameters, secret) {
  const payload = Object.entries(parameters)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return crypto.createHash("sha1").update(`${payload}${secret}`).digest("hex");
}

async function destroyPrivateOriginal(original, config) {
  const timestamp = Math.floor(Date.now() / 1000);
  const parameters = {
    invalidate: "true",
    public_id: original.publicId,
    timestamp: String(timestamp),
    type: "private",
  };
  const body = new URLSearchParams({
    ...parameters,
    api_key: config.apiKey,
    signature: cloudinarySignature(parameters, config.apiSecret),
  });
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/${original.resourceType}/destroy`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !["ok", "not found"].includes(result.result)) throw new Error("Private original deletion failed.");
}

async function updateRow(id, data, config) {
  const response = await fetch(`${config.base}/rest/v1/letsfixindia_submissions?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: config.serviceKey,
      Authorization: `Bearer ${config.serviceKey}`,
      "content-type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ data }),
  });
  if (!response.ok) throw new Error("Retention record update failed.");
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("allow", "GET");
    return sendJson(response, 405, { error: "Method not allowed." });
  }

  const configuredSecret = String(process.env.CRON_SECRET || "");
  const suppliedSecret = String(request.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!configuredSecret || !safeEqual(suppliedSecret, configuredSecret)) return sendJson(response, 401, { error: "Unauthorized." });

  const config = {
    base: String(process.env.SUPABASE_URL || "").replace(/\/$/, ""),
    serviceKey: String(process.env.SUPABASE_SERVICE_ROLE_KEY || ""),
    cloudName: String(process.env.CLOUDINARY_CLOUD_NAME || ""),
    apiKey: String(process.env.CLOUDINARY_API_KEY || ""),
    apiSecret: String(process.env.CLOUDINARY_API_SECRET || ""),
  };
  if (Object.values(config).some((value) => !value)) return sendJson(response, 503, { error: "Retention cleanup is not configured." });

  try {
    const url = new URL(`${config.base}/rest/v1/letsfixindia_submissions`);
    url.searchParams.set("select", "id,data");
    url.searchParams.set("data->>reviewStatus", "in.(pending,rejected)");
    url.searchParams.set("order", "created_at.asc");
    url.searchParams.set("limit", "100");
    const upstream = await fetch(url, { headers: { apikey: config.serviceKey, Authorization: `Bearer ${config.serviceKey}` } });
    const rows = await upstream.json().catch(() => []);
    if (!upstream.ok) throw new Error("Retention queue lookup failed.");

    const now = new Date();
    const expired = rows.filter((row) => {
      const deleteAfter = new Date(row?.data?.retention?.deleteAfter || "");
      return row?.data?.privateOriginal?.publicId && !Number.isNaN(deleteAfter.getTime()) && deleteAfter <= now;
    });
    let removed = 0;
    for (const row of expired) {
      await destroyPrivateOriginal(row.data.privateOriginal, config);
      const data = {
        ...row.data,
        privateOriginal: null,
        retention: {
          ...row.data.retention,
          deletedAt: now.toISOString(),
          deletionStatus: "private-original-deleted",
        },
      };
      await updateRow(row.id, data, config);
      removed += 1;
    }
    return sendJson(response, 200, { ok: true, checked: rows.length, removed });
  } catch (error) {
    console.error("Gallery retention cleanup error:", error);
    return sendJson(response, 503, { error: "Retention cleanup did not complete." });
  }
}
