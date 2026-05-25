# Source Catalogue

Authoritative record of every data source ingested into Threshold, with exact endpoints, status, and how each was fetched.

**Scope:** Brampton (MVP demo city — 122 Census Tracts in Alectra territory).  
**All fetching lives in:** `pipeline/EDA.ipynb` — no external scripts.  
**Status legend:** `planned → fetched → normalized → joined → live-in-app`

---

## Tier A — Structural (yearly, baked at build time)

### A1 · Census Tract Boundaries (StatsCan 2021)

- **Slug:** `statcan-census-tracts-2021`
- **Endpoint:** `https://www12.statcan.gc.ca/census-recensement/2021/geo/sip-pis/boundary-limites/files-fichiers/lct_000b21a_e.zip`
- **Format:** Shapefile → converted to GeoJSON via `geopandas`
- **Notebook cell:** `a1-fetch-ct-boundaries`
- **Coverage:** 1,432 CTs — Brampton + Mississauga (CMA 535) + Hamilton (CMA 537), Alectra service area
- **Output file:** `pipeline/data/master_cts.geojson` (569 CTs after Alectra clip)
- **License:** Statistics Canada Open License
- **Status:** ✅ live-in-app
- **Notes:** Filtered to `PRUID = 35` (Ontario), CMAs 535 and 537. CTUID is the join key for every other source. Cached to `data/ct_boundaries/`.

---

### A2 · 2021 Census Demographics by CT — Brampton (City ESRI ArcGIS)

- **Slug:** `brampton-esri-census2021`
- **Endpoint:** `https://services3.arcgis.com/rl7ACuZkiFsmDA2g/ArcGIS/rest/services/Census_2021/FeatureServer`
  - Layer 1 — Population: `CTUID, POPULATION_2021, TOTAL_PRIVATE_DWELLINGS`
  - Layer 6 — Housing tenure + age: `CTUID, RENTER, TOTAL_PRIV_HH_BY_TENURE_25, FROM1960_OR_BEFORE, FROM1961_TO_1980, TOTAL_PRIV_DWELL_PERIOD_25`
  - Layer 8 — Income: `CTUID, TOTAL_MED_HH_INC_2020`
  - Layer 11 — Low income: `CTUID, TOTAL_LOWINC_2020_LIM, TOTAL_PCT_LOWINC_2020_LIM`
- **Format:** JSON via ArcGIS REST `?f=json&where=1=1&outFields=...`
- **Notebook cell:** `24bc1826`
- **Coverage:** 122 Brampton Census Tracts (complete city coverage)
- **Columns produced:**
  - `population` — from `POPULATION_2021`
  - `median_income` — from `TOTAL_MED_HH_INC_2020` (2020 dollars, rounded to nearest $2,500 by StatsCan)
  - `pct_renters` — computed: `RENTER / TOTAL_PRIV_HH_BY_TENURE_25`
  - `pct_pre1980` — computed: `(FROM1960_OR_BEFORE + FROM1961_TO_1980) / TOTAL_PRIV_DWELL_PERIOD_25`
  - `pct_low_income` — from `TOTAL_PCT_LOWINC_2020_LIM / 100`
- **Output file:** `pipeline/data/brampton_full.geojson`
- **License:** City of Brampton Open Data License
- **Status:** ✅ live-in-app
- **Verified:** Population for CT 5350528.20 = 5,726 — exact match to live ESRI on 2026-05-25.

---

### A3 · Canadian Index of Social Vulnerability (CISV) — StatsCan 2021

- **Slug:** `statcan-cisv-2021`
- **Endpoint:** `https://www150.statcan.gc.ca/pub/45-20-0001/2025001/csv/cisv-eng.zip`
- **Format:** CSV zip — DA-level index scores (`cisv_scores_quintiles-eng.csv`)
- **Notebook cell:** `a3-fetch-cimd`
- **Coverage:** National — filtered to Ontario (PRUID=35), CMAs 535+537
- **DA→CT crosswalk:** `2021_92-151_X.csv` from `https://www12.statcan.gc.ca/census-recensement/2021/geo/aip-pia/attribute-attribs/files-fichiers/2021_92-151_X.zip`
- **Aggregation:** DA-level scores averaged (mean) to CT level, using deduplicated DA list per CT
- **Columns produced (CT-level mean of DA scores):**
  - `cisv_score` — overall social vulnerability composite
  - `cisv_dim1` — Dimension 1: Racialized populations & immigration status
  - `cisv_dim2` — Dimension 2: Income & labour market marginalization
  - `cisv_dim3` — Dimension 3: Education & Indigenous identity
  - `cisv_dim4` — Dimension 4: Dwelling conditions (crowding, need of major repairs)
  - `cisv_quintile` — National quintile (5 = most vulnerable)
- **Output file:** `pipeline/data/real_cisr_cisv.csv` (1,432 CTs Ontario-wide, null rate ~0.5%)
- **License:** Statistics Canada Open License
- **Status:** ✅ live-in-app
- **Verified:** CISV score for CT 5350528.20 = 0.0335 — exact match to raw StatsCan zip on 2026-05-25.
- **Reference:** Burrows et al. (2025). *Canadian Index of Social Vulnerability.* Statistics Canada Cat. No. 45-20-0001.

---

### A4 · Canadian Index of Social Resilience (CISR) — StatsCan 2021

- **Slug:** `statcan-cisr-2021`
- **Endpoint:** `https://www150.statcan.gc.ca/pub/45-20-0001/2025001/csv/cisr-eng.zip`
- **Format:** CSV zip — DA-level index scores
- **Notebook cell:** `a3-fetch-cimd` (same cell as CISV)
- **Coverage:** National — filtered to Ontario (PRUID=35), CMAs 535+537
- **Columns produced (CT-level mean of DA scores):**
  - `cisr_score` — overall social resilience composite (**inverted in PCA** — high resilience = lower vulnerability)
  - `cisr_dim1` — Dimension 1: Education, employment, dwelling quality
  - `cisr_dim2` — Dimension 2: Homeownership, income stability, working-age share
  - `cisr_dim3` — Dimension 3: Age diversity & dwelling age
  - `cisr_quintile` — National quintile (5 = most resilient)
- **Output file:** `pipeline/data/real_cisr_cisv.csv` (same file as CISV)
- **License:** Statistics Canada Open License
- **Status:** ✅ live-in-app
- **Reference:** Statistics Canada Cat. No. 45-20-0001 (2025).

---

### A5 · Brampton Secondary Plan Area Boundaries (Neighbourhood Names)

- **Slug:** `brampton-esri-secondary-plan-areas`
- **Endpoint:** `https://services3.arcgis.com/rl7ACuZkiFsmDA2g/arcgis/rest/services/Planning_Official_Plan/FeatureServer/0`
- **Format:** GeoJSON via `?f=geojson`
- **Notebook cell:** `fetch-neighbourhood-names`
- **Coverage:** 39 named Secondary Plan Areas covering all of Brampton
- **Columns produced:**
  - `neighbourhood` — human-readable area name (e.g. "Springdale", "Bramalea", "Brampton Flowertown")
- **Method:** Point-in-polygon — each CT centroid assigned to the SPA polygon it falls within
- **Output file:** `neighbourhood` column in `pipeline/data/brampton_full.geojson`
- **License:** City of Brampton Open Data License
- **Status:** ✅ live-in-app
- **Notes:** 122/122 CTs matched. No fallback needed.

---

### A6 · Alectra Service Area Boundaries

- **Slug:** `alectra-service-areas`
- **Endpoint:** ArcGIS Online item `8eba357e1b124587884bccb724743c4c`  
  `https://services8.arcgis.com/BiisLrqUuQvkdMCP/arcgis/rest/services/Alectra_Service_Areas/FeatureServer/0`
- **Format:** GeoJSON via ArcGIS REST
- **Notebook cell:** `a8-fetch-alectra-area`
- **Coverage:** 18 service area polygons (Brampton, Mississauga, Hamilton, and other Alectra municipalities)
- **Role:** Used to clip master CT list to 569 Alectra-territory CTs via point-in-polygon
- **License:** Esri/Alectra public ArcGIS Hub
- **Status:** ✅ live-in-app

---

### A7 · NRCan Federal Flood Hazard Zones

- **Slug:** `nrcan-flood-hazard`
- **Endpoint:** `https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/national_flood_hazard_layer_en/MapServer/0/query`
- **Status:** ⚠️ fetched but returned 0 polygons — all CTs marked `in_flood_zone = False`
- **Notes:** API returned HTTP 200 but no features for the Alectra bounding box. Likely correct (few federal flood zones in this area).

---

## Tier B — Seasonal (refresh daily)

### B1 · Live Weather — Current Conditions (Open-Meteo)

- **Slug:** `open-meteo-current`
- **Endpoint:** `https://api.open-meteo.com/v1/forecast`
- **Format:** JSON (free API, no key required)
- **Notebook cell:** `c2-fetch-envcan-weather`
- **Parameters fetched:** `temperature_2m, apparent_temperature, precipitation, wind_speed_10m, wind_gusts_10m, weather_code`
- **Columns produced:**
  - `temperature_c` — current air temperature (°C)
  - `humidex` — apparent temperature / feels-like (°C), used as heat stress proxy
  - `precipitation_mm` — current precipitation (mm)
  - `wind_speed_kmh` — current wind speed at 10m
  - `wind_gusts_kmh` — peak gusts
  - `weather_code` — WMO code (0=clear, 61=rain, 71=snow, 95=thunderstorm)
- **Output file:** `pipeline/data/weather_ct.csv` (684 CTs, 0 nulls for current conditions)
- **License:** Open-Meteo CC-BY 4.0
- **Status:** ✅ live-in-app
- **Verified:** Temperature for sample CT = 19.8°C — exact match to live API on 2026-05-25.
- **Notes:** Grid resolution ~1 km. Coordinates are CT polygon centroids (WGS84). Re-run notebook to refresh.

---

## Tier C — Live (refresh 5–15 min)

### C1 · Alectra Live Power Outage Feed

- **Slug:** `alectra-outages-live`
- **Endpoint:** `https://services8.arcgis.com/wNDmObY7QplwZD9m/ArcGIS/rest/services/Outage_Details/FeatureServer/7`
  - Layer 7 = "Outage Area" polygons (auto-detected by notebook from layer list)
- **Format:** GeoJSON via `?f=geojson&where=1=1&outFields=*`
- **Notebook cell:** `c1-fetch-alectra-outages`
- **Spatial join:** outage polygons → CT boundaries via `gpd.sjoin(cts, outages, predicate="intersects")`
- **Columns produced:**
  - `active_outages` — count of outage polygons overlapping this CT
  - `customers_affected` — sum of `CUSTOUT` from overlapping outage features
- **Output:** Joined into `master_cts.geojson` and `brampton_full.geojson`
- **License:** Esri/Alectra public ArcGIS Hub — public access permitted
- **Status:** ✅ live-in-app (11 active outages detected on 2026-05-25 — all in Tennessee, not Ontario)
- **Notes:** Layer auto-detected: notebook enumerates all layers and selects first polygon layer matching "outage" or "area" in the name.

---

## Community Facilities

### F1 · Brampton Recreation Centres

- **Slug:** `brampton-esri-recreation`
- **Endpoint:** `https://services3.arcgis.com/rl7ACuZkiFsmDA2g/arcgis/rest/services/RecreationFacilities/FeatureServer/0`
- **Notebook cell:** `fetch-brampton-facilities`
- **Coverage:** 38 active recreation facilities (community centres, arenas, sports complexes)
- **Role:** Labelled as "Cooling & Warming Centres"
- **License:** City of Brampton Open Data License
- **Status:** ✅ live-in-app
- **Verified:** First 5 facility names match live ESRI on 2026-05-25.

---

### F2 · Brampton Libraries

- **Slug:** `brampton-esri-libraries`
- **Endpoint:** `https://services3.arcgis.com/rl7ACuZkiFsmDA2g/arcgis/rest/services/Libraries/FeatureServer/0`
- **Notebook cell:** `fetch-brampton-facilities`
- **Coverage:** 7 library branches
- **Role:** Labelled as "Cooling Centres"
- **License:** City of Brampton Open Data License
- **Status:** ✅ live-in-app

---

## Computed Outputs

### Score · Threshold Vulnerability Score

- **Slug:** `threshold-score-pca`
- **Method:** Principal Component Analysis (PCA), PC1 rescaled 0–100
- **Library:** `sklearn.decomposition.PCA` + `sklearn.preprocessing.StandardScaler`
- **Notebook cell:** `section4-pca-score`
- **Input factors (all standardized before PCA):**

  | Factor | Direction | Notes |
  |--------|-----------|-------|
  | `cisv_score` | ↑ vulnerable | Highest loading |
  | `cisv_dim4` (dwelling conditions) | ↑ vulnerable | |
  | `cisv_dim2` (income/labour) | ↑ vulnerable | |
  | `cisv_dim3` (education) | ↑ vulnerable | |
  | `cisv_dim1` (racialized/immigration) | ↑ vulnerable | |
  | `pct_pre1980` | ↑ vulnerable | |
  | `pct_renters` | ↑ vulnerable | |
  | `humidex` | ↑ vulnerable | Weather factor |
  | `cisr_score` | **inverted** (high = resilient) | |
  | `median_income` | **inverted** (high = less vulnerable) | |

- **PC1 explained variance:** ~35% of total variation across Brampton CTs
- **Rescaling:** `score = (PC1 − min) / (max − min) × 100`
- **Risk buckets:** Low (0–25) · Moderate (25–50) · High (50–75) · Critical (75–100)
- **Scenarios:**
  - **Baseline** — equal weights
  - **Heatwave** — humidex weight × 2.5, pct_renters × 1.2
  - **Ice Storm** — active_outages × 3.0, customers_affected × 2.0, pct_renters × 1.5
- **Output columns:** `threshold_score_baseline`, `threshold_score_heatwave`, `threshold_score_icestorm`, `threshold_score` (= baseline), `risk_level`
- **Loadings file:** `pipeline/data/loadings.csv`

---

## Data Gaps & Known Issues

| Gap | Impact | Status |
|-----|--------|--------|
| NRCan flood zones empty | `in_flood_zone` all False | API returned no features for study area |
| No Mississauga/Hamilton CT census | Only Brampton has real census demographics | City portals block programmatic access |
| Historical weather mostly null | `heat_days_per_yr` etc. present in CSV but mostly missing | Open-Meteo archive rate-limited |
| Alectra outages were in Tennessee | `active_outages` = 0 for all Ontario CTs at last run | Feed is real, just no Ontario outages active |
