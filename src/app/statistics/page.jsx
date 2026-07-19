import { indicators, getSource } from "@/lib/data";
export const metadata = { title: "Statistics | LetsFixIndia" };
export default function StatisticsPage() {
  return <main className="page-section"><p className="eyebrow">Measures and limits</p><h1>Statistics</h1><p className="lede">Indicators are shown with their period, definition, and source. A change is not automatically a verdict.</p><div className="indicator-grid">{indicators.map((indicator) => {
    const linkedSources = (indicator.sources || []).map(getSource).filter(Boolean);
    return <article className="indicator" key={indicator.id || indicator.name || indicator.title}><h3>{indicator.name || indicator.title}</h3><strong>{indicator.value || indicator.latest || "Recorded"}</strong><p>{indicator.note || indicator.description || indicator.detail || "See the linked source for the definition and methodology."}</p><div className="source-links" aria-label={`Sources for ${indicator.title || indicator.name}`}>{linkedSources.map((source) => source.url ? <a key={source.id} href={source.url} target="_blank" rel="noreferrer">{source.publisher}: {source.title}</a> : <span className="source-pending" key={source.id}>Verification pending</span>)}</div></article>;
  })}</div></main>;
}
