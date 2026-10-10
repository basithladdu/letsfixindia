# Agent Log - LetsFixIndia

## Session 280 - Research update through 10 October 2026

- Recovered the relocated authoritative checkout at `D:\CODE\modi-era-record`, clean `master` at `c043739` matching `origin/master`. The former C: checkout path no longer exists. Preserved every pre-existing event, source, mapping and route.
- Added 27 events, 49 sources and 20 mappings for 26 July–10 October: July protest agreement and judicial follow-ups; October detentions, journalist accounts, Metro/rail restrictions and the four-kilometre mobile-data order; digital-speech measures; and eight state-level/institutional developments. New source entries carry publication and retrieval dates.
- Legal review retained the limited 2,873-person investigation exception as a police allegation, the suicide-bereaved-family scope of the compensation direction, the inquiry's actual priorities, and the distinction between an announced release and a verified completed release. The Akriti Chaudhary entry includes the subsequent Supreme Court stay and compensation reversal.
- The Metro record distinguishes the 57-to-45 revision, station gate access from network closure, the later 10 pm extension, and the absence of independent restoration confirmation. October detention totals remain unresolved rather than fabricated. These records are not live travel advice.
- Updated About/footer freshness and the inactive splash; preserved the separate 22 July state-government checkpoint and 21 July jurisdiction-index review metadata. Reused existing topic categories and kept nuanced evidence statuses. Synchronized root/public mirrors and generated shell markup.
- Strengthened mirror/source-date/source-list validation. Baseline plus six in-memory negative fixtures passed without modifying data. Existing 67 pending URLs and 463 unreferenced sources are unchanged, outside this release's scope.
- `check:local` and `check` passed, including gallery/submission/moderation regressions and an Astro build of 668 pages. All 27 new standalone records passed desktop/mobile checks (54 checks, no route, source-link, overflow, broken-image or console/page errors); timeline search/order/reset and citation copy were exercised. Local evidence is under ignored `output/playwright/`.
- Visual review found clipped source titles on narrow standalone records; a scoped wrapping rule fixes them. Browser observations are desktop/mobile viewport evidence, not physical-device testing. No independent hosting deployment command was issued.
- Final 1440px/375px checks passed for home, About and the revised Metro record, including untruncated source labels and the fixed research date after midnight. The source-ledger filter returns the new shutdown source, and Delhi's state timeline includes the new mapped records. State selection still resets on full reload (pre-existing behaviour; no persistence change was made).

## Session 275 - IT Rules and Digital Media Oversight

- Added the 2021 IT Rules record covering intermediary compliance, grievance obligations, and digital-news/OTT oversight.
- Included MeitY, PRS, and PIB sources and separated the government's stated objectives from digital-rights and free-expression concerns.
- Recreated this log because the previous AGENTLOG.md was absent from the current workspace.
- No push or commit performed.

## Session 278 - Voices and record mobile layout pass

- Turned the voices issue-coverage index into a compact horizontal scroller on narrow screens; it now uses 107px instead of roughly 401px before the filters.
- Fixed the voices reset control baseline so it no longer overlaps the order selector on mobile.
- Changed standalone record-page sharing to a two-column mobile grid so all seven actions remain visible and tappable.
- Added the standalone record stylesheet-cascade correction to the root Astro manifest.
- Smoke-tested all primary routes at 1440px and 390px: no console errors, no page errors, and no horizontal overflow reported.
- `npm.cmd run check` passed: 370 events, 134 indicators, 250 voices, 1,255 sources, and 640 static pages built.
- No push or commit performed.

## Session 277 - Desktop filter proportions and reset accessibility

- Corrected the desktop timeline filter grid so the search field keeps enough width for its placeholder and the advanced filters remain balanced beside sort order.
- Prevented the inactive desktop reset control from consuming a forced 44px column while retaining the icon-only reset target on mobile.
- Added an explicit `aria-label` to the reset control in the route and generated shell markup.
- Rebuilt and smoke-tested desktop and 390px mobile views with no console errors or horizontal overflow.
- `npm.cmd run check` passed: 370 events, 134 indicators, 250 voices, 1,255 sources, and 640 static pages built.
- No push or commit performed.

## Session 276 - PMLA record and filter/rail layout

- Added the 27 July 2022 Supreme Court PMLA judgment record with the reported judgment text and an Indian Express legal analysis.
- Fixed the timeline search reset control so it no longer creates a stray desktop row or a tall mobile filter block.
- Added a shared timeline-axis CSS variable so year markers, event markers, and connecting lines use one centre coordinate.
- Synced `data/events.json` and `data/sources.json` to `public/data/`.
- `npm.cmd run check` passed: 370 events, 134 indicators, 250 voices, 1,255 sources, and 640 static pages built.
- No push or commit performed.

## Session 279 - Local-only route error audit

- Fixed the gallery's static-host warning: `/api/gallery` is now skipped on `localhost` and `127.0.0.1`, so the gallery no longer tries to parse the static HTML fallback as JSON.
- Prevented the localhost submission flow from loading the Supabase CDN; drafts stay in browser storage during local work.
- Removed remote Google Fonts links from the local shell and static fallback pages; the existing system font fallbacks remain in place.
- Rebuilt and checked all 18 primary routes at desktop and 390px mobile sizes: 36 checks, zero navigation errors, zero console errors, and zero horizontal-overflow failures.
- Exercised the submission form locally and confirmed a draft saves without a network request; temporary validation drafts were removed afterward.
- `npm.cmd run check` passed: 370 events, 134 indicators, 250 voices, 1,255 sources, and 640 static pages built.
- No push or commit performed.
