import crypto from "node:crypto";
import { normalizeGallerySubmission, SubmissionValidationError } from "../lib/gallery-submission.js";
import {
  clientIp,
  consumeWindow,
  contentLengthWithin,
  opaqueHash,
  readJsonBody,
  requestIsSameSite,
  sendJson,
} from "../lib/request-guard.js";

const RECOVERY_WORDS = [
  "amber", "anchor", "apricot", "arch", "ashoka", "atlas", "bamboo", "beacon",
  "banyan", "basil", "bay", "birch", "blue", "brass", "brick", "brook",
  "cedar", "chai", "cinder", "civic", "clay", "cloud", "cobalt", "coral",
  "dawn", "delta", "drum", "dune", "earth", "echo", "elm", "falcon",
  "fern", "field", "flame", "flint", "forest", "ganga", "glass", "harbour",
  "indigo", "iris", "jasmine", "kaveri", "lake", "lotus", "mango", "marble",
  "monsoon", "moss", "narmada", "neem", "ocean", "olive", "orchid", "paper",
  "pearl", "pepper", "pine", "river", "rose", "saffron", "salt", "sand",
  "silver", "sky", "stone", "sunrise", "teak", "terra", "tulip", "valley",
  "violet", "wheat", "willow", "wind", "yamuna", "zinc",
];

function configuration() {
  return {
    base: String(process.env.SUPABASE_URL || "").replace(/\/$/, ""),
    key: String(process.env.SUPABASE_SERVICE_ROLE_KEY || ""),
    cloudName: String(process.env.CLOUDINARY_CLOUD_NAME || "").trim(),
  };
}

function recoveryPhrase() {
  return Array.from({ length: 6 }, () => RECOVERY_WORDS[crypto.randomInt(RECOVERY_WORDS.length)]).join(" ");
}

function referenceNumber(now) {
  const day = now.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomBytes(5).toString("hex").toUpperCase().slice(0, 8);
  return `LFI-${day}-${suffix}`;
}

async function submissionCount({ base, key, ipHash, since }) {
  const url = new URL(`${base}/rest/v1/letsfixindia_submissions`);
  url.searchParams.set("select", "id");
  url.searchParams.set("data->abuse->>ipHash", `eq.${ipHash}`);
  url.searchParams.set("created_at", `gte.${since.toISOString()}`);
  url.searchParams.set("limit", "1");
  const response = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "count=exact",
      Range: "0-0",
    },
  });
  if (!response.ok) throw new Error("Unable to check the submission limit.");
  const range = String(response.headers.get("content-range") || "");
  const count = Number(range.split("/")[1]);
  return Number.isFinite(count) ? count : 0;
}

async function insertSubmission({ base, key, data }) {
  const response = await fetch(`${base}/rest/v1/letsfixindia_submissions?select=id`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "content-type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify([{ data }]),
  });
  const rows = await response.json().catch(() => []);
  if (!response.ok || !rows[0]?.id) throw new Error("The editor queue did not accept the submission.");
  return Number(rows[0].id);
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("allow", "POST");
    return sendJson(response, 405, { error: "Method not allowed." });
  }
  if (!requestIsSameSite(request)) return sendJson(response, 403, { error: "Cross-site submissions are blocked." });
  if (!contentLengthWithin(request, 32 * 1024)) return sendJson(response, 413, { error: "Submission details are too large." });

  const config = configuration();
  if (!config.base || !config.key || !config.cloudName) {
    return sendJson(response, 503, { error: "The editor queue is temporarily unavailable." });
  }

  const ipHash = opaqueHash(clientIp(request), config.key);
  const burst = consumeWindow(`gallery-submit:${ipHash}`, { maximum: 6, windowMs: 10 * 60 * 1000 });
  if (!burst.allowed) {
    return sendJson(response, 429, { error: "Too many submissions. Try again later." }, { "retry-after": burst.retryAfterSeconds });
  }

  try {
    const input = await readJsonBody(request);
    if (String(input.website || "").trim()) return sendJson(response, 202, { ok: true });
    const startedAt = Number(input.startedAt);
    const elapsed = Date.now() - startedAt;
    if (!Number.isFinite(startedAt) || elapsed < 800 || elapsed > 4 * 60 * 60 * 1000) {
      return sendJson(response, 400, { error: "Restart the form and submit again." });
    }

    const now = new Date();
    const [recentCount, dailyCount] = await Promise.all([
      submissionCount({ ...config, ipHash, since: new Date(now.getTime() - 10 * 60 * 1000) }),
      submissionCount({ ...config, ipHash, since: new Date(now.getTime() - 24 * 60 * 60 * 1000) }),
    ]);
    if (recentCount >= 5 || dailyCount >= 20) {
      return sendJson(response, 429, { error: "Submission limit reached. Try again later." }, { "retry-after": recentCount >= 5 ? 600 : 3600 });
    }

    const normalized = normalizeGallerySubmission(input, { cloudName: config.cloudName, now });
    const reference = referenceNumber(now);
    const phrase = recoveryPhrase();
    normalized.reference = reference;
    normalized.recoveryHash = opaqueHash(phrase.toLowerCase(), config.key);
    normalized.abuse = { ipHash };
    const id = await insertSubmission({ ...config, data: normalized });
    return sendJson(response, 202, {
      ok: true,
      id,
      reference,
      recoveryPhrase: phrase,
      statusPath: `/gallery/submission/${encodeURIComponent(reference)}`,
    });
  } catch (error) {
    if (error instanceof SubmissionValidationError) return sendJson(response, 422, { error: error.message });
    console.error("Gallery submission error:", error);
    return sendJson(response, 503, { error: "The editor queue did not respond. Try again." });
  }
}
