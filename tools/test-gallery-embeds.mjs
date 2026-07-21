import assert from "node:assert/strict";
import { parseSocialPostUrl } from "../lib/social-embed.js";

await import("../gallery-embeds.js");
const browserParse = globalThis.LetsFixIndiaEmbeds?.parse;
assert.equal(typeof browserParse, "function", "browser social parser is available");

const accepted = [
  [
    "https://x.com/Cockroachisback/status/2079443179527684502?s=20",
    "x",
    "https://x.com/Cockroachisback/status/2079443179527684502",
  ],
  [
    "https://www.instagram.com/reel/Da-M4OvJvTK/?utm_source=ig_web_copy_link&igsh=tracking",
    "instagram",
    "https://www.instagram.com/reel/Da-M4OvJvTK/",
  ],
  [
    "https://youtu.be/M7lc1UVf-VE?t=20",
    "youtube",
    "https://www.youtube.com/watch?v=M7lc1UVf-VE",
  ],
  [
    "https://www.youtube.com/shorts/M7lc1UVf-VE",
    "youtube",
    "https://www.youtube.com/watch?v=M7lc1UVf-VE",
  ],
];

for (const [input, platform, canonicalUrl] of accepted) {
  const server = parseSocialPostUrl(input);
  const browser = browserParse(input);
  assert.equal(server?.platform, platform);
  assert.equal(server?.canonicalUrl, canonicalUrl);
  assert.deepEqual(browser, server, `browser and server normalize ${input} identically`);
}

const rejected = [
  "javascript:alert(1)",
  "http://x.com/user/status/2079443179527684502",
  "https://x.com.evil.example/user/status/2079443179527684502",
  "https://instagram.com/profile-only",
  "https://youtube.com/watch?v=too-short",
  "https://example.com/video/123",
];

for (const input of rejected) {
  assert.equal(parseSocialPostUrl(input), null, `server rejects ${input}`);
  assert.equal(browserParse(input), null, `browser rejects ${input}`);
}

console.log(`Gallery embed validation passed: ${accepted.length} accepted and ${rejected.length} rejected URLs.`);
