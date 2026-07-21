import fs from "node:fs";
import path from "node:path";

const workspace = process.cwd();

function readLines(relativePath, expectedCount) {
  const absolutePath = path.join(workspace, relativePath);
  const source = fs.readFileSync(absolutePath, "utf8");
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  const finalNewline = source.endsWith("\n") || source.endsWith("\r");
  const lines = source.split(/\r\n|\n|\r/);
  if (finalNewline) lines.pop();
  if (lines.length !== expectedCount) {
    throw new Error(`${relativePath} has ${lines.length} lines; expected checkpoint baseline ${expectedCount}.`);
  }
  return { source, lines, eol, finalNewline };
}

function sliceText(file, start, end) {
  const text = file.lines.slice(start - 1, end).join(file.eol);
  return `${text}${end < file.lines.length || file.finalNewline ? file.eol : ""}`;
}

function write(relativePath, contents) {
  const absolutePath = path.join(workspace, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, contents, "utf8");
}

function splitExact({ sourcePath, expectedCount, chunks, manifest, publicManifest }) {
  const file = readLines(sourcePath, expectedCount);
  const transferred = [];
  for (const chunk of chunks) {
    const contents = sliceText(file, chunk.start, chunk.end);
    write(chunk.path, contents);
    write(path.join("public", chunk.path), contents);
    transferred.push(contents);
  }
  const recombined = transferred.join("");
  if (recombined !== file.source) {
    throw new Error(`${sourcePath} split did not recombine byte-for-byte.`);
  }
  write(sourcePath, manifest);
  write(publicManifest, manifest);
}

const styles = [
  { path: "styles/01-foundation.css", start: 1, end: 801 },
  { path: "styles/02-records-and-data.css", start: 802, end: 1570 },
  { path: "styles/03-responsive-and-shell.css", start: 1571, end: 2672 },
  { path: "styles/04-voices-and-timeline-motion.css", start: 2673, end: 3395 },
  { path: "styles/05-sharing-and-support.css", start: 3396, end: 4006 },
  { path: "styles/06-splash-and-charts.css", start: 4007, end: 4613 },
  { path: "styles/07-contact-and-interactions.css", start: 4614, end: 5186 },
  { path: "styles/08-submit-and-filter-fixes.css", start: 5187, end: 5476 }
];

const styleManifest = `/* Ordered CSS manifest. The numbered files preserve the checkpoint cascade exactly. */
${styles.map((chunk) => `@import url("/${chunk.path}");`).join("\n")}
`;

splitExact({
  sourcePath: "styles.css",
  expectedCount: 5476,
  chunks: styles,
  manifest: styleManifest,
  publicManifest: "public/styles.css"
});

const scripts = [
  { path: "scripts/app/01-core.js", start: 1, end: 664 },
  { path: "scripts/app/02-timeline-and-charts.js", start: 665, end: 948 },
  { path: "scripts/app/03-statistics-and-sources.js", start: 949, end: 1152 },
  { path: "scripts/app/04-sharing-and-records.js", start: 1153, end: 1366 },
  { path: "scripts/app/05-router-and-tenure.js", start: 1367, end: 1698 },
  { path: "scripts/app/06-submissions-and-voices.js", start: 1699, end: 1955 },
  { path: "scripts/app/07-interactions.js", start: 1956, end: 2433 },
  { path: "scripts/app/08-bootstrap.js", start: 2434, end: 2554 }
];

const appFile = readLines("app.js", 2555);
const appChunks = scripts.map((chunk) => {
  const contents = sliceText(appFile, chunk.start, chunk.end);
  write(chunk.path, contents);
  write(path.join("public", chunk.path), contents);
  return contents;
});
const appBoot = sliceText(appFile, 2555, 2555);
if (`${appChunks.join("")}${appBoot}` !== appFile.source) {
  throw new Error("app.js split did not recombine byte-for-byte.");
}
write("app.js", appBoot);
write("public/app.js", appBoot);

console.log(`Split ${styles.length} ordered CSS chunks and ${scripts.length} ordered JavaScript chunks.`);
