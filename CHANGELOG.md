# Changelog — India Dossier

All notable user-facing changes to the site.

## 2026-07-18

### Added
- **FAQ page** (`/faq`) — nine questions covering scope, bias policy, evidence labels, the 2014 start date, Wikipedia-as-lead rule, corrections process, the BJP-tenure calculation, contributing, and privacy. Accordion layout, no JS required.
- **Public Voices page** (`/voices`) — tracks documented statements or documented silence by influential public figures on Modi-era controversies, filterable by field, stance, and issue.
- **About page** (`/about`) — maintainer note, GitHub repository link, and ways to help.
- **7 RSS/Hindutva-linked events** with HRW sourcing: Ghar Wapsi drive (2014), Pehlu Khan lynching (2017), Junaid Khan train killing (2017), Tabrez Ansari lynching (2019), UP anti-conversion "love jihad" ordinance (2020), Karnataka hijab ban (2022), bulldozer demolitions (2022).
- **BJP total-tenure stat** on the home page — live sum of Vajpayee 1996, Vajpayee 1998–2004, and Modi 2014–present, with time remaining in the current Lok Sabha term.
- **Scroll dock** on the timeline: Top / Bottom jump buttons; after a jump the middle button becomes **Continue** and returns you to where you were.
- Motion layer: card entrance animations with stagger, growing stat bars, hover lifts, animated nav underline, and full `prefers-reduced-motion` support.

### Changed
- Pre-2014 context entries (Gujarat 2002) removed to keep scope strictly to the 2014–2026 period.
- All editorial outcome notes ("The site keeps this as…", "The entry should…") rewritten as plain factual outcomes.
- Bright warm-white theme (`#fbfaf5`) locked in; dark mode removed.
- Timeline rebuilt with a visual spine, year markers, and sticky year headings.
- Search placeholder and filter dropdowns cleaned up; dropdowns no longer clip at intermediate widths.

### Fixed
- Brand rendered as "India DossierDossier" on mobile.
- XSS risk in the local submission queue (all draft fields now HTML-escaped).
- Timeline scroll position lost on route changes; now saved and restored per visit.
- `404.html` SPA fallback kept in sync with `index.html` for static-host routing.

### Data
- 120 events · 264 sources · 20 indicators · 64 backlog leads.
