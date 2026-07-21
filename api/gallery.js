import { parseSocialPostUrl } from "../lib/social-embed.js";

function send(response, status, body) {
  response.status(status).setHeader("cache-control", "no-store").json(body);
}

function text(value, maximum) {
  return String(value || "").trim().slice(0, maximum);
}

function trustedMediaUrl(value, cloudName) {
  try {
    const url = new URL(String(value || ""));
    const prefix = `/${cloudName}/`;
    const isLegacyUpload = url.pathname.startsWith(`${prefix}image/upload/`) || url.pathname.startsWith(`${prefix}video/upload/`);
    const isPrivateDerivative = new RegExp(`^/${cloudName}/(image|video)/private/[^/]+/v\\d+/`).test(url.pathname);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com" && (isLegacyUpload || isPrivateDerivative) ? url.href : "";
  } catch {
    return "";
  }
}

function publicItem(row, cloudName) {
  const data = row?.data || {};
  const secureUrl = trustedMediaUrl(data.secureUrl, cloudName);
  const socialPost = parseSocialPostUrl(data.externalUrl);
  if (data.reviewStatus !== "approved" || (!secureUrl && !socialPost)) return null;
  return {
    id: `submission-${Number(row.id)}`,
    reviewStatus: "approved",
    mediaType: socialPost ? "embed" : data.mediaType === "video" ? "video" : "image",
    secureUrl,
    externalUrl: socialPost?.canonicalUrl || "",
    embedPlatform: socialPost?.platform || "",
    eventTitle: text(data.eventTitle || data.caption, 600),
    caption: text(data.caption, 600),
    recordedDate: text(data.recordedDate, 10),
    state: text(data.state, 80),
    location: text(data.location, 120),
    incidentType: text(data.incidentType, 80),
    credit: text(data.credit || "Anonymous contributor", 100) || "Anonymous contributor",
    socialHandle: text(data.socialHandle, 80),
    publishedAt: text(data.reviewedAt || row.created_at, 40),
  };
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("allow", "GET");
    return send(response, 405, { error: "Method not allowed." });
  }

  const base = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "");
  const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || "").trim();
  if (!base || !key || !cloudName) return send(response, 503, { error: "The approved gallery is temporarily unavailable." });

  try {
    const url = new URL(`${base}/rest/v1/letsfixindia_submissions`);
    url.searchParams.set("select", "id,created_at,data");
    url.searchParams.set("data->>reviewStatus", "eq.approved");
    url.searchParams.set("order", "created_at.desc");
    const upstream = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    const rows = await upstream.json().catch(() => []);
    if (!upstream.ok) throw new Error("Supabase gallery request failed.");
    response
      .status(200)
      .setHeader("cache-control", "public, max-age=0, s-maxage=15, stale-while-revalidate=45")
      .json({ items: rows.map((row) => publicItem(row, cloudName)).filter(Boolean) });
    return;
  } catch (error) {
    console.error("Public gallery error:", error);
    return send(response, 503, { error: "The approved gallery is temporarily unavailable." });
  }
}
