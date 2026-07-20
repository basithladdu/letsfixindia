import eventsData from "../../data/events.json" with { type: "json" };
import indicatorsData from "../../data/indicators.json" with { type: "json" };
import sourcesData from "../../data/sources.json" with { type: "json" };
import voicesData from "../../data/voices.json" with { type: "json" };

export const events = Array.isArray(eventsData) ? eventsData : Object.values(eventsData);
export const indicators = Array.isArray(indicatorsData) ? indicatorsData : Object.values(indicatorsData);
export const voices = Array.isArray(voicesData) ? voicesData : Object.values(voicesData);
export const sources = Array.isArray(sourcesData)
  ? sourcesData
  : Object.entries(sourcesData).map(([id, source]) => ({ id, ...source }));
export const sourceById = Object.fromEntries(sources.map((source) => [source.id, source]));

export const orderedEvents = [...events].sort((left, right) => Number(right.year) - Number(left.year));
export const getEvent = (id) => events.find((event) => event.id === id);
export const getEventSources = (event) => (event.sources || []).map((id) => sourceById[id]).filter(Boolean);
export const categories = [...new Set(events.map((event) => event.category).filter(Boolean))].sort();
export const years = [...new Set(events.map((event) => event.year).filter(Boolean))].sort((left, right) => Number(right) - Number(left));

export function evidenceFor(event) {
  const ids = [...new Set(event.sources || [])];
  const linked = ids.filter((id) => sourceById[id]?.url).length;
  const pending = ids.filter((id) => sourceById[id] && !sourceById[id]?.url).length;
  const missing = ids.filter((id) => !sourceById[id]).length;

  if (missing || !ids.length) return { tone: "needs-work", label: "Needs source review", linked, pending, missing };
  if (pending) return { tone: "partial", label: "Sources partly linked", linked, pending, missing };
  return { tone: "linked", label: `${linked} linked source${linked === 1 ? "" : "s"}`, linked, pending, missing };
}
