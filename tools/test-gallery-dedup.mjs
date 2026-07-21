import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const workspace = process.cwd();
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(workspace, "vendor/blockhash/blockhash-core.js"), "utf8"), sandbox);
vm.runInContext(fs.readFileSync(path.join(workspace, "gallery-deduplication.js"), "utf8"), sandbox);

const blockhash = sandbox.window.BlockhashCore;
const deduplication = sandbox.window.LetsFixIndiaGalleryDedup;
assert.equal(typeof blockhash?.bmvbhash, "function", "Blockhash browser global was not created");
assert.equal(typeof deduplication?.compareFingerprint, "function", "Gallery duplicate API was not created");

const pixels = new Uint8ClampedArray(16 * 16 * 4);
for (let index = 0; index < pixels.length; index += 4) {
  pixels[index] = (index / 4) % 256;
  pixels[index + 1] = 128;
  pixels[index + 2] = 255 - pixels[index];
  pixels[index + 3] = 255;
}
const sampleHash = blockhash.bmvbhash({ width: 16, height: 16, data: pixels }, 16);
assert.match(sampleHash, /^[0-9a-f]{64}$/, "Blockhash should return a 256-bit hexadecimal fingerprint");

const zeroHash = "0".repeat(64);
const sha256 = "a".repeat(64);
const fingerprint = {
  sha256,
  perceptualHash: zeroHash,
  perceptualAlgorithm: deduplication.constants.perceptualAlgorithm,
};

assert.equal(deduplication.hammingDistance(zeroHash, zeroHash), 0);
assert.equal(deduplication.hammingDistance("0", "f"), 4);
assert.equal(deduplication.hammingDistance("0", "not-a-hash"), null);

assert.equal(
  deduplication.compareFingerprint(fingerprint, [{ id: "exact", integrity: { sha256 } }]).level,
  "exact"
);
assert.equal(
  deduplication.compareFingerprint(fingerprint, [{ id: "likely", integrity: { perceptualHash: `1${"0".repeat(63)}` } }]).level,
  "likely"
);
assert.equal(
  deduplication.compareFingerprint(fingerprint, [{ id: "possible", integrity: { perceptualHash: `${"f".repeat(4)}${"0".repeat(60)}` } }]).level,
  "possible"
);
assert.equal(
  deduplication.compareFingerprint(fingerprint, [{ id: "different", integrity: { perceptualHash: "f".repeat(64) } }]).level,
  "none"
);

console.log("Gallery duplicate-screening tests passed: SHA-256 exact matching, 256-bit Blockhash, and Hamming-distance tiers.");
