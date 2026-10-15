import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const core = read("scripts/app/01-core.js");
const timeline = read("scripts/app/02-timeline-and-charts.js");
function section(source, start, end) {
  const first = source.indexOf(start);
  const last = source.indexOf(end, first + start.length);
  assert.ok(first >= 0 && last > first, `Missing source boundary: ${start}`);
  return source.slice(first, last);
}

const defaults = { query: "", topic: "all", category: "all", actor: "all", status: "all", evidence: "all", year: "all", sort: "desc" };
const storage = new Map();
const control = () => ({ value: "all", innerHTML: "" });
const context = vm.createContext({
  state: { ...defaults },
  events: JSON.parse(read("data/events.json")),
  sources: JSON.parse(read("data/sources.json")),
  sessionStorage: { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value) },
  categoryFilter: control(), actorFilter: control(), statusFilter: control(), evidenceFilter: control(),
  sortFilter: control(), searchInput: control(), yearRail: control(), categoryQuickFilters: control(),
  esc: (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char])
});
vm.runInContext([
  section(core, "function uniqueSorted(", "function chipClass("),
  section(core, "function sourceStatus(", "function saveTimelineScroll("),
  core.slice(core.indexOf("function matchesExcept(")),
  section(timeline, "function matches(", "function renderTimeline(")
].join("\n"), context);
const run = (code) => vm.runInContext(code, context);
const reset = () => Object.assign(context.state, defaults);

for (const [category, topic] of [
  ["Protest and policing", "protest"], ["Digital rights and free expression", "digital"],
  ["Public health", "health"], ["Environmental disaster", "safety"],
  ["Corruption and procurement", "economy"], ["Civil liberties", "rights"],
  ["Justice and constitutional law", "justice"], ["National security", "security"],
  ["Elections and institutions", "governance"], ["", "governance"]
]) assert.equal(run(`timelineTopic(${JSON.stringify(category)}).id`), topic, category);

for (const [date, expected] of [
  ["13–14 October 2026", "October 2026"], ["May–July 2026", "July 2026"],
  ["2026-09-24", "September 2026"], ["2026", "2026"]
]) assert.equal(run(`timelinePeriod({year: 2026, date: ${JSON.stringify(date)}})`), expected);
assert.equal(run(`byTimeline({year: 2026, date: "15 October 2026"}, {year: 2026, date: "11 October 2026"}) < 0`), true);
assert.equal(run(`byTimelineAsc({year: 2026, date: "15 October 2026"}, {year: 2026, date: "11 October 2026"}) > 0`), true);

for (const topic of run("TIMELINE_TOPICS.map(topic => topic.id)")) {
  reset();
  context.state.topic = topic;
  for (const event of context.events) {
    assert.equal(context.matches(event), context.timelineTopic(event.category).id === topic);
    assert.equal(context.matchesExcept(event, "category"), context.matches(event));
    assert.equal(context.matchesExcept(event, "topic"), true);
  }
}
reset();
const sample = context.events.find((event) => event.category === "Digital rights and free expression");
Object.assign(context.state, { topic: "digital", category: sample.category, actor: sample.actors[0], status: sample.status, year: "2026", evidence: "linked" });
assert.equal(context.matches(sample), true);
context.state.query = "no-such-record-95731";
assert.equal(context.matches(sample), false);
context.renderOptions();
assert.equal(context.state.category, sample.category, "Empty searches retain category");
assert.equal(context.categoryFilter.value, sample.category);
assert.equal(context.actorFilter.value, sample.actors[0]);
assert.equal(context.statusFilter.value, sample.status);
assert.match(context.yearRail.innerHTML, /data-year="2026" aria-pressed="true"/, "Empty searches retain the selected year control");
context.saveTimelineFilters();
const saved = { ...context.state };
reset();
context.restoreTimelineFilters();
assert.deepEqual({ ...context.state }, saved, "Filters survive a reload in the same session");
assert.equal(context.searchInput.value, saved.query);

reset();
storage.set("letsfixindia.timeline-filters.v1", "not-json");
assert.doesNotThrow(() => context.restoreTimelineFilters());
assert.deepEqual({ ...context.state }, defaults);
storage.set("letsfixindia.timeline-filters.v1", JSON.stringify({ topic: "bad", sort: "bad", category: "bad", actor: "bad", status: "bad", evidence: "bad", year: "9999", query: 123 }));
context.restoreTimelineFilters();
assert.deepEqual({ ...context.state }, defaults, "Unrecognised saved filters are discarded");
context.sessionStorage.getItem = () => { throw new Error("Storage blocked"); };
context.sessionStorage.setItem = () => { throw new Error("Storage blocked"); };
assert.doesNotThrow(() => context.restoreTimelineFilters());
assert.doesNotThrow(() => context.saveTimelineFilters());

console.log(`Timeline checks passed: ${context.events.length} records across 9 topics; date grouping, combined filters, no-result retention, reload and unavailable storage.`);
