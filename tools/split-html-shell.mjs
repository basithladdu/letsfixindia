import fs from "node:fs";
import path from "node:path";

const workspace = process.cwd();
const sourcePath = path.join(workspace, "index.html");
const source = fs.readFileSync(sourcePath, "utf8");
const eol = source.includes("\r\n") ? "\r\n" : "\n";
const finalNewline = source.endsWith("\n") || source.endsWith("\r");
const lines = source.split(/\r\n|\n|\r/);
if (finalNewline) lines.pop();

if (lines.length !== 1146) {
  throw new Error(`index.html has ${lines.length} lines; expected post-checkpoint shell baseline 1146.`);
}

function sliceText(start, end) {
  const text = lines.slice(start - 1, end).join(eol);
  return `${text}${end < lines.length || finalNewline ? eol : ""}`;
}

function write(relativePath, contents, mirrorPublic = true) {
  const absolutePath = path.join(workspace, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, contents, "utf8");
  if (mirrorPublic) {
    const publicPath = path.join(workspace, "public", relativePath);
    fs.mkdirSync(path.dirname(publicPath), { recursive: true });
    fs.writeFileSync(publicPath, contents, "utf8");
  }
}

const fragments = [
  { path: "shell/document-start.html", start: 1, end: 43 },
  { path: "shell/navigation.html", start: 44, end: 147 },
  { path: "routes/timeline-intro.html", start: 148, end: 243 },
  { path: "routes/statistics.html", start: 244, end: 303 },
  { path: "routes/map.html", start: 304, end: 347 },
  { path: "routes/sources.html", start: 348, end: 363 },
  { path: "routes/gallery.html", start: 364, end: 501 },
  { path: "routes/timeline-list.html", start: 502, end: 511 },
  { path: "routes/submit.html", start: 512, end: 662 },
  { path: "routes/contact.html", start: 663, end: 728 },
  { path: "routes/methodology.html", start: 729, end: 774 },
  { path: "routes/about.html", start: 775, end: 823 },
  { path: "routes/voices.html", start: 824, end: 897 },
  { path: "routes/faq.html", start: 898, end: 993 },
  { path: "routes/support.html", start: 994, end: 1051 },
  { path: "routes/record-shell.html", start: 1052, end: 1065 },
  { path: "shell/footer-and-overlays.html", start: 1066, end: 1126 },
  { path: "shell/scripts.html", start: 1127, end: 1140 },
  { path: "shell/mobile-progress.html", start: 1141, end: 1144 },
  { path: "shell/document-end.html", start: 1145, end: 1146 }
];

const transferred = fragments.map((fragment) => {
  const contents = sliceText(fragment.start, fragment.end);
  write(fragment.path, contents);
  return contents;
});

if (transferred.join("") !== source) {
  throw new Error("HTML fragments did not recombine byte-for-byte to the source shell.");
}

const documentStart = transferred[0];
const loaderDocument = `${documentStart}    <noscript><div class="no-script-message">This archive needs JavaScript enabled to load its records and filters.</div></noscript>${eol}    <div id="shellLoaderStatus" class="shell-loader-status" role="status">Loading the public record…</div>${eol}    <script src="/shell-loader.js?v=1"></script>${eol}  </body>${eol}</html>${finalNewline ? eol : ""}`;

fs.writeFileSync(sourcePath, loaderDocument, "utf8");
fs.writeFileSync(path.join(workspace, "404.html"), loaderDocument, "utf8");
fs.writeFileSync(path.join(workspace, "public", "index.html"), loaderDocument, "utf8");
fs.writeFileSync(path.join(workspace, "public", "404.html"), loaderDocument, "utf8");

console.log(`Extracted ${fragments.length} ordered HTML fragments; index.html is now the source-mode loader shell.`);
