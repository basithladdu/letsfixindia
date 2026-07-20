import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedKinds = new Set(["correction", "source", "event", "outcome"]);

function allowedOrigins() {
  return new Set((Deno.env.get("ALLOWED_ORIGINS") || "").split(",").map((origin) => origin.trim()).filter(Boolean));
}

function headers(origin?: string | null) {
  const originAllowed = origin && allowedOrigins().has(origin);
  return {
    "content-type": "application/json; charset=utf-8",
    "vary": "Origin",
    ...(originAllowed ? { "access-control-allow-origin": origin } : {}),
  };
}

function response(status: number, body: Record<string, string>, origin?: string | null) {
  return new Response(JSON.stringify(body), { status, headers: headers(origin) });
}

function stringField(value: unknown, maximum: number, required = false) {
  if (typeof value !== "string") return required ? null : "";
  const trimmed = value.trim();
  if ((required && !trimmed) || trimmed.length > maximum) return null;
  return trimmed;
}

async function hashRequest(ip: string) {
  const salt = Deno.env.get("SUBMISSION_RATE_LIMIT_SALT");
  if (!salt) return null;
  const bytes = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function verifyTurnstile(token: string, ip: string) {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) return false;
  const form = new FormData();
  form.set("secret", secret);
  form.set("response", token);
  if (ip) form.set("remoteip", ip);
  const verification = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  const result = await verification.json();
  return result.success === true;
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  const origins = allowedOrigins();
  if (request.method === "OPTIONS") {
    if (!origin || !origins.has(origin)) return response(403, { error: "Origin not allowed" }, origin);
    return new Response(null, { headers: { ...headers(origin), "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type" } });
  }
  if (request.method !== "POST" || !origin || !origins.has(origin)) return response(403, { error: "Origin not allowed" }, origin);

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return response(400, { error: "Invalid JSON" }, origin); }
  const kind = stringField(body.kind, 30, true);
  const subject = stringField(body.subject, 180, true);
  const message = stringField(body.message, 5000, true);
  const sources = stringField(body.sources, 5000, true);
  const token = stringField(body.turnstileToken, 4096, true);
  const name = stringField(body.name, 100);
  const email = stringField(body.email, 254);
  const recordId = stringField(body.recordId, 180);
  const urls = (sources || "").split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
  if (!kind || !allowedKinds.has(kind) || !subject || !message || !sources || !token || message.length < 30 || !urls.length || urls.some((url) => !/^https:\/\//i.test(url))) {
    return response(422, { error: "Provide a clear request and one or more HTTPS source URLs." }, origin);
  }
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return response(422, { error: "Email is invalid." }, origin);

  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  const requestHash = await hashRequest(ip);
  if (!requestHash || !await verifyTurnstile(token, ip)) return response(403, { error: "Verification failed. Please try again." }, origin);

  const client = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");
  const recent = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count, error: limitError } = await client.from("letsfixindia_submissions").select("id", { count: "exact", head: true }).eq("request_hash", requestHash).gte("created_at", recent);
  if (limitError) return response(500, { error: "Unable to validate submission" }, origin);
  if ((count || 0) >= 3) return response(429, { error: "Too many requests. Please try again later." }, origin);

  const { error } = await client.from("letsfixindia_submissions").insert({ data: { kind, subject, message, sources: urls, name, email, recordId }, status: "pending", request_hash: requestHash });
  if (error) return response(500, { error: "Unable to store submission" }, origin);
  return response(201, { ok: "Submission received" }, origin);
});
