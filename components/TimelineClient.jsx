"use client";

import { useEffect, useMemo, useState } from "react";
import EventCard from "@/components/EventCard";

const SCROLL_KEY = "letsfixindia:timeline-scroll";

export default function TimelineClient({ events }) {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("all");
  const years = useMemo(() => [...new Set(events.map((event) => event.year))].sort((a, b) => a - b), [events]);
  const filtered = useMemo(() => events.filter((event) => {
    const text = `${event.title} ${event.category} ${event.summary}`.toLowerCase();
    return (year === "all" || String(event.year) === year) && (!query || text.includes(query.toLowerCase()));
  }).sort((a, b) => Number(a.year) - Number(b.year)), [events, query, year]);

  useEffect(() => {
    const saved = Number(sessionStorage.getItem(SCROLL_KEY));
    if (saved) window.scrollTo({ top: saved, behavior: "instant" });
    const save = () => sessionStorage.setItem(SCROLL_KEY, String(Math.round(window.scrollY)));
    window.addEventListener("scroll", save, { passive: true });
    return () => window.removeEventListener("scroll", save);
  }, []);

  return <>
    <div className="toolbar-band"><div className="toolbar"><label htmlFor="timeline-search">Search records<input id="timeline-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Title, issue, place" /></label><label htmlFor="timeline-year">Year<select id="timeline-year" value={year} onChange={(event) => setYear(event.target.value)}><option value="all">All years</option>{years.map((item) => <option key={item} value={item}>{item}</option>)}</select></label></div><p className="result-count" aria-live="polite">{filtered.length} records shown</p></div>
    <section className="timeline" aria-label="Timeline of events">{filtered.map((event) => <div className="timeline-row" key={event.id}><div className="timeline-year">{event.year}</div><EventCard event={event} /></div>)}</section>
  </>;
}
