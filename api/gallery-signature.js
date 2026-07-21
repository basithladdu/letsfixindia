import crypto from "node:crypto";

const MAX_AGE_SECONDS = 300;
const requestCounts = new Map();

function json(response, status, body) {
  response.status(status).setHeader("cache-control", "no-store").json(body);
}

export default function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("allow", "POST");
    return json(response, 405, { error: "Method not allowed." });
  }

  const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || "").trim();
  const apiKey = String(process.env.CLOUDINARY_API_KEY || "").trim();
  const apiSecret = String(process.env.CLOUDINARY_API_SECRET || "").trim();
  const uploadPreset = String(process.env.CLOUDINARY_UPLOAD_PRESET || "").trim();
  const folder = "letsfixindia";

  const ip = String(request.headers["x-forwarded-for"] || request.headers["x-real-ip"] || "unknown").split(",")[0].trim();
  const now = Date.now();
  const record = requestCounts.get(ip) || { count: 0, since: now };
  if (now - record.since > 10 * 60 * 1000) { record.count = 0; record.since = now; }
  if (record.count >= 30) return json(response, 429, { error: "Too many upload requests. Try again later." });
  record.count += 1;
  requestCounts.set(ip, record);

  if (!cloudName || !apiKey || !apiSecret || !uploadPreset) {
    return json(response, 503, { error: "Secure media uploads are not configured." });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const parameters = new URLSearchParams({ folder, timestamp: String(timestamp), upload_preset: uploadPreset });
  const signature = crypto.createHash("sha1").update(`${parameters.toString()}${apiSecret}`).digest("hex");

  return json(response, 200, {
    signature,
    timestamp,
    apiKey,
    cloudName,
    folder,
    uploadPreset,
    expiresIn: MAX_AGE_SECONDS,
  });
}
