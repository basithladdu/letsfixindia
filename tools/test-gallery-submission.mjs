import assert from "node:assert/strict";
import { normalizeGallerySubmission, SubmissionValidationError } from "../lib/gallery-submission.js";
import { consumeWindow } from "../lib/request-guard.js";

const now = new Date("2026-07-22T10:00:00.000Z");
const common = {
  recordedDate: "2026-07-22",
  state: "Delhi",
  incidentType: "protest-march",
  caption: "Police officers dispersed a seated protest after a warning.",
  location: "",
  credit: "Anonymous",
  socialHandle: "",
  contactPhone: "",
  sourceUrl: "",
  rightsConfirmed: true,
};

const social = normalizeGallerySubmission({
  ...common,
  submissionKind: "social-link",
  externalUrl: "https://x.com/example/status/2079443179527684502?s=20",
}, { cloudName: "gprec", now });
assert.equal(social.location, "", "Place must be optional");
assert.equal(social.externalUrl, "https://x.com/example/status/2079443179527684502");
assert.equal(social.reviewStatus, "pending");

assert.doesNotThrow(() => normalizeGallerySubmission({
  ...common,
  recordedDate: "2026-07-22",
  submissionKind: "social-link",
  externalUrl: "https://x.com/example/status/2079443179527684502",
}, { cloudName: "gprec", now: new Date("2026-07-21T20:00:00.000Z") }), "India's current date must not be rejected during the UTC previous day");

const media = normalizeGallerySubmission({
  ...common,
  submissionKind: "original-media",
  mediaType: "image",
  secureUrl: "https://res.cloudinary.com/gprec/image/private/v1784714400/letsfixindia/sample.jpg",
  publicId: "letsfixindia/sample",
  resourceType: "image",
  format: "jpg",
  bytes: 123456,
  width: 1200,
  height: 900,
  version: 1784714400,
  integrity: { sha256: "a".repeat(64), perceptualHash: "b".repeat(64) },
}, { cloudName: "gprec", now });
assert.match(media.secureUrl, /\/image\/private\/f_auto,q_auto,c_limit,w_1800\/v1784714400\//);
assert.equal(media.privateOriginal.deliveryType, "private");
assert.equal(media.retention.policy, "private-original-90-days");

assert.throws(() => normalizeGallerySubmission({
  ...common,
  submissionKind: "original-media",
  mediaType: "image",
  secureUrl: "https://res.cloudinary.com/gprec/image/upload/v1784714400/letsfixindia/sample.jpg",
  publicId: "letsfixindia/sample",
  format: "jpg",
  bytes: 123456,
  version: 1784714400,
}, { cloudName: "gprec", now }), SubmissionValidationError, "Public originals must be rejected");

assert.throws(() => normalizeGallerySubmission({
  ...common,
  submissionKind: "social-link",
  externalUrl: "https://example.com/not-a-supported-post",
}, { cloudName: "gprec", now }), SubmissionValidationError);

assert.throws(() => normalizeGallerySubmission({
  ...common,
  rightsConfirmed: false,
  submissionKind: "social-link",
  externalUrl: "https://x.com/example/status/2079443179527684502",
}, { cloudName: "gprec", now }), SubmissionValidationError);

const rateKey = `gallery-test-${Date.now()}`;
for (let attempt = 0; attempt < 6; attempt += 1) {
  assert.equal(consumeWindow(rateKey, { maximum: 6, windowMs: 600_000 }).allowed, true);
}
const blocked = consumeWindow(rateKey, { maximum: 6, windowMs: 600_000 });
assert.equal(blocked.allowed, false, "The seventh request in ten minutes must be rate limited");
assert.ok(blocked.retryAfterSeconds > 0);

console.log("Gallery submission tests passed: validation, private originals, EXIF-safe derivatives, and burst rate limiting.");
