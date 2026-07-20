export const prerender = true;

export function GET() {
  return new Response("User-agent: *\nAllow: /\nSitemap: https://www.letsfixindia.com/sitemap.xml\n", {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
