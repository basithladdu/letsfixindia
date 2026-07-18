import { voices } from "@/lib/data";
export const metadata = { title: "Voices | LetsFixIndia" };
export default function VoicesPage() { return <main className="page-section"><p className="eyebrow">Public statements</p><h1>Voices</h1><p className="lede">A source-led index of people who spoke, stayed silent, or have a position that still needs verification.</p><div className="voice-grid">{voices.map((voice) => <article className="support-grid" key={voice.id || voice.name}><h3>{voice.name}</h3><p>{voice.field || voice.description || "Tracked public figure"}</p></article>)}</div></main>; }
