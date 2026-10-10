# Changelog — India Dossier

All notable user-facing changes to the site.

## 2026-10-11

### Added

- 39 source-backed records from a further review of 1 July–10 October 2026: 436 events, 1,387 sources and 240 explicitly state-tagged records in total.
- Protest injuries and detentions, journalist bail and speech cases, election-roll safeguards, parliamentary scrutiny, Manipur and Ladakh developments, floods and health-service failures, rural employment, RBI policy and CAG audit findings.
- 83 source entries and 22 state/UT mappings. Sources distinguish primary documents, archived reports, news accounts and advocacy statements; publication dates are included only where established.

### Updated

- Delhi Metro's late-10-October reopening announcement and the transport contempt petition, without treating a petition as a judicial finding or Metro reopening as internet restoration.
- The 20 July protest record now distinguishes police and hospital injury snapshots and attributes subsequent pellet-firing reporting. Conflicting crowd estimates and weakly supported shutdown-radius precision are not presented as settled facts.
- Corrected the demolition-guidelines date to 13 November 2024 and the rural-employment law's assent/commencement distinction.
- About and footer now show the 11 October review checkpoint. State-government histories retain their separate 22 July checkpoint.

### Verification and limits

- Data, shell, gallery, submission and moderation checks passed; Astro built 707 pages.
- All 44 new or revised record pages checked at 1440px and 375px: 88 checks of page loading, displayed outcomes, citation links and overflow. Search, ordering, empty-state recovery, reload, source-ledger lookup and state mapping also checked at 1440px and 390px.
- Ten bounded web-research assignments informed this update. Coverage remains curated, not exhaustive; operator-level internet restoration and final detention/release totals are not independently reconciled.
- Existing backlog warnings remain unchanged: 67 pending source URLs and 463 unreferenced sources. Some external sources require an archive or intermittently block retrieval; rendering a citation is not proof of continuing source availability.

## 2026-10-10

### Added
- 27 source-backed records covering selected major developments from 26 July through 10 October 2026, bringing the archive to 397 events and 1,304 sources.
- July protest settlement and Supreme Court follow-ups; October Delhi and Mumbai detentions; journalist accounts; dated Metro, rail and mobile-internet restrictions; and the MeitY advisory and Bitchat removal.
- Significant state-level exam protests, public-safety incidents, preventive-detention litigation, electoral-procedure disputes and LPU unrest. Unverified allegations and official responses remain explicitly separated.
- 49 source entries with publication/retrieval dates and 20 state/UT mappings. Court orders are linked directly where available; an inquiry, an announced release direction and a completed release are not interchangeable.

### Changed
- Research freshness now reflects the 10 October checkpoint, not the viewer's clock. The separate state-government history checkpoint remains 22 July.
- Updated About and the inactive latest-record splash; fixed the About fragment's unmatched closing tag.
- Source titles wrap on standalone record pages instead of being clipped on narrow screens.
- Validation now checks timeline/source/jurisdiction/backlog mirrors, optional source dates and non-empty event source lists.

### Verification
- Data, shell, gallery, submission and moderation checks passed; Astro generated 668 pages.
- New record pages checked at 1440px and 390px; search, date ordering, empty-state reset and citation-copy interactions exercised locally.
- Existing backlog warnings remain: 67 sources awaiting URLs and 463 unreferenced source records. This release does not claim exhaustive news coverage, independently reconciled detention totals or live transport status.

## 2026-07-23

### Added
- **Eight source-backed events** — Chandrayaan-3's lunar landing, the New Delhi G20 Leaders' Declaration, Arunachal Pradesh and Uttarakhand constitutional crises, Delhi services ruling, Odisha's 2024 government change, Goa's 2019 confidence vote, and Punjab's 2021 ministry transition.

### Verification
- Event database now contains 271 records and 1,154 registered sources; JSON and data validation passed.

## 2026-07-22

### Added
- **Complete state governance histories** — source-backed Chief Minister, government, caretaker, constitutional-gap, Leader of the Opposition, and vacancy records for all 36 Indian states and union territories from 2014 through 22 July 2026.
- **Accuracy qualifications** — unresolved constitutional boundaries, disputed office recognition, suspended Assembly status, dated party snapshots, and voice-vote results are labelled instead of being presented as invented precision.
- **About-page release note** — the latest research checkpoint is now visible on the public About page.

### Verification
- 1,152 registered sources, 266 government intervals, and 233 opposition/vacancy intervals validated.
- JSON, shell, mirror, gallery, submission, and moderation checks passed.

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
