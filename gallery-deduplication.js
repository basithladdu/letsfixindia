(() => {
  "use strict";

  const BLOCKHASH_BITS = 16;
  const HASH_BITS = BLOCKHASH_BITS * BLOCKHASH_BITS;
  const MAX_SAMPLE_EDGE = 512;
  const LIKELY_DISTANCE = 13;
  const POSSIBLE_DISTANCE = 26;
  const PERCEPTUAL_ALGORITHM = "blockhash-core@0.1.0:bmvbhash-256-v1";
  const HEX_COUNTS = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4];

  function toHex(bytes) {
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function normalizeHex(value) {
    const hex = String(value || "").trim().toLowerCase();
    return /^[0-9a-f]+$/.test(hex) ? hex : "";
  }

  function hammingDistance(leftValue, rightValue) {
    const left = normalizeHex(leftValue);
    const right = normalizeHex(rightValue);
    if (!left || left.length !== right.length) return null;

    let distance = 0;
    for (let index = 0; index < left.length; index += 1) {
      distance += HEX_COUNTS[parseInt(left[index], 16) ^ parseInt(right[index], 16)];
    }
    return distance;
  }

  async function exactHash(file) {
    if (!window.crypto?.subtle) throw new Error("Secure browser hashing is unavailable.");
    const digest = await window.crypto.subtle.digest("SHA-256", await file.arrayBuffer());
    return toHex(new Uint8Array(digest));
  }

  async function decodeImage(file) {
    if (typeof window.createImageBitmap === "function") {
      try {
        return await window.createImageBitmap(file, { imageOrientation: "from-image" });
      } catch {
        return window.createImageBitmap(file);
      }
    }

    const objectUrl = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.decoding = "async";
      image.src = objectUrl;
      if (image.decode) await image.decode();
      else await new Promise((resolve, reject) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", () => reject(new Error("The image could not be decoded.")), { once: true });
      });
      return image;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  async function imageDataForHash(file) {
    const source = await decodeImage(file);
    try {
      const sourceWidth = Number(source.width || source.naturalWidth);
      const sourceHeight = Number(source.height || source.naturalHeight);
      if (!sourceWidth || !sourceHeight) throw new Error("The image has no readable dimensions.");

      const downscale = Math.min(1, MAX_SAMPLE_EDGE / Math.max(sourceWidth, sourceHeight));
      const width = Math.min(MAX_SAMPLE_EDGE, Math.max(BLOCKHASH_BITS, Math.round(sourceWidth * downscale)));
      const height = Math.min(MAX_SAMPLE_EDGE, Math.max(BLOCKHASH_BITS, Math.round(sourceHeight * downscale)));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: false, willReadFrequently: true });
      if (!context) throw new Error("The browser could not prepare the image fingerprint.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(source, 0, 0, width, height);
      return context.getImageData(0, 0, width, height);
    } finally {
      source.close?.();
    }
  }

  async function fingerprintImage(file) {
    if (!file?.type?.startsWith("image/")) throw new Error("Perceptual hashing only accepts images.");
    if (!window.BlockhashCore?.bmvbhash) throw new Error("The image fingerprint library did not load.");

    const [sha256, imageData] = await Promise.all([exactHash(file), imageDataForHash(file)]);
    const perceptualHash = window.BlockhashCore.bmvbhash(imageData, BLOCKHASH_BITS);
    if (perceptualHash.length * 4 !== HASH_BITS) throw new Error("The image fingerprint had an unexpected length.");

    return {
      sha256,
      perceptualHash,
      perceptualAlgorithm: PERCEPTUAL_ALGORITHM,
      perceptualBits: HASH_BITS,
    };
  }

  function candidateIntegrity(candidate) {
    const integrity = candidate?.integrity || {};
    return {
      id: String(candidate?.id || candidate?.publicId || "").trim(),
      sha256: normalizeHex(integrity.sha256 || candidate?.sha256),
      perceptualHash: normalizeHex(integrity.perceptualHash || candidate?.perceptualHash),
      perceptualAlgorithm: String(integrity.perceptualAlgorithm || candidate?.perceptualAlgorithm || ""),
    };
  }

  function compareFingerprint(fingerprint, candidates = []) {
    const references = candidates.map(candidateIntegrity).filter((candidate) => candidate.sha256 || candidate.perceptualHash);
    const exact = references.find((candidate) => candidate.sha256 && candidate.sha256 === fingerprint.sha256);
    if (exact) return { level: "exact", candidateId: exact.id, distance: 0, normalizedDistance: 0 };

    let nearest = null;
    for (const candidate of references) {
      if (!candidate.perceptualHash) continue;
      if (candidate.perceptualAlgorithm && candidate.perceptualAlgorithm !== fingerprint.perceptualAlgorithm) continue;
      const distance = hammingDistance(fingerprint.perceptualHash, candidate.perceptualHash);
      if (distance === null || (nearest && distance >= nearest.distance)) continue;
      nearest = { candidateId: candidate.id, distance, normalizedDistance: distance / HASH_BITS };
    }

    if (!nearest) return { level: "none", candidateId: "", distance: null, normalizedDistance: null };
    if (nearest.distance <= LIKELY_DISTANCE) return { level: "likely", ...nearest };
    if (nearest.distance <= POSSIBLE_DISTANCE) return { level: "possible", ...nearest };
    return { level: "none", ...nearest };
  }

  window.LetsFixIndiaGalleryDedup = {
    fingerprintImage,
    compareFingerprint,
    hammingDistance,
    constants: {
      hashBits: HASH_BITS,
      likelyDistance: LIKELY_DISTANCE,
      possibleDistance: POSSIBLE_DISTANCE,
      perceptualAlgorithm: PERCEPTUAL_ALGORITHM,
    },
  };
})();
