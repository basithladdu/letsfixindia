import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const MARKUP_PARTS = [
  "shell/navigation.html",
  "routes/timeline-intro.html",
  "routes/statistics.html",
  "routes/map.html",
  "routes/sources.html",
  "routes/gallery.html",
  "routes/timeline-list.html",
  "routes/submit.html",
  "routes/contact.html",
  "routes/methodology.html",
  "routes/about.html",
  "routes/voices.html",
  "routes/media-map.html",
  "routes/faq.html",
  "routes/support.html",
  "routes/partner.html",
  "routes/donors.html",
  "routes/record-shell.html",
  "shell/footer-and-overlays.html"
];

export const DOCUMENT_PARTS = [
  "shell/document-start.html",
  ...MARKUP_PARTS,
  "shell/scripts.html",
  "shell/mobile-progress.html",
  "shell/document-end.html"
];

export function composeParts(workspace, parts) {
  return parts.map((relativePath) => fs.readFileSync(path.join(workspace, relativePath), "utf8")).join("");
}

export function composeShell(workspace) {
  return composeParts(workspace, DOCUMENT_PARTS);
}

export function writeRuntimeMarkup(workspace) {
  const markup = composeParts(workspace, MARKUP_PARTS);
  for (const relativePath of ["shell/app-markup.html", "public/shell/app-markup.html"]) {
    const destination = path.join(workspace, relativePath);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, markup, "utf8");
  }
  for (const relativePath of ["scripts/app/01-core.js", "scripts/app/05-router-and-tenure.js", "scripts/app/08-bootstrap.js", "scripts/app/09-media-map.js", "styles/10-media-map.css", "data/media-groups.json", "data/media-outlets.json", "data/media-people.json", "data/media-connections.json"]) {
    fs.copyFileSync(path.join(workspace, relativePath), path.join(workspace, "public", relativePath));
  }
  return markup;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const workspace = process.cwd();
  const markup = writeRuntimeMarkup(workspace);
  console.log(`Composed ${MARKUP_PARTS.length} route fragments into ${markup.split(/\r\n|\n|\r/).length} runtime markup lines.`);
}
