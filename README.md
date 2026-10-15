# LetsFixIndia

Mobile-first static website for a sourced timeline of major governance crises, rights concerns, scandals, public protests, sexual-violence cases involving political actors, terror attacks, and exam-integrity failures during the BJP/Modi period. The site also includes a state explorer and a moderated photo/video evidence gallery.

## Structure

- `index.html` / `404.html` - compact source-mode loader shells.
- `shell/` and `routes/` - shared document chrome and route-owned markup fragments.
- `shell/app-markup.html` - generated raw-static fallback; edit the fragments, never this file.
- `styles.css` and `styles/` - ordered CSS manifest plus losslessly extracted cascade sections.
- `data/events.json` - timeline entries.
- `data/sources.json` - source ledger.
- `data/indicators.json` - numeric indicators.
- `data/voices.json` - source-linked public statements and documented silence.
- `data/india-states.geojson` and `data/event-jurisdictions.json` - MapLibre state boundaries and explicit event-to-state mappings.
- `data/gallery.json` - editor-approved public gallery items only.
- `data/gallery-config.json` - non-secret Cloudinary upload configuration; API secrets never belong here.
- `app.js` and `scripts/app/` - one-line launcher plus ordered application modules.
- `state-explorer.js` / `explorers.css` - state-map and state-timeline feature.
- `gallery.js`, `gallery.css`, and `gallery/` - mixed-media masonry gallery, moderated intake flow, and route-owned styles.
- `gallery-deduplication.js` and `vendor/blockhash/` - local SHA-256/Blockhash image preflight, Hamming-distance comparison, and vendored MIT license.
- `statistics.js` / `statistics.css` - Statistics paging, topic shortcuts, density controls, deep links, and route-specific motion.
- `contact.css` - Contact and Support presentation.
- `tools/compose-shell.mjs` - composes route fragments for the source loader and Astro shell.
- `tools/validate-shell.mjs` - rejects stale generated markup, duplicate IDs, broken imports, and root/public mirror drift.
- `tools/expand-json-data.mjs` - repeatable data updater used to append newly researched entries.
- `tools/audit-data.mjs` - source-reference and URL integrity audit.

## Local Run

Use the repository server so route fragments are composed before source mode starts:

```powershell
npm.cmd run serve -- 5278 --source
```

Then open:

```text
http://127.0.0.1:5278/
```

## Gallery upload configuration

The public Gallery requests short-lived signed upload parameters from `/api/gallery-signature`. Configure the signed Cloudinary preset and credentials through the server-side variables listed in `.env.example`; keep the asset folder fixed to `letsfixindia`. The browser receives an API key and per-request signature, but never the API secret.

Supported images are fingerprinted locally before upload. SHA-256 catches exact file repeats; the vendored MIT-licensed `blockhash-core` implementation produces a 256-bit perceptual hash for near-duplicate review. Exact and perceptual matches are review signals, never automatic publication, rejection, merge, or deletion decisions; another submitter may be adding independent provenance. A trusted moderation service should repeat the comparison against the complete pending and approved corpus before this becomes an authoritative global duplicate check.

For local server work, copy `.env.example` to a gitignored `.env.local`. Add production values in Vercel Project Settings → Environment Variables. Never put an API secret in `gallery-config.json`, frontend JavaScript, or GitHub repository variables.

## Verification

Run the complete local release check before publishing research changes:

```powershell
npm run check
```

This audits source references, validates all JSON databases, and builds the static site.

For a no-build working-session check, use:

```powershell
npm.cmd run check:local
```

Run `npm.cmd run compose:shell` after changing route fragments when the source server is not running. Source mode composes and serves the full initial document automatically; the compact root loader remains a fallback for raw static serving.

The audit prints exact pending and orphaned source IDs so research cleanup can be assigned without manually searching the JSON files.

The former large legacy files were split behind local Git checkpoints. The rule remains behavioral preservation: move code and selectors without rewriting them, keep import/script order explicit, and browser-check affected routes. A lower line count by itself is not proof of a safe refactor; `gallery.js` remains one coherent feature module for that reason.

## Cloud continuation — 15 October 2026

This is the continuation point for a cloud coding session, not an enabled nightly job. No research API key is required for the static timeline, and no existing private API key should be reused. No scheduled researcher was activated in this update. Private notes, credentials, browser sessions and local research captures are intentionally excluded from Git.

- Repository: `basithladdu/letsfixindia`, production branch `master`, live site `https://letsfixindia.com`. Use the existing Vercel Git integration; do not create another project or deployment pipeline. A push alone does not prove the intended commit is live.
- Current ledger: **458 events, 1,427 sources, 255 explicit state/UT mappings**. The 15 October review adds eight records and updates four existing records. Read the latest entries in `AGENTLOG.md` and `CHANGELOG.md` before continuing. Preserve existing IDs, sources, routes and unrelated edits.
- Authoritative data lives in `data/`; keep corresponding `public/data/` files byte-identical. Source fragments, scripts and styles also have `public/` mirrors. After mirroring, run `npm run compose:shell`; never hand-edit the generated `shell/app-markup.html` files.
- Timeline UI: `scripts/app/01-core.js` defines nine broad reading topics, date grouping and session filter persistence. Original detailed categories remain unchanged. `02-timeline-and-charts.js` renders the full summaries, outcomes and citations. `routes/timeline-intro.html`, `routes/timeline-list.html` and `styles/10-archive-ui-polish.css` own the visible controls and card layout. Labels accompany colours; topic colour is not a guilt or evidence rating. Month ranges group by their latest named month, matching the existing date sorter. Saved filters are tab-session state, not cloud sync.
- Research with live search and open the supporting pages. Record the actual event date separately from publication/retrieval dates. Keep police claims, litigant statements, reports, primary orders and measured service availability distinct. Never turn an announced hearing, notice, requested relief, scheduled commencement or order expiry into a completed outcome.
- The state-government histories retain their **22 July** checkpoint; the jurisdiction index's inherited metadata retains **21 July**. Do not imply those datasets were fully re-reviewed when updating the timeline checkpoint.

### Run and verify in a fresh checkout

The 15 October local checks use Node 24.10.0. Use a Node version supported by the locked Astro dependencies, then:

```sh
npm ci
npm run compose:shell
npm run check:local
npm run check
npm run serve -- 5282 --source
```

`check:local` includes data/mirror validation, gallery/moderation regressions and the new timeline filter tests. `check` includes the production Astro build. On Windows use `npm.cmd` if PowerShell blocks the npm script. The shell composer resolves junctions/symlinks before detecting CLI invocation.

Browser-check `/`, every changed `/record/<id>` page, `/sources`, `/map` and `/about` at desktop and 375–390px. Test topic/category/year/search combinations, both date orders, no-result recovery, reload, back navigation, keyboard focus and the share disclosure. Inspect screenshots and overflow; an automated assertion alone is not visual inspection. Local screenshots are ignored, so a cloud session should recreate them. Stage narrowly, inspect the diff, run a normal push, then verify the exact SHA reaches Vercel production and the public domain serves the changed data and UI.

### Evidence still needed

- Reconcile individuals and separate detention cohorts. The 11 October release of Dipke, Das and Ranka preceded a new 13 October detention of Das and Ranka and reported 14 October custody. A 15 October Moneycontrol report quotes Dipke saying they remain jailed; obtain the primary remand order and any later release/bail record. Do not state that all protesters are released.
- Obtain primary Delhi transport/internet orders and the government's contempt affidavit, and the outcome of later hearings. The 14–15 October response reportedly offers an apology while defending the restriction and requesting relief. Neither apology acceptance nor discharge of contempt was established. Government restoration assurances are not independent operator-level measurements.
- Retrieve the Jantar Mantar standing order and any operative challenge decision. Three replacement venues were reported; access, capacity and permission for a specific gathering remain separate questions.
- Check the GAC decision in SFI's appeal after the 24 September order, the 17 November hearing listed in Ila Kazmi's case, and ADR's immunity challenge after the reported 13 October notice. No account restoration or merits ruling is established by these entries.
- Earlier unresolved items remain: conflicting Sharjeel Imam bail reports and actual surrender, Malda inquiry findings, compensation/payment follow-through, and implementation of the announced UPI framework. Do not infer implementation from a calendar date.
- Inherited audit backlog: **67 pending source URLs and 463 unreferenced sources**. These are not new failures or proof that all linked sources remain accessible. Coverage is curated, not exhaustive.
