export const metadata = { title: "Contact | LetsFixIndia" };

export default function ContactPage() {
  return (
    <main className="page-section">
      <p className="eyebrow">Get in touch</p>
      <h1>Contact & Collaboration</h1>
      <p className="lede">For corrections, collaboration, research, or software work, reach out directly.</p>

      <div className="support-options" style={{ marginTop: "32px" }}>
        <article className="support-card">
          <span className="support-rank">WhatsApp</span>
          <h3>WhatsApp Chat</h3>
          <p>Chat directly with Basith for quick questions, feedback, or collaboration queries.</p>
          <div className="support-actions" style={{ marginTop: "14px" }}>
            <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="contact-item whatsapp-personal" style={{ textDecoration: "none" }}>
              <span className="contact-label">Start WhatsApp Chat</span>
            </a>
          </div>
        </article>

        <article className="support-card">
          <span className="support-rank">Direct Contact</span>
          <h3>Build with Basith</h3>
          <p>For corrections, collaboration, research, or software work, contact me directly.</p>
          <div className="contact-links" style={{ marginTop: "14px", display: "grid", gap: "8px" }}>
            <a href="mailto:basithladoo@gmail.com" className="contact-item email-personal">
              <span className="contact-icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <span className="contact-label">basithladoo@gmail.com</span>
            </a>
            <a href="mailto:workwithdevit@gmail.com" className="contact-item email-work">
              <span className="contact-icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <span className="contact-label">workwithdevit@gmail.com</span>
            </a>
            <a href="tel:+" className="contact-item phone-personal">
              <span className="contact-icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </span>
              <span className="contact-label"></span>
            </a>
            <a href="https://instagram.com/basithladoo" target="_blank" rel="noopener noreferrer" className="contact-item instagram-personal">
              <span className="contact-icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </span>
              <span className="contact-label">Instagram</span>
            </a>
            <a href="https://twitter.com/basithladoo" target="_blank" rel="noopener noreferrer" className="contact-item twitter-personal">
              <span className="contact-icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                </svg>
              </span>
              <span className="contact-label">Twitter</span>
            </a>
            <a href="https://youtube.com/@basithladoo" target="_blank" rel="noopener noreferrer" className="contact-item youtube-personal">
              <span className="contact-icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                </svg>
              </span>
              <span className="contact-label">YouTube</span>
            </a>
            <a href="https://letterboxd.com/basithladoo" target="_blank" rel="noopener noreferrer" className="contact-item letterboxd-personal">
              <span className="contact-icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M8 12h8"></path>
                </svg>
              </span>
              <span className="contact-label">Letterboxd</span>
            </a>
            <a href="https://open.spotify.com/user/basithladoo" target="_blank" rel="noopener noreferrer" className="contact-item spotify-personal">
              <span className="contact-icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 18V5l12-2v13"></path>
                  <circle cx="6" cy="18" r="3"></circle>
                  <circle cx="18" cy="16" r="3"></circle>
                </svg>
              </span>
              <span className="contact-label">Spotify</span>
            </a>
          </div>
        </article>

        <article className="support-card">
          <span className="support-rank">Powered by</span>
          <h3>devit.</h3>
          <p>Devit — The studio behind this work, at wedevit.in. Basith is the founder. (A little self-aware paid promotion — don't mind if I do, hire us to build your software!). We design, build, and scale exceptional software for startups and businesses.</p>
          <div className="support-actions" style={{ marginTop: "14px" }}>
            <a className="contact-item company-site" href="https://www.wedevit.in/" target="_blank" rel="noopener noreferrer">
              <span class="contact-icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              </span>
              <span className="contact-label">Visit wedevit.in</span>
            </a>
          </div>
        </article>
      </div>
    </main>
  );
}
