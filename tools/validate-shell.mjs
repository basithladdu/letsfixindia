import fs from "node:fs";
import path from "node:path";
import { MARKUP_PARTS, composeParts, composeShell } from "./compose-shell.mjs";

const workspace = process.cwd();
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(workspace, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function assertFile(relativePath) {
  assert(fs.existsSync(path.join(workspace, relativePath)), `Missing ${relativePath}`);
}

function assertMirror(relativePath) {
  const publicPath = path.join("public", relativePath);
  assertFile(relativePath);
  assertFile(publicPath);
  if (fs.existsSync(path.join(workspace, relativePath)) && fs.existsSync(path.join(workspace, publicPath))) {
    assert(read(relativePath) === read(publicPath), `Mirror drift: ${relativePath}`);
  }
}

function listFiles(relativeDirectory) {
  const absoluteDirectory = path.join(workspace, relativeDirectory);
  if (!fs.existsSync(absoluteDirectory)) return [];
  return fs.readdirSync(absoluteDirectory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(relativeDirectory, entry.name);
    return entry.isDirectory() ? listFiles(relativePath) : [relativePath];
  });
}

const expectedMarkup = composeParts(workspace, MARKUP_PARTS);
const composedDocument = composeShell(workspace);
const spaRoutes = read(path.join("src", "pages", "[...route].astro"));

assert(read("shell/app-markup.html") === expectedMarkup, "shell/app-markup.html is stale; run npm run compose:shell");
assert(read("public/shell/app-markup.html") === expectedMarkup, "public/shell/app-markup.html is stale; run npm run compose:shell");
assert(/^<!doctype html>/i.test(composedDocument), "Composed document is missing its doctype");
assert(/<main\b[^>]*\bid=["']top["']/i.test(composedDocument), "Composed document is missing main#top");
assert(/<\/body>\s*<\/html>\s*$/i.test(composedDocument), "Composed document is missing closing body/html tags");
assert(
  /params:\s*\{\s*route:\s*undefined\s*\}/.test(spaRoutes),
  "Astro SPA routes must explicitly generate the root / path"
);

const ids = [...composedDocument.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
assert(duplicateIds.length === 0, `Duplicate static IDs: ${duplicateIds.join(", ")}`);

for (const directory of ["styles", "gallery", "scripts/app", "routes", "shell", "vendor/blockhash"]) {
  for (const relativePath of listFiles(directory)) {
    assertMirror(relativePath);
  }
}

for (const relativePath of [
  "index.html",
  "404.html",
  "app.js",
  "styles.css",
  "gallery.css",
  "contact.css",
  "explorers.css",
  "statistics.css",
  "gallery.js",
  "gallery-deduplication.js",
  "state-explorer.js",
  "statistics.js",
  "shell-loader.js"
]) {
  assertMirror(relativePath);
}

for (const manifestPath of ["styles.css", "gallery.css"]) {
  for (const match of read(manifestPath).matchAll(/@import\s+url\(["']?([^"')]+)["']?\)/gi)) {
    const importedPath = match[1].split("?")[0].replace(/^\//, "");
    assertFile(importedPath);
    assertFile(path.join("public", importedPath));
  }
}

for (const match of read("shell/scripts.html").matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)) {
  if (/^https?:\/\//i.test(match[1])) continue;
  const scriptPath = match[1].split("?")[0].replace(/^\//, "");
  assertFile(scriptPath);
  assertFile(path.join("public", scriptPath));
}

assert(read("index.html") === read("404.html"), "Root index.html and 404.html differ");
assert(read("public/index.html") === read("public/404.html"), "Public index.html and 404.html differ");

if (failures.length) {
  console.error(`Shell validation failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Shell validation passed: ${MARKUP_PARTS.length} fragments, ${ids.length} static IDs, mirrors and local dependencies aligned.`);
