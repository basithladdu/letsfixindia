import { eventSources } from "@/lib/data";
export default function SourceLinks({ event }) {
  const linked = eventSources(event);
  return <div className="source-links">{linked.map((source) => source.url ? <a key={source.id} href={source.url} target="_blank" rel="noreferrer">{source.publisher}: {source.title}</a> : <span className="source-pending" key={source.id}>Verification pending</span>)}</div>;
}
