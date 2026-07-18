# India Dossier

Mobile-first static website for a sourced timeline of major governance crises, rights concerns, scandals, public protests, sexual-violence cases involving political actors, terror attacks, and exam-integrity failures during the BJP/Modi period.

## Structure

- `index.html` - page shell.
- `styles.css` - mobile-first visual system.
- `data/events.json` - timeline entries.
- `data/sources.json` - source ledger.
- `data/indicators.json` - numeric indicators.
- `app.js` - filters, search, timeline rendering, and local submission queue.
- `raw/` - raw user notes and source index.
- `tools/expand-json-data.mjs` - repeatable data updater used to append newly researched entries.

## Local Run

Serve this folder with any static server. Example:

```powershell
python -m http.server 5178
```

Then open:

```text
http://127.0.0.1:5178/
```
