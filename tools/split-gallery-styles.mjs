import fs from "node:fs";
import path from "node:path";

const workspace = process.cwd();
const sourcePath = path.join(workspace, "gallery.css");
const source = fs.readFileSync(sourcePath, "utf8");

if (source.includes('@import url("/gallery/')) {
  console.log("Gallery stylesheet is already split.");
  process.exit(0);
}

const eol = source.includes("\r\n") ? "\r\n" : "\n";
const finalNewline = source.endsWith("\n") || source.endsWith("\r");
const lines = source.split(/\r\n|\n|\r/);
if (finalNewline) lines.pop();
if (lines.length !== 753) throw new Error(`gallery.css has ${lines.length} lines; expected 753.`);

const chunks = [
  { path: "gallery/feed.css", start: 1, end: 248 },
  { path: "gallery/intake.css", start: 249, end: 656 },
  { path: "gallery/responsive.css", start: 657, end: 753 }
];

function sliceText(start, end) {
  const text = lines.slice(start - 1, end).join(eol);
  return `${text}${end < lines.length || finalNewline ? eol : ""}`;
}

const transferred = chunks.map((chunk) => {
  const contents = sliceText(chunk.start, chunk.end);
  for (const prefix of ["", "public/"]) {
    const destination = path.join(workspace, `${prefix}${chunk.path}`);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, contents, "utf8");
  }
  return contents;
});

if (transferred.join("") !== source) throw new Error("Gallery CSS split did not recombine byte-for-byte.");

const manifest = `/* Ordered Gallery stylesheet manifest. */${eol}${chunks.map((chunk) => `@import url("/${chunk.path}");`).join(eol)}${eol}`;
fs.writeFileSync(sourcePath, manifest, "utf8");
fs.writeFileSync(path.join(workspace, "public", "gallery.css"), manifest, "utf8");
console.log(`Split Gallery styling into ${chunks.length} ownership files.`);
