import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { composeShell, writeRuntimeMarkup } from "./compose-shell.mjs";

const workspaceRoot = process.cwd();
const serveSource = process.argv.includes("--source");
const publicRoot = path.join(workspaceRoot, "public");
const root = !serveSource && fs.existsSync(path.join(workspaceRoot, "dist"))
  ? path.join(workspaceRoot, "dist")
  : workspaceRoot;
const port = Number(process.argv[2] || 5178);
const host = "127.0.0.1";

if (serveSource) {
  writeRuntimeMarkup(workspaceRoot);
}

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

function resolveUrl(url) {
  const parsed = new URL(url, `http://${host}:${port}`);
  const safePath = path.normalize(decodeURIComponent(parsed.pathname)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(root, safePath === "\\" || safePath === "/" ? "index.html" : safePath);
  return filePath.startsWith(root) ? filePath : path.join(root, "index.html");
}

http.createServer((request, response) => {
  const requestPathname = new URL(request.url || "/", `http://${host}:${port}`).pathname;
  const isRouteRequest = !path.extname(requestPathname);

  if (serveSource && isRouteRequest) {
    try {
      response.writeHead(200, { "content-type": types[".html"] });
      response.end(composeShell(workspaceRoot));
    } catch (error) {
      response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      response.end(`Unable to compose source shell: ${error.message}`);
    }
    return;
  }

  let filePath = resolveUrl(request.url || "/");
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    const directoryIndex = path.join(filePath, "index.html");
    filePath = fs.existsSync(directoryIndex) ? directoryIndex : path.join(root, "index.html");
  }

  if (!fs.existsSync(filePath) && serveSource) {
    const relativePath = path.relative(root, filePath);
    const publicPath = path.resolve(publicRoot, relativePath);
    if (!relativePath.startsWith("..") && publicPath.startsWith(publicRoot) && fs.existsSync(publicPath)) {
      filePath = publicPath;
    }
  }

  if (!fs.existsSync(filePath) && isRouteRequest) {
    filePath = path.join(root, "index.html");
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
    response.writeHead(200, { "content-type": types[path.extname(filePath)] || "application/octet-stream" });
    response.end(data);
  });
}).listen(port, host, () => {
  console.log(`http://${host}:${port}/ (${serveSource ? "source" : path.basename(root)})`);
});
