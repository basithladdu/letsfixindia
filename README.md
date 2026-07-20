# LetsFixIndia

LetsFixIndia is an Astro-built, source-led public record of events, decisions, institutions, indicators, and public responses in India. It is designed to be readable on a phone, checkable through its source ledger, and open to evidence-backed corrections.

## Architecture

- `src/pages/` — statically rendered public routes, including one indexable page per record.
- `src/components/` — shared Astro UI and small progressively enhanced explorers.
- `src/lib/records.js` — the single read interface for published data.
- `src/styles/global.css` — the responsive design system.
- `data/` — reviewed public content: events, sources, indicators, and voices.
- `supabase/functions/submit-suggestion/` — protected submission intake; public clients do not write to the database directly.

The public site is static-first. Search and filtering improve the page when JavaScript is available, while record content and source links remain available as HTML.

## Local Run

```bash
npm install
npm run dev
```

## Verification

Run the complete local release check before publishing research changes:

```powershell
npm run check
```

This audits source references, validates all JSON databases, and builds the static site. The audit prints exact pending and orphaned source IDs so research cleanup can be assigned without manually searching the data.

## Submissions

Apply the Supabase migrations and deploy `submit-suggestion` as an Edge Function before enabling public submissions. Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY`, `SUBMISSION_RATE_LIMIT_SALT`, and a comma-separated `ALLOWED_ORIGINS` only in the Edge Function environment. Set `PUBLIC_SUBMISSION_ENDPOINT` and `PUBLIC_TURNSTILE_SITE_KEY` in the static site’s build environment. The form is deliberately unavailable until both public values exist. Do not grant `anon` or `authenticated` database access to `letsfixindia_submissions`.
