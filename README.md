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
