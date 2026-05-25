# Architecture Context

## Stack

| Layer        | Technology                          | Role                                                                 |
| ------------ | ----------------------------------- | -------------------------------------------------------------------- |
| Frontend     | React 18 + TypeScript + Vite        | Map UI, scenario controls, detail and recommendation panels         |
| UI styling   | Tailwind CSS + shadcn/ui            | Dark mission-control design system, component primitives            |
| Map          | Mapbox GL JS                        | Choropleth, overlays, hover/click interactions                       |
| Charts       | Recharts                            | Radar chart, factor bars in detail panel                             |
| Backend      | FastAPI (Python 3.11+)              | API surface, ML inference, LLM orchestration, Tier C live endpoints |
| ML           | PyTorch + scikit-learn + ONNX       | Custom NN training, baseline models, portable inference             |
| LLM (primary)| Gemini 2.x (long-context)           | Briefing synthesis, multi-source narrative                           |
| LLM (critic) | DeepSeek R1 / V3                    | Chain-of-thought critique of ML outputs (stretch)                   |
| Pipeline     | Python (pandas, geopandas, httpx)   | Ingest, normalize, spatial joins, write ontology JSON               |
| Spatial API  | ArcGIS REST (sponsor-aligned)       | Primary ingestion mechanism for Alectra outages + Living Atlas      |
| Storage (A)  | Flat JSON / GeoJSON in repo         | Structural ontology, baked at build time                            |
| Storage (B)  | PostgreSQL + PostGIS                | Seasonal cache, refreshed daily by cron                              |
| Storage (C)  | In-memory + short TTL cache + Postgres archive | Live data + historical archive built by polling                  |
| Frontend host| Vercel                              | Static frontend + edge functions if needed                          |
| Backend host | Fly.io or Railway                   | FastAPI service with persistent volume for Postgres                 |

## System Boundaries

- `frontend/` — React + TypeScript app. Owns the map, scenario switching, detail panel, recommendation panel, live overlay toggles, and all client-side rendering. Talks to the backend over HTTP. Never computes scores itself — it consumes them.
- `backend/` — FastAPI service. Owns ML inference, LLM orchestration, recommendation composition, the Tier C live endpoints, and the polling archive of the Alectra outage feed. Reads from the ontology store. Does not own ingestion of Tier A.
- `pipeline/` — Single notebook (`EDA.ipynb`). Owns all ingestion, normalization, spatial joins, PCA scoring, and writing output GeoJSON/CSV files to `pipeline/data/`. Runs top-to-bottom to regenerate all data from scratch. No external scripts — everything is inline notebook cells.
- `context/` — Specification documents. Source of truth for what the system should be.
- `docs/` — Reference materials (hackathon docs, challenge sets, external references).

## Data Architecture: Three-Tier Fusion

| Tier | Refresh   | Source examples                                                                                  | Storage                       |
| ---- | --------- | ------------------------------------------------------------------------------------------------ | ----------------------------- |
| A    | Yearly    | StatsCan 2021 Census Tracts + demographics + CIMD, NRCan flood map, municipal label polygons     | Flat GeoJSON in repo          |
| B    | Daily     | Cooling centres (Miss./Bramp./Hamilton), Esri Living Atlas EJ, Esri Climate Hub heat vuln        | PostgreSQL + PostGIS          |
| C    | 5–15 min  | Alectra outages (ArcGIS REST), EnvCan GeoMet weather, EnvCan advisories, AQHI                    | In-memory + Postgres archive  |

## Ontology Model

All sources normalize to a small set of spatial entities, keyed by stable IDs. Every field on every entity records its source dataset, vintage, and confidence.

- **Community** — primary entity. **One per Census Tract.** Holds composite scores, factor sub-scores, demographic aggregates, the municipal label(s) that contain or overlap the tract, the `served_by_alectra` flag, and references to overlapping Buildings, GridFeeders, Shelters, WeatherCells, and active Outages/Advisories.
- **Building** — for retrofit/incentive targeting (PS1). Age, type, owner/renter mix proxy. Aggregated from MPAC + municipal property data; joined to Community via spatial join.
- **GridFeeder** — utility-side grid segment. For outage history and prediction. Initially scaffolded; populated only if Alectra exposes feeder topology data during the build window.
- **Shelter** — cooling/warming centres and community facilities (libraries, community centres). Location, capacity, current open/closed status. One row per facility across the three cities.
- **WeatherCell** — gridded weather observation/forecast. Current temp, humidex, wind, advisory flags.
- **PollutionSource** — for PS3. Point source with emission type and intensity. Stretch.
- **Outage** — Alectra outage polygon. Spatial-joined to overlapping Communities. Archived per poll with `polled_at` for historical sample construction.
- **Advisory** — Active weather advisory polygon (heat, cold, flood, storm). Spatial-joined to Communities.

## Storage Model

- **Tier A (flat GeoJSON in repo)**: `Community` polygons + structural attributes, baked into `frontend/public/data/communities.geojson`. Small (under 5 MB for ~400 CTs), deployed with frontend. Regenerated by pipeline run; never edited by hand.
- **PostgreSQL + PostGIS (Tier B + C archive)**: Daily-refreshed entity tables (Shelters, PollutionSources, Living Atlas EJ snapshots). Spatial indices on geometry, SRID 4326. Source provenance columns (`source_slug`, `vintage`, `fetched_at`) on every row. Postgres also archives every Alectra outage poll for the historical model-training dataset.
- **In-memory cache (Tier C live)**: FastAPI process holds short-TTL responses for weather, advisories, AQHI. Refresh on miss. Outage polls additionally persist to Postgres.
- **ML model artifacts**: ONNX files in `backend/models/`, version-pinned. Sibling JSON metadata file per artifact. Loaded once at process start.
- **LLM responses**: Not cached server-side in MVP. Streamed to client per request.

## Auth and Access Model

- No user authentication in MVP. The product is a public civic-data view.
- Backend endpoints are public read-only with rate limiting on LLM-backed routes.
- Any future write surfaces (e.g. annotation, plan-sharing) will require auth — out of MVP scope.

## Invariants

1. **Numbers come from models, prose comes from LLMs.** An LLM may never output a probability, score, count, or projection that did not originate from a model, dataset, or scoring engine. LLM output is always wrapped around numeric values it received as input.
2. **Every score on the UI is traceable in ≤2 clicks** to the input numbers and the source datasets that produced it.
3. **Pipeline work does not happen in the request path.** Ingestion, spatial joins, and model training run in `pipeline/` jobs. Backend serves precomputed results.
4. **Tier A data is immutable per deploy.** It is regenerated by a pipeline run and committed; the backend never writes to Tier A storage at runtime.
5. **Frontend computes nothing scored.** All scoring, ML inference, and recommendation composition happens in the backend.
6. **Sources are first-class.** Every persisted entity row records its source dataset slug and vintage. UI surfaces this on demand.
7. **Honest data vintage.** Real-time means real-time. Annual means annual. The product never labels static data as live.
8. **Community = Census Tract.** The analytical unit is always a Census Tract. Municipal neighbourhoods/wards/planning areas are label overlays only — they do not drive scoring or computation.
9. **Polling Alectra is archival, not active.** The Tier C archive of Alectra outage polls is for historical model training only. Live UI overlay reads from the in-memory cache, not the archive.
