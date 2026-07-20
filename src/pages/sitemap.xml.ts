import { events } from "../lib/records.js";

export const prerender = true;

export function GET() {
  const urls = ["/", "/hi/", "/timeline", "/statistics", "/sources", "/voices", "/methodology", "/about", "/faq", "/contact", "/support"]
    .concat(events.map((event) => `/record/${event.id}/`));
  const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>https://www.letsfixindia.com${url}</loc></url>`).join("")}</urlset>`;
  return new Response(body, { headers: { "content-type": "application/xml; charset=utf-8" } });
}
