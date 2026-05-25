# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Specification complete and aligned with sponsor research. Geographic scope, ontology entity, and primary data sources locked. Implementation not yet started in `project_threshold/`. A reference prototype exists at `/Users/datta/Documents/Threshold` (Vite + JSX + Mapbox + Recharts, Toronto-only static scenarios) — used as a UX/component reference only; v2 is a fresh build with a different scope and architecture.

## Current Goal

- First end-to-end vertical slice: Census Tract boundaries (A1) + Census demographics (A2) + Alectra service area (A8) joined into `frontend/public/data/communities.geojson`, then rendered as a choropleth using a dummy composite score derived from A2 fields. Three sources, three layers, one map. No ML, no LLM, no recommendations yet.

## Completed

- Project context drafted: `project-overview.md`, `architecture.md`, `ai-workflow-rules.md`, `code-standards.md`, `ui-context.md`.
- Hackathon docs reviewed and stored under `docs/`: Opening Day slides, Theme 3 Challenge Set 03.
- Pipeline exploration notebook present at `pipeline/EDA.ipynb` (placeholder).
- Reference prototype at `/Users/datta/Documents/Threshold` reviewed for UX patterns.
- Sponsor research conducted and recorded in `context/sponsor-research.md`. Alectra outage feed unlock identified (ArcGIS Hub). Mentor names, sessions, and outreach plan documented.
- Source catalogue drafted in `context/source-catalogue.md` — 17 sources across Tier A/B/C scoped to MVP territory.
- Geographic scope locked: **Mississauga + Brampton + Hamilton, ~400 Census Tracts.**
- Analytical unit locked: **Census Tract as `Community`,** with municipal neighbourhood / planning area / ward labels as overlay.
- Pitch framing locked: *"Threshold is the community equity and vulnerability layer that Alectra's innovation portfolio doesn't have yet, built on Esri Canada infrastructure."*

## In Progress

- None — implementation has not started in this repo.

## Next Up (ordered, pipeline-first)

1. **Ontology stub** — define `Community`, `Building`, `GridFeeder`, `Shelter`, `WeatherCell`, `PollutionSource`, `Outage`, `Advisory` as pydantic models in `backend/app/ontology.py` and as TS types in `frontend/src/lib/ontology.ts`. Schema only — no behaviour. Source-of-truth lives in `architecture.md`.
2. **Pipeline scaffolding** — set up `pipeline/sources/` with one module per source slug (empty `fetch()` and `normalize()` stubs). Add `pipeline/manifest.py` writing run-level provenance.
3. **First ingestion — A1 Census Tract boundaries** — fetch from StatsCan, filter to Toronto + Hamilton CMAs, intersect with the cities of Mississauga + Brampton + Hamilton, write to `frontend/public/data/communities.geojson`.
4. **A2 Census demographics** — fetch StatsCan Census Profile by CT, join into `Community.properties` in the same GeoJSON.
5. **A8 Alectra service area** — fetch via ArcGIS REST, flag each `Community` with `served_by_alectra` boolean, store the service-area polygon separately for map clipping.
6. **EDA notebook** — open `pipeline/EDA.ipynb`, confirm the joined ontology answers "show me Hamilton — Beasley's full record" with real numbers.
7. **First derived score** — port the weighted-composite scoring logic from the reference prototype's `config.js` into `backend/app/services/scoring.py`. Three scenarios.
8. **Frontend scaffold** — Vite + React + TS + Tailwind + shadcn + Mapbox GL. Render the choropleth from the GeoJSON. Scenario switcher recolours.
9. **A3 CIMD + A4 NRCan flood** — add as additional factors, regenerate `communities.geojson`.
10. **C1 Alectra outage feed** — enumerate FeatureServer layers, identify customer outage polygon layer, wire as Tier C overlay + start the Postgres polling archive.
11. **First ML model** — vulnerability composite NN trained on the fused Tier A features; export ONNX to `backend/models/`; expose via FastAPI.
12. **Detail panel + recommendation card** — radar chart, factor bars, source citations, LLM briefing (Gemini), recommendation card with quantified inputs.
13. **C2 weather overlay** — Environment Canada GeoMet as the second Tier C overlay.

## Open Questions

- **Alectra customer-outage layer ID.** `Outage_Details/FeatureServer` layer 0 is internal "Barriers" trace data. The customer outage polygon layer ID is unknown until we enumerate `/layers?f=json`. Block on this before estimating Tier C effort.
- **Hamilton cooling/warming centre source.** Hamilton publishes seasonal centre lists, not always as a stable open-data layer. May require scraping the City's seasonal advisory page.
- **Esri Climate Hub layer enumeration.** Open-data page is JS-rendered; needs manual browser exploration to enumerate REST endpoints.
- **GeoMet OGC API collection names.** Environment Canada renamed some collections; confirm exact names at `https://api.weather.gc.ca/collections` before wiring.
- **ArcGIS Maps SDK vs Mapbox GL.** Default Mapbox for speed. Switching to ArcGIS Maps SDK would deepen Esri sponsor alignment but costs learning time. Revisit after MVP is green.
- **DeepSeek critic layer.** Currently stretch. Confirm whether to ship dual-LLM architecture in MVP.
- **Pollution layer (PS3).** Stretch. If shipped, decide whether it's a scoring factor or overlay-only.

## Architecture Decisions

- **Geographic scope: Alectra service territory, MVP = Mississauga + Brampton + Hamilton.** Pivoted from Toronto-only after sponsor research: Toronto Hydro has closed data, Alectra is a sponsor with open data, multi-city scope strengthens the equity narrative and the platform pitch.
- **Analytical unit: Census Tract (`Community`).** Uniform across municipalities, joins directly to Census + CIMD, comparable across cities. Municipal labels overlay only.
- **Ontology entity renamed: `Neighbourhood` → `Community`.** Matches multi-city scope and product language.
- **Three-tier data architecture (A static, B daily, C live).** Adopted to be honest about data vintage. Static structural data is not faked as real-time, and live data is genuinely live.
- **Ontology-first.** All sources normalize to a shared spatial entity model before scoring or ML. The Palantir-style fusion move that makes 17+ sources legible together.
- **Numbers from models, prose from LLMs.** Hard invariant. LLMs do not produce probabilities or scores. They wrap prose around model outputs.
- **Frontend computes nothing scored.** All scoring lives in the backend. Frontend renders.
- **Fresh TypeScript build in `frontend/`.** Old JSX prototype at `/Users/datta/Documents/Threshold` is reference only.
- **PyTorch for training, ONNX for inference.** Keeps backend dependency surface small.
- **ArcGIS REST is the primary spatial-data ingestion mechanism** wherever it's available. Aligns with Esri sponsorship and gives uniform JSON access to Alectra outages + Living Atlas + Climate Hub in one stack.
- **Alectra outage data unlock confirmed.** The live feed is on ArcGIS Hub with REST/WMS/WFS/GeoJSON access. Historical archive built by polling across the hackathon window.
- **Pitch framing locked.** Threshold positions explicitly as the equity/vulnerability layer Alectra's innovation portfolio doesn't have. Stated in `project-overview.md` and `sponsor-research.md`.

## Session Notes

- Hackathon: Seneca Energy Hackathon 2026. Theme 3 (Community Energy, Equity & Sustainability), Challenge Set 03. PS1 and PS2 are MVP, PS3 stretch.
- Submission deadline: **2026-05-26 23:59 ET.** Qualifier judging 2026-05-27. Finals 2026-05-30.
- **Today is 2026-05-25.** Approximately 36 hours to submission.
- Sponsors and partners: Alectra (utility — primary alignment target), Esri Canada (platform + data library), Seneca Student Federation, Octo, GDG, Toronto Tech Week, Comunity.
- Alectra hackathon mentors: Keith Hemingway (May 26 10:00) and Daniel Carr (May 26 11:00). Esri Canada mentors: Daniel Noakes, Jonathan Van Dusen, Alex Smith (May 24 + May 25). Use Alex Smith for spatial-data and feeder-topology questions.
- Reference prototype at `/Users/datta/Documents/Threshold` is for UX patterns only (tier colours, radar chart, scenario controls, detail panel) — do not port wholesale.
- Reference Vision/PRD docs at `/Users/datta/Downloads/Threshold_Master_Vision.docx` and `/Users/datta/Downloads/Threshold_PRD.docx` are stale (Toronto-only, no fusion, no ML, no Alectra). Use only for brand language (Vision §05 product philosophy, §09 UX philosophy, §10 brand identity). PRD/Vision rewrite is a separate deliverable from the implementation; do not block code on it.
