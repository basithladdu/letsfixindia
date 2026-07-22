import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import handler from "../api/admin.js";

process.env.GALLERY_ADMIN_PASSWORD = "test-only-admin-password";
process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
process.env.CLOUDINARY_API_KEY = "test-api-key";
process.env.CLOUDINARY_API_SECRET = "test-api-secret";

function adminCookie() {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto.createHmac("sha256", process.env.GALLERY_ADMIN_PASSWORD).update(String(timestamp)).digest("hex");
  return `letsfixindia_admin=${timestamp}.${signature}`;
}

function request(method, body = {}) {
  return { method, body, headers: { cookie: adminCookie() } };
}

function response() {
  return {
    statusCode: 200,
    headers: {},
    payload: null,
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; return this; },
    json(value) { this.payload = value; return this; },
  };
}

const originalFetch = globalThis.fetch;
try {
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), method: options.method || "GET" });
    if (String(url).includes("letsfixindia_submissions?id=eq.42&select=id,data")) {
      return new Response(JSON.stringify([{ id: 42, data: { privateOriginal: { publicId: "letsfixindia/test-asset", resourceType: "video" } } }]), { status: 200 });
    }
    if (String(url).includes("api.cloudinary.com")) return new Response(JSON.stringify({ result: "ok" }), { status: 200 });
    if (String(url).includes("letsfixindia_submissions?id=eq.42") && options.method === "DELETE") return new Response(null, { status: 204 });
    throw new Error(`Unexpected request: ${url}`);
  };

  const deleteResponse = response();
  await handler(request("DELETE", { id: 42 }), deleteResponse);
  assert.equal(deleteResponse.statusCode, 200);
  assert.deepEqual(deleteResponse.payload, { ok: true, id: 42, cloudinaryDeleted: true });
  assert.equal(calls.filter((call) => call.url.includes("api.cloudinary.com")).length, 1);
  assert.equal(calls.at(-1).method, "DELETE");

  const unauthorized = response();
  await handler({ method: "DELETE", body: { id: 42 }, headers: {} }, unauthorized);
  assert.equal(unauthorized.statusCode, 401);

  const adminSource = fs.readFileSync(new URL("../public/admin/admin.js", import.meta.url), "utf8");
  assert.match(adminSource, /controlslist="nodownload noremoteplayback"/);
  assert.doesNotMatch(adminSource, /download=/i);
  assert.match(adminSource, /Cloudinary asset/);
  assert.match(adminSource, /Private original URL/);
  assert.match(adminSource, /Public ID/);
  assert.match(adminSource, /Submitted details/);
  assert.match(adminSource, /Raw stored record/);
  assert.match(adminSource, /data-copy-value/);
  assert.match(adminSource, /data-copy-record/);
  assert.match(adminSource, /Undo approval/);
  assert.match(adminSource, /Undo rejection/);
  assert.match(adminSource, /data-action="delete"/);
  console.log("Admin moderation tests passed: complete record details, Cloudinary references, reversible statuses, filters, and deletion.");
} finally {
  globalThis.fetch = originalFetch;
}
