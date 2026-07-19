import Link from "next/link";
import { voices } from "@/lib/data";
export const metadata = { title: "Voices | LetsFixIndia" };
export default function VoicesPage() { 
  return (
    <main className="page-section">
      <p className="eyebrow">Public statements</p>
      <h1>Voices</h1>
      <p className="lede">A source-led index of people who spoke, stayed silent, or have a position that still needs verification.</p>
      <div className="voice-grid">
        {voices.map((voice) => (
          <article className="support-grid" key={voice.id || voice.name}>
            <h3>{voice.name}</h3>
            <p>{voice.field || voice.description || "Tracked public figure"}</p>
          </article>
        ))}
      </div>
      <div className="voices-report-container" style={{ marginTop: "2rem", textAlign: "center", padding: "1.25rem", border: "1px dashed var(--line)", borderRadius: "8px", background: "rgba(0,0,0,0.01)" }}>
        <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.9rem", color: "var(--muted)" }}>Missing a public statement, silence record, or wish to report something else?</p>
        <Link href="/submit" className="text-button" style={{ display: "inline-block", padding: "8px 16px", fontSize: "0.85rem", fontWeight: "750" }}>Report another voice / statement</Link>
      </div>
    </main>
  ); 
}
