import fs from "node:fs";

const readJson = (file) => JSON.parse(fs.readFileSync(new URL(`../data/${file}`, import.meta.url), "utf8"));
const events = readJson("events.json");
const indicators = readJson("indicators.json");
const voices = readJson("voices.json");
const researchBacklog = readJson("research_backlog.json");
const sourceMap = readJson("sources.json");
const sources = Array.isArray(sourceMap) ? Object.fromEntries(sourceMap.map((source) => [source.id, source])) : sourceMap;

const references = [
  ...events.flatMap((item) => item.sources || []),
  ...indicators.flatMap((item) => item.sources || []),
  ...voices.flatMap((item) => (item.stances || []).flatMap((stance) => stance.sources || []))
];
const publicReferenced = new Set(references);
const backlogReferences = researchBacklog.flatMap((item) => item.sourceKeys || []);
const referenced = new Set([...references, ...backlogReferences]);
const missing = [...new Set(references.filter((id) => !sources[id]))];
const malformed = Object.entries(sources)
  .filter(([, source]) => source.url && !/^https?:\/\//i.test(source.url))
  .map(([id]) => id);
const orphaned = Object.keys(sources).filter((id) => !referenced.has(id));
const orphanedPending = orphaned.filter((id) => !sources[id].url);
const orphanedLinked = orphaned.filter((id) => sources[id].url);
const pendingIds = Object.entries(sources).filter(([, source]) => !source.url).map(([id]) => id);

console.log(`[AUDIT] ${events.length} events, ${indicators.length} indicators, ${voices.length} voices`);
console.log(`[AUDIT] ${Object.keys(sources).length} sources; ${publicReferenced.size} public references; ${backlogReferences.length} backlog references; ${pendingIds.length} pending URLs; ${orphaned.length} unreferenced (${orphanedPending.length} pending placeholders, ${orphanedLinked.length} linked URLs)`);
if (pendingIds.length) console.log(`[PENDING] ${pendingIds.join(", ")}`);
if (orphanedPending.length) console.log(`[UNREFERENCED_PENDING] ${orphanedPending.join(", ")}`);
if (orphanedLinked.length) console.log(`[UNREFERENCED_LINKED] ${orphanedLinked.join(", ")}`);
if (missing.length) console.error(`[ERROR] Missing source IDs: ${missing.join(", ")}`);
if (malformed.length) console.error(`[ERROR] Malformed source URLs: ${malformed.join(", ")}`);
if (missing.length || malformed.length) process.exitCode = 1;
