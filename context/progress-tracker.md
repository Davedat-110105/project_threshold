# Progress Tracker

Last updated: 2026-05-25. Hackathon deadline: **2026-05-26 23:59 ET.**

---

## Current Phase

**Data pipeline complete for Brampton (MVP demo city). Interactive map built and running. App build not yet started.**

---

## Completed

### Data Pipeline

- ✅ **CT Boundaries** — 569 CTs (Brampton + Mississauga + Hamilton) loaded from StatsCan 2021 boundary file into `master_cts.geojson`
- ✅ **CISV / CISR** — Real StatsCan 2021 indices downloaded, DA→CT crosswalk built, aggregated to CT level → `real_cisr_cisv.csv` (1,432 CTs, ~0.5% null). Script: `pipeline/build_cisr_cisv.py`
- ✅ **Brampton Census 2021** — All 4 census layers fetched from Brampton ESRI ArcGIS FeatureServer (Layer 1/6/8/11): population, median income, pct_renters, pct_pre1980. 122 CTs, real 2021 data.
- ✅ **Brampton Neighbourhood Names** — 39 Secondary Plan Areas fetched from Brampton's Planning Official Plan FeatureServer. Spatial-joined to all 122 CTs (100% coverage). Names like "Springdale", "Bramalea", "Brampton Flowertown".
- ✅ **Live Weather** — Open-Meteo current conditions per CT centroid (temperature, humidex, wind, precipitation). 569/569 CTs. Script: `pipeline/build_weather.py`
- ✅ **Alectra Live Outages** — ArcGIS FeatureServer Layer 7 connected. 0 active outages at time of last run. Feed wired into `master_cts.geojson`.
- ✅ **Brampton Facilities** — 38 recreation centres + 7 libraries fetched from Brampton ESRI. Labelled as cooling/warming centres. → `brampton_facilities.geojson`
- ✅ **PCA Vulnerability Score** — PC1 computed across 9 factors. Rescaled 0–100. 122/122 Brampton CTs scored. Risk buckets: Low/Moderate/High/Critical.
- ✅ **`brampton_full.geojson`** — Master Brampton dataset: 122 CTs, all census + CISV/CISR + weather + scores + neighbourhood names.

### EDA Notebook

- ✅ `pipeline/EDA.ipynb` — 21 cells, fully executed
  - Section 1: CT boundary load + Alectra spatial join
  - Section 2: Census demographics join (A2)
  - Section 3: CISV/CISR join (A3/A4)
  - Section 4: Live weather + outages (B1/C1)
  - Section 5: Distribution plots + correlation heatmap
  - Section 6: PCA scoring — 3 scenarios (Baseline, Heatwave, Ice Storm)
  - Section 7: Choropleth map output
  - Loadings exported → `pipeline/data/loadings.csv`

### Map

- ✅ `pipeline/build_map.py` — Folium interactive HTML map
  - Layer 1: Threshold Score choropleth (green→red, 0–100)
  - Layer 2: CISV Social Vulnerability overlay
  - Layer 3: Live Temperature overlay
  - Layer 4: Recreation centres + libraries as facility pins
  - Click popup: neighbourhood name + all data fields + data source citations
  - Hover tooltip: neighbourhood name + score + risk level
  - Output: `pipeline/data/brampton_map.html`

---

## In Progress

- Nothing actively running.

---

## Not Started

- [ ] FastAPI backend (scoring endpoint, live data proxy)
- [ ] React frontend (Mapbox choropleth, scenario switcher, detail panel)
- [ ] Deployment (Vercel + Fly.io / Railway)

---

## Pipeline Scripts Reference

| Script | Purpose | Output |
|--------|---------|--------|
| `pipeline/build_cisr_cisv.py` | Download + aggregate StatsCan CISV/CISR from DA to CT | `data/real_cisr_cisv.csv` |
| `pipeline/build_weather.py` | Fetch Open-Meteo current + historical weather per CT | `data/weather_ct.csv` |
| `pipeline/build_map.py` | Build Folium HTML map from `brampton_full.geojson` + facilities | `data/brampton_map.html` |
| `pipeline/generate_demo_data.py` | Generate synthetic census fallback for Mississauga CTs | `data/demo_census.csv` |
| `pipeline/EDA.ipynb` | Full EDA: load → join → score → visualize | `data/brampton_full.geojson`, `data/loadings.csv` |

---

## Data Files Reference

| File | Description | Size | Real/Synthetic |
|------|-------------|------|----------------|
| `data/brampton_full.geojson` | **Primary app dataset** — 122 Brampton CTs, all fields + score | 497K | Real |
| `data/brampton_facilities.geojson` | 45 cooling/warming centre locations | 17K | Real |
| `data/brampton_map.html` | Interactive Folium map | 2.2M | — |
| `data/master_cts.geojson` | All 569 Alectra-territory CTs (Brampton + Mississauga + Hamilton) | 4.5M | Mixed |
| `data/real_cisr_cisv.csv` | StatsCan CISV+CISR for 1,432 Ontario CTs | 122K | Real |
| `data/weather_ct.csv` | Weather data for 569 CTs | 36K | Real (partial) |
| `data/demo_census.csv` | Synthetic census fallback for Mississauga | 50K | Synthetic |
| `data/loadings.csv` | PCA factor loadings for 3 scenarios | 1K | Computed |

---

## Architecture Decisions Made

- **Narrowed scope to Brampton** for MVP demo. Best data coverage: real ESRI census, CISV/CISR, neighbourhood names, facilities — all from Brampton's own ArcGIS FeatureServer.
- **PCA not neural net** for scoring. With 122 CTs and 9 factors, PCA is more defensible and explainable to judges than a black-box model. Every loading is visible in `loadings.csv`.
- **Folium for map** (Python-native, no Mapbox token needed, produces shareable HTML). App-quality frontend deferred.
- **Open-Meteo** instead of Environment Canada GeoMet for weather — simpler API, no key, cleaner per-point JSON.
- **CISV/CISR instead of CIMD** — CIMD (Canadian Index of Multiple Deprivation) was originally planned but CISV/CISR (2025 release) are StatsCan's newer, more granular indices. CISR adds the resilience dimension which CIMD lacks.

---

## Known Data Gaps

| Gap | Workaround |
|-----|-----------|
| Mississauga CT census (city portal blocks access) | Synthetic data calibrated to city averages |
| Historical weather 87% null (Open-Meteo rate limiting) | Not used in PCA; contextual display only |
| NRCan flood zones returned empty | `in_flood_zone` = False for all CTs |
| No active Alectra outages | Columns present, will populate during real event |

---

## Submission Checklist

- [ ] Public URL live (deploy frontend or share Folium HTML)
- [ ] Data provenance visible in app (source citations on every popup)
- [ ] All 3 scenarios working (Baseline / Heatwave / Ice Storm)
- [ ] Demo video / slides updated with real neighbourhood names
- [ ] `context/source-catalogue.md` up to date ← done ✅
- [ ] `pipeline/EDA.ipynb` re-run clean top-to-bottom ← pending
