import fs from "node:fs";
import path from "node:path";
import events from "../data/events.json" with { type: "json" };

const read = (file) => fs.readFileSync(path.join("dist", file), "utf8");
const fail = (message) => {
  console.error(`[ERROR] ${message}`);
  process.exitCode = 1;
};

for (const [file, expected] of [
  ["index.html", "India, in the record."],
  ["timeline/index.html", "Find the event. Follow the evidence."],
  ["sources/index.html", "See what the record rests on."],
  ["sitemap.xml", "/record/"],
  ["robots.txt", "Sitemap:"],
]) {
  if (!fs.existsSync(path.join("dist", file))) fail(`Missing static output: ${file}`);
  else if (!read(file).includes(expected)) fail(`Static output ${file} does not contain its expected public content.`);
}

const recordCount = fs.readdirSync(path.join("dist", "record"), { withFileTypes: true }).filter((entry) => entry.isDirectory()).length;
if (recordCount !== events.length) fail(`Expected ${events.length} record pages, found ${recordCount}.`);
if (read("index.html").includes("app.js")) fail("Legacy JavaScript SPA is still referenced by the home page.");

if (!process.exitCode) console.log(`[SUCCESS] Verified ${recordCount} static record pages and core public routes.`);
