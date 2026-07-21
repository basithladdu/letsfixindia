import crypto from "node:crypto";
import {
  clientIp,
  consumeWindow,
  contentLengthWithin,
  readJsonBody,
  requestIsSameSite,
  sendJson,
} from "../lib/request-guard.js";

const MAX_AGE_SECONDS = 300;

function cloudinarySignature(parameters, secret) {
  const payload = Object.entries(parameters)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return crypto.createHash("sha1").update(`${payload}${secret}`).digest("hex");
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("allow", "POST");
    return sendJson(response, 405, { error: "Method not allowed." });
  }
  if (!requestIsSameSite(request)) return sendJson(response, 403, { error: "Cross-site upload requests are blocked." });
  if (!contentLengthWithin(request, 2048)) return sendJson(response, 413, { error: "Upload request is too large." });

  const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || "").trim();
  const apiKey = String(process.env.CLOUDINARY_API_KEY || "").trim();
  const apiSecret = String(process.env.CLOUDINARY_API_SECRET || "").trim();
  const uploadPreset = String(process.env.CLOUDINARY_UPLOAD_PRESET || "").trim();
  const folder = "letsfixindia";

  const rate = consumeWindow(`gallery-signature:${clientIp(request)}`, { maximum: 6, windowMs: 10 * 60 * 1000 });
  if (!rate.allowed) return sendJson(response, 429, { error: "Too many upload requests. Try again later." }, { "retry-after": rate.retryAfterSeconds });

  if (!cloudName || !apiKey || !apiSecret || !uploadPreset) {
    return sendJson(response, 503, { error: "Secure media uploads are not configured." });
  }

  const body = await readJsonBody(request);
  if (String(body.website || "").trim()) return sendJson(response, 202, { ok: true });
  const elapsed = Date.now() - Number(body.startedAt);
  if (!Number.isFinite(elapsed) || elapsed < 800 || elapsed > 4 * 60 * 60 * 1000) {
    return sendJson(response, 400, { error: "Restart the form and submit again." });
  }
  if (!["image", "video"].includes(String(body.mediaType || ""))) {
    return sendJson(response, 422, { error: "Unsupported media type." });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const deliveryType = "private";
  const resourceType = String(body.mediaType);
  const allowedFormats = resourceType === "video" ? "mp4,mov,webm" : "jpg,jpeg,png,webp";
  const publicId = `${folder}/${timestamp}-${crypto.randomBytes(8).toString("hex")}`;
  const parameters = {
    allowed_formats: allowedFormats,
    asset_folder: folder,
    public_id: publicId,
    timestamp: String(timestamp),
    upload_preset: uploadPreset,
  };
  const signature = cloudinarySignature(parameters, apiSecret);

  return sendJson(response, 200, {
    signature,
    timestamp,
    apiKey,
    cloudName,
    assetFolder: folder,
    publicId,
    uploadPreset,
    deliveryType,
    resourceType,
    allowedFormats,
    expiresIn: MAX_AGE_SECONDS,
  });
}
