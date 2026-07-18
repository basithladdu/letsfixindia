import Link from "next/link";
import SourceLinks from "@/components/SourceLinks";
export default function EventCard({ event }) {
  return <article className={`event-card ${String(event.severity || "").toLowerCase()}`}><div className="event-meta"><span>{event.date || event.year}</span><span>{event.category}</span></div><h3><Link href={`/record/${event.id}`}>{event.title}</Link></h3><p>{event.summary}</p><p className="event-outcome"><strong>Outcome:</strong> {event.outcome}</p><SourceLinks event={event} /></article>;
}
