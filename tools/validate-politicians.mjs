import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const workspace = process.cwd();
const failures = [];
const fail = (message) => failures.push(message);
const rootPath = (...parts) => path.join(workspace, ...parts);
const read = (...parts) => fs.readFileSync(rootPath(...parts));
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const isHttps = (value) => typeof value === "string" && /^https:\/\/[^\s]+$/i.test(value);
const isNonNegativeInteger = (value) => Number.isInteger(value) && value >= 0;

function jpegDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    if (marker === 0xd9 || marker === 0xda) break;
    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2 || offset + length + 2 > buffer.length) return null;
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += length + 2;
  }
  return null;
}

const dataBuffer = read("data", "politicians.json");
const publicDataBuffer = read("public", "data", "politicians.json");
if (!dataBuffer.equals(publicDataBuffer)) fail("data/politicians.json does not match its public mirror");

let data;
try {
  data = JSON.parse(dataBuffer.toString("utf8"));
} catch (error) {
  fail(`data/politicians.json is invalid JSON: ${error.message}`);
}

const expectedIds = [
  "narendra-modi",
  "raj-nath-singh",
  "amit-shah",
  "nitin-gadkari",
  "shivraj-singh-chouhan",
  "manohar-lal",
  "hd-kumaraswamy",
  "piyush-goyal",
];

if (data) {
  if (data.schemaVersion !== 1) fail("politician schemaVersion must be 1");
  if (data.route !== "/who-runs-india") fail("politician route must be /who-runs-india");
  if (!isHttps(data.roleSnapshot?.url)) fail("role snapshot must have an HTTPS source URL");
  if (data.roleSnapshot?.asOf !== "2026-07-25") fail("role snapshot must retain the audited 2026-07-25 date");
  if (!Array.isArray(data.profiles) || data.profiles.length !== 8) fail("politician dataset must contain exactly 8 selected profiles");

  const ids = new Set();
  const photoNames = new Set();
  for (const profile of data.profiles || []) {
    const label = profile?.id || "profile-without-id";
    if (!expectedIds.includes(profile.id)) fail(`${label}: unexpected profile id`);
    if (ids.has(profile.id)) fail(`${label}: duplicate profile id`);
    ids.add(profile.id);

    for (const field of ["name", "role", "party", "partyCode", "constituency", "state", "educationCategory", "educationDetail", "selfProfession"]) {
      if (typeof profile[field] !== "string" || !profile[field].trim()) fail(`${label}: ${field} must be a non-empty string`);
    }
    for (const field of ["cabinetOrder", "affidavitAge", "declaredAssetsInr", "declaredLiabilitiesInr", "declaredCriminalCases"]) {
      if (!isNonNegativeInteger(profile[field])) fail(`${label}: ${field} must be a finite non-negative integer`);
    }
    if (!isHttps(profile.affidavitUrl) || !/^https:\/\/www\.myneta\.info\/LokSabha2024\/candidate\.php\?candidate_id=\d+$/.test(profile.affidavitUrl)) {
      fail(`${label}: affidavitUrl must be an exact HTTPS MyNeta Lok Sabha 2024 candidate page`);
    }

    const measurements = profile.bodyMeasurements || {};
    const heightMissing = measurements.heightCm == null;
    const weightMissing = measurements.weightKg == null;
    if (heightMissing !== weightMissing) fail(`${label}: height and weight must be published together or both remain null`);
    if (measurements.bmi !== null) fail(`${label}: BMI must not be stored; the UI calculates it only from published height and weight`);
    if (heightMissing && (measurements.status !== "not-publicly-documented" || measurements.sourceUrl !== null)) {
      fail(`${label}: missing measurements must keep the not-publicly-documented status and null source`);
    }
    if (!heightMissing) {
      if (!Number.isFinite(measurements.heightCm) || measurements.heightCm <= 0) fail(`${label}: published height must be a positive number`);
      if (!Number.isFinite(measurements.weightKg) || measurements.weightKg <= 0) fail(`${label}: published weight must be a positive number`);
      if (measurements.status !== "published-measurements" || !isHttps(measurements.sourceUrl)) {
        fail(`${label}: published measurements require status and an HTTPS source`);
      }
    }

    const photo = profile.photo || {};
    const expectedPhotoPath = `/assets/politicians/${profile.id}.jpg`;
    if (photo.path !== expectedPhotoPath) fail(`${label}: photo path must be ${expectedPhotoPath}`);
    for (const field of ["sourceUrl", "licenseUrl"]) {
      if (!isHttps(photo[field])) fail(`${label}: photo ${field} must be HTTPS`);
    }
    for (const field of ["author", "license"]) {
      if (typeof photo[field] !== "string" || !photo[field].trim()) fail(`${label}: photo ${field} is required`);
    }

    const filename = `${profile.id}.jpg`;
    photoNames.add(filename);
    const canonicalPhoto = rootPath("assets", "politicians", filename);
    const publicPhoto = rootPath("public", "assets", "politicians", filename);
    if (!fs.existsSync(canonicalPhoto) || !fs.existsSync(publicPhoto)) {
      fail(`${label}: canonical and public portrait files are required`);
    } else {
      const canonicalBuffer = fs.readFileSync(canonicalPhoto);
      const publicBuffer = fs.readFileSync(publicPhoto);
      if (!canonicalBuffer.equals(publicBuffer)) fail(`${label}: portrait does not match its public mirror`);
      const dimensions = jpegDimensions(canonicalBuffer);
      if (!dimensions || dimensions.width <= 0 || dimensions.height <= 0) fail(`${label}: portrait is not a readable JPEG`);
    }
  }

  for (const id of expectedIds) {
    if (!ids.has(id)) fail(`missing expected profile: ${id}`);
  }
  for (const base of [rootPath("assets", "politicians"), rootPath("public", "assets", "politicians")]) {
    const files = fs.readdirSync(base).filter((name) => fs.statSync(path.join(base, name)).isFile()).sort();
    const expected = [...photoNames].sort();
    if (files.join("|") !== expected.join("|")) fail(`${path.relative(workspace, base)} must contain exactly the 8 declared portraits`);
  }
}

for (const [canonical, mirror] of [
  ["routes/who-runs-india.html", "public/routes/who-runs-india.html"],
  ["scripts/app/09-who-runs-india.js", "public/scripts/app/09-who-runs-india.js"],
  ["styles/11-who-runs-india.css", "public/styles/11-who-runs-india.css"],
  ["sitemap.xml", "public/sitemap.xml"],
]) {
  const left = read(...canonical.split("/"));
  const right = read(...mirror.split("/"));
  if (sha256(left) !== sha256(right)) fail(`${canonical} does not match ${mirror}`);
}

if (failures.length) {
  console.error(`Politician route validation failed with ${failures.length} problem${failures.length === 1 ? "" : "s"}:`);
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log(`Politician route validation passed: ${data.profiles.length} sourced profiles, ${data.profiles.length} mirrored portraits, BMI coverage 0/${data.profiles.length}.`);
