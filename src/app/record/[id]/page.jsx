import { notFound } from "next/navigation";
import { events, getEvent } from "@/lib/data";
import EventCard from "@/components/EventCard";
export function generateStaticParams() { return events.map((event) => ({ id: event.id })); }
export default async function RecordPage({ params }) { const { id } = await params; const event = getEvent(id); if (!event) notFound(); return <main className="page-section record-page"><p className="eyebrow">Record detail</p><h1>{event.title}</h1><EventCard event={event} /></main>; }
