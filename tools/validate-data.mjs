import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const errors = [];

const events = readJson("data/events.json");
const sources = readJson("data/sources.json");
const voices = readJson("data/voices.json");
const sourceIds = new Set(Object.keys(sources));
const validStatuses = new Set([
  "Affidavit analysis", "Alleged", "Charged", "Convicted", "Court-tested", "Index",
  "Investigated", "Investigative analysis", "Official", "Official investigation",
  "Official proposal", "Official reversed", "Opposition claim", "Reported"
]);

const checkSources = (owner, sourceList, label) => {
  if (!Array.isArray(sourceList) || sourceList.length === 0) {
    errors.push(`${owner}: missing ${label}`);
    return;
  }
  for (const sourceId of sourceList) {
    if (!sourceIds.has(sourceId)) errors.push(`${owner}: unknown source ID ${sourceId}`);
  }
};

const eventIds = new Set();
for (const event of events) {
  if (!event.id) errors.push("event: missing id");
  if (eventIds.has(event.id)) errors.push(`event ${event.id}: duplicate id`);
  eventIds.add(event.id);
  if (!event.title?.trim()) errors.push(`${event.id}: empty title`);
  if (!event.summary?.trim()) errors.push(`${event.id}: empty summary`);
  if (!event.outcome?.trim()) errors.push(`${event.id}: empty outcome`);
  if (!validStatuses.has(event.status)) errors.push(`${event.id}: unknown status ${event.status}`);
  checkSources(event.id, event.sources, "sources");
}

for (const [id, source] of Object.entries(sources)) {
  if (!source.title?.trim()) errors.push(`source ${id}: empty title`);
  if (!source.publisher?.trim()) errors.push(`source ${id}: empty publisher`);
  if (!source.type?.trim()) errors.push(`source ${id}: empty type`);
  if (source.status !== "pending" && !source.url?.trim()) errors.push(`source ${id}: missing URL`);
}

for (const voice of voices) {
  if (!voice.id) errors.push("voice: missing id");
  if (!Array.isArray(voice.stances) || voice.stances.length === 0) {
    errors.push(`${voice.id}: missing stances`);
    continue;
  }
  for (const [index, stance] of voice.stances.entries()) {
    if (!stance.issue?.trim()) errors.push(`${voice.id}[${index}]: empty issue`);
    if (!stance.summary?.trim()) errors.push(`${voice.id}[${index}]: empty summary`);
    if (stance.position !== "silent") checkSources(`${voice.id}[${index}]`, stance.sources, "sources");
    for (const sourceId of stance.sources || []) {
      if (!sourceIds.has(sourceId)) errors.push(`${voice.id}[${index}]: unknown source ID ${sourceId}`);
    }
  }
}

if (errors.length) {
  console.error(`Validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  const pending = Object.values(sources).filter((source) => source.status === "pending").length;
  console.log(`Validation passed: ${events.length} events, ${Object.keys(sources).length} sources (${pending} pending), ${voices.length} voices.`);
}
