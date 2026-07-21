import { parseSocialPostUrl } from "./social-embed.js";

export const GALLERY_STATES = new Set([
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
]);

const INCIDENT_TYPES = new Set([
  "protest-march", "lathi-charge", "tear-gas", "excessive-force", "water-cannon", "firing",
  "arrest-detention", "injury-response", "restriction-access", "aftermath", "other",
]);
const IMAGE_FORMATS = new Set(["jpg", "jpeg", "png", "webp"]);
const VIDEO_FORMATS = new Set(["mp4", "mov", "webm"]);
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const RETENTION_DAYS = 90;

export class SubmissionValidationError extends Error {}

function requiredText(value, maximum, label, minimum = 1) {
  const result = String(value || "").trim();
  if (result.length < minimum) throw new SubmissionValidationError(`${label} is required.`);
  if (result.length > maximum) throw new SubmissionValidationError(`${label} is too long.`);
  return result;
}

function optionalText(value, maximum, label) {
  const result = String(value || "").trim();
  if (result.length > maximum) throw new SubmissionValidationError(`${label} is too long.`);
  return result;
}

function sourceUrls(value) {
  const raw = optionalText(value, 1200, "Related source links");
  if (!raw) return [];
  const links = raw.split(/[\s,]+/).filter(Boolean);
  if (links.length > 8) throw new SubmissionValidationError("Add no more than eight source links.");
  return links.map((entry) => {
    try {
      const url = new URL(entry);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      return url.href;
    } catch {
      throw new SubmissionValidationError("Every related source must be a valid web link.");
    }
  });
}

function cleanIntegrity(value) {
  if (!value || typeof value !== "object") return null;
  const sha256 = /^[0-9a-f]{64}$/i.test(String(value.sha256 || "")) ? String(value.sha256).toLowerCase() : "";
  const perceptualHash = /^[0-9a-f]{64}$/i.test(String(value.perceptualHash || "")) ? String(value.perceptualHash).toLowerCase() : "";
  if (!sha256 && !perceptualHash) return null;
  return {
    sha256,
    perceptualHash,
    perceptualAlgorithm: perceptualHash ? "blockhash-core@0.1.0:bmvbhash-256-v1" : "",
    perceptualBits: perceptualHash ? 256 : null,
  };
}

function cleanDuplicateReview(value) {
  if (!value || typeof value !== "object") return null;
  const level = ["exact", "likely", "possible", "none", "unavailable", "video-review"].includes(String(value.level || ""))
    ? String(value.level)
    : "unavailable";
  return {
    level,
    candidateId: optionalText(value.candidateId, 120, "Duplicate candidate"),
    distance: Number.isFinite(Number(value.distance)) ? Math.max(0, Math.min(256, Number(value.distance))) : null,
    normalizedDistance: Number.isFinite(Number(value.normalizedDistance)) ? Math.max(0, Math.min(1, Number(value.normalizedDistance))) : null,
    reason: optionalText(value.reason, 200, "Duplicate review reason"),
    requiresManualReview: Boolean(value.requiresManualReview),
  };
}

function privateCloudinaryAsset(input, cloudName) {
  const resourceType = input.mediaType === "video" ? "video" : input.mediaType === "image" ? "image" : "";
  const expectedFormat = resourceType === "video" ? VIDEO_FORMATS : IMAGE_FORMATS;
  const format = String(input.format || "").toLowerCase();
  const publicId = String(input.publicId || "").trim();
  const version = Number(input.version);
  const bytes = Number(input.bytes);
  const maximumBytes = resourceType === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (!resourceType || !expectedFormat.has(format)) throw new SubmissionValidationError("The uploaded media format is not allowed.");
  if (!/^letsfixindia\/[A-Za-z0-9_/-]{4,220}$/.test(publicId) || publicId.includes("..")) throw new SubmissionValidationError("The uploaded media reference is invalid.");
  if (!Number.isSafeInteger(version) || version <= 0) throw new SubmissionValidationError("The uploaded media version is invalid.");
  if (!Number.isFinite(bytes) || bytes <= 0 || bytes > maximumBytes) throw new SubmissionValidationError("The uploaded media size is invalid.");

  let original;
  try { original = new URL(String(input.secureUrl || "")); } catch { throw new SubmissionValidationError("The uploaded media URL is invalid."); }
  const cloudPrefix = `/${cloudName}/${resourceType}/private/`;
  const expectedSuffix = `/v${version}/${publicId}.${format}`;
  let decodedPath = "";
  try { decodedPath = decodeURIComponent(original.pathname); } catch { /* Invalid percent encoding is rejected below. */ }
  if (original.protocol !== "https:" || original.hostname !== "res.cloudinary.com" || !original.pathname.startsWith(cloudPrefix) || !decodedPath.endsWith(expectedSuffix)) {
    throw new SubmissionValidationError("The uploaded media did not come from the private evidence store.");
  }

  const encodedPublicId = publicId.split("/").map(encodeURIComponent).join("/");
  const transformation = resourceType === "image" ? "f_auto,q_auto,c_limit,w_1800" : "q_auto:eco";
  const publicDerivative = `https://res.cloudinary.com/${encodeURIComponent(cloudName)}/${resourceType}/private/${transformation}/v${version}/${encodedPublicId}.${format}`;
  return {
    mediaType: resourceType,
    secureUrl: publicDerivative,
    publicId,
    resourceType,
    format,
    bytes,
    width: Number.isFinite(Number(input.width)) ? Number(input.width) : null,
    height: Number.isFinite(Number(input.height)) ? Number(input.height) : null,
    duration: Number.isFinite(Number(input.duration)) ? Number(input.duration) : null,
    privateOriginal: {
      secureUrl: original.href,
      publicId,
      resourceType,
      format,
      version,
      deliveryType: "private",
    },
  };
}

export function normalizeGallerySubmission(input, { cloudName, now = new Date() }) {
  const kind = String(input.submissionKind || "");
  if (!["social-link", "original-media"].includes(kind)) throw new SubmissionValidationError("Choose a submission type.");
  if (input.rightsConfirmed !== true) throw new SubmissionValidationError("Confirm the submission before sending it.");

  const recordedDate = requiredText(input.recordedDate, 10, "Date recorded");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(recordedDate) || Number.isNaN(Date.parse(`${recordedDate}T00:00:00Z`))) {
    throw new SubmissionValidationError("Date recorded is invalid.");
  }
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  if (recordedDate > today) throw new SubmissionValidationError("Date recorded cannot be in the future.");

  const state = requiredText(input.state, 80, "State or union territory");
  if (!GALLERY_STATES.has(state)) throw new SubmissionValidationError("Choose a valid state or union territory.");
  const incidentType = requiredText(input.incidentType, 80, "Incident type");
  if (!INCIDENT_TYPES.has(incidentType)) throw new SubmissionValidationError("Choose a valid incident type.");

  const caption = requiredText(input.caption, 600, "What happened", 12);
  const location = optionalText(input.location, 120, "Place");
  const credit = optionalText(input.credit, 100, "Public credit") || "Anonymous contributor";
  const socialHandle = optionalText(input.socialHandle, 80, "Social media handle");
  const contactPhone = optionalText(input.contactPhone, 24, "Phone number");
  if (contactPhone && !/^[+0-9() -]{7,24}$/.test(contactPhone)) throw new SubmissionValidationError("Phone number is invalid.");
  const links = sourceUrls(input.sourceUrl);

  let media;
  if (kind === "social-link") {
    const social = parseSocialPostUrl(input.externalUrl);
    if (!social) throw new SubmissionValidationError("Use a public Instagram, X/Twitter, or YouTube post link.");
    media = {
      mediaType: "embed",
      externalUrl: social.canonicalUrl,
      embedPlatform: social.platform,
      publicId: `social-${social.platform}-${social.id}`,
    };
  } else {
    if (!cloudName) throw new SubmissionValidationError("Private media storage is not configured.");
    media = privateCloudinaryAsset(input, cloudName);
  }

  const deleteAfter = new Date(now.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  return {
    submissionType: kind === "social-link" ? "gallery-link" : "gallery-media",
    submissionKind: kind,
    reviewStatus: "pending",
    ...media,
    eventTitle: caption,
    recordedDate,
    state,
    incidentType,
    location,
    caption,
    credit,
    socialHandle,
    contactPhone,
    sourceUrl: links.join("\n"),
    sourceUrls: links,
    rightsConfirmed: true,
    integrity: kind === "original-media" ? cleanIntegrity(input.integrity) : null,
    duplicateReview: kind === "original-media" ? cleanDuplicateReview(input.duplicateReview) : null,
    submittedAt: now.toISOString(),
    retention: kind === "original-media" ? {
      policy: "private-original-90-days",
      deleteAfter,
      legalHold: false,
    } : null,
  };
}
