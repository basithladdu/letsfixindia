import Link from "next/link";

export const metadata = { title: "About | LetsFixIndia" };

export default function AboutPage() {
  return (
    <main className="page-section about-page">
      <blockquote className="about-quote">
        <p>"we are all going to be worm food anyways."</p>
        <cite>A note from the maker (basith, 2024)</cite>
      </blockquote>

      <p className="eyebrow">About the project</p>
      <h1>India leaves a paper trail.</h1>
      <p className="lede">LetsFixIndia turns that trail into something people can actually read: a timeline with dates, sources, uncertainty, and room for correction.</p>
      
      <div className="about-grid">
        <article>
          <h2>Not a verdict</h2>
          <p>This is a record, not a prosecution brief. Government wins, failures, opposition claims, court findings, public protests, and unresolved questions all belong here when the evidence is strong enough.</p>
        </article>
        <article>
          <h2>Receipts first</h2>
          <p>Every record points to sources. We separate what happened, what was alleged, what was investigated, and what was decided. The boring distinction is the useful one.</p>
        </article>
        <article>
          <h2>Built in public</h2>
          <p>The database, source ledger, and contribution path are open to inspection. You do not need to agree with an entry to help make it more accurate.</p>
        </article>
      </div>

      <section className="support-panel">
        <p className="eyebrow">Keep it moving</p>
        <h2>Support the work without buying a slogan.</h2>
        <p>
          Read closely. Share the source, not just the headline. Send corrections. Add a missing record. Review the repository.
          This project is powered by <strong>devit.</strong> Basith is the founder. (A little self-aware paid promotion — don't mind if I do, hire us to build your software!).
        </p>
        <div className="support-actions">
          <a className="text-button" href="https://github.com/basithladdu/theindiafiles" target="_blank" rel="noreferrer">Support on GitHub</a>
          <a className="text-button" href="mailto:basithladoo@gmail.com">Email basithladoo@gmail.com</a>
          <a className="text-button" href="https://www.wedevit.in/" target="_blank" rel="noreferrer">Visit wedevit.in</a>
        </div>
        <p className="contact-line">
          <strong>Contact:</strong> workwithdevit@gmail.com | +91 95533 21211 | <a href="https://wa.me/919553321211" target="_blank" rel="noreferrer">WhatsApp</a>
        </p>
      </section>
      <p className="about-signoff">The record will never be finished. That is not a bug; it is the job.</p>
    </main>
  );
}
