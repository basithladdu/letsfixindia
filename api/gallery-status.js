import {
  clientIp,
  consumeWindow,
  contentLengthWithin,
  opaqueHash,
  readJsonBody,
  requestIsSameSite,
  safeEqual,
  sendJson,
} from "../lib/request-guard.js";

function text(value, maximum) {
  return String(value || "").trim().slice(0, maximum);
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("allow", "POST");
    return sendJson(response, 405, { error: "Method not allowed." });
  }
  if (!requestIsSameSite(request)) return sendJson(response, 403, { error: "Cross-site requests are blocked." });
  if (!contentLengthWithin(request, 4 * 1024)) return sendJson(response, 413, { error: "Request is too large." });

  const base = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "");
  if (!base || !key) return sendJson(response, 503, { error: "Submission status is temporarily unavailable." });

  const ipHash = opaqueHash(clientIp(request), key);
  const limit = consumeWindow(`gallery-status:${ipHash}`, { maximum: 12, windowMs: 15 * 60 * 1000 });
  if (!limit.allowed) return sendJson(response, 429, { error: "Too many status checks. Try again later." }, { "retry-after": limit.retryAfterSeconds });

  try {
    const input = await readJsonBody(request);
    const reference = String(input.reference || "").trim().toUpperCase();
    const phrase = String(input.recoveryPhrase || "").trim().toLowerCase().replace(/\s+/g, " ");
    if (!/^LFI-\d{8}-[A-F0-9]{8}$/.test(reference) || phrase.length < 20 || phrase.length > 100) {
      return sendJson(response, 404, { error: "Reference number or recovery phrase is incorrect." });
    }

    const url = new URL(`${base}/rest/v1/letsfixindia_submissions`);
    url.searchParams.set("select", "id,created_at,data");
    url.searchParams.set("data->>reference", `eq.${reference}`);
    url.searchParams.set("limit", "1");
    const upstream = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    const rows = await upstream.json().catch(() => []);
    const row = rows[0];
    const expected = row?.data?.recoveryHash || "";
    if (!upstream.ok || !row || !safeEqual(opaqueHash(phrase, key), expected)) {
      return sendJson(response, 404, { error: "Reference number or recovery phrase is incorrect." });
    }

    return sendJson(response, 200, {
      reference,
      status: ["pending", "approved", "rejected"].includes(row.data.reviewStatus) ? row.data.reviewStatus : "pending",
      submittedAt: text(row.data.submittedAt || row.created_at, 40),
      title: text(row.data.eventTitle || row.data.caption, 120),
      mediaKind: row.data.submissionKind === "social-link" ? "Public post" : "Original media",
    });
  } catch (error) {
    console.error("Gallery status error:", error);
    return sendJson(response, 503, { error: "Submission status did not respond. Try again." });
  }
}
