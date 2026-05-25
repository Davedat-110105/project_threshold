# Source Catalogue

Authoritative record of every data source ingested into Threshold, with exact endpoints, status, and how each was fetched.

**Scope:** Brampton (MVP demo city — 122 Census Tracts in Alectra territory).
**Status legend:** `planned → fetched → normalized → joined → live-in-app`

---

## Tier A — Structural (yearly, baked at build time)

### A1 · Census Tract Boundaries (StatsCan 2021)

- **Slug:** `statcan-census-tracts-2021`
- **Endpoint:** StatsCan 2021 Census — Digital Boundary File  
  `https://www12.statcan.gc.ca/census-recensement/2021/geo/sip-pis/boundary-limites/`
- **Format:** Shapefile → converted to GeoJSON via `geopandas`
- **Pipeline script:** Loaded inside `pipeline/EDA.ipynb` cell `a1-fetch-boundaries`
- **Coverage:** 569 CTs — Brampton + Mississauga (CMA 535) + Hamilton (CMA 537), Alectra service area
- **Output file:** `pipeline/data/master_cts.geojson` (569 CTs, geometry + CTUID + DGUID)
- **License:** Statistics Canada Open License
- **Status:** ✅ live-in-app
- **Notes:** Filtered to `PRUID = 35` (Ontario), CMAs 535 and 537. CTUID is the join key for every other source.

---

### A2 · 2021 Census Demographics by CT — Brampton (City ESRI ArcGIS)

- **Slug:** `brampton-esri-census2021`
- **Endpoint:** City of Brampton ArcGIS FeatureServer (Census 2021 by Census Tract)  
  `https://services3.arcgis.com/rl7ACuZkiFsmDA2g/ArcGIS/rest/services/Census_2021/FeatureServer`
  - Layer 1 — Population: `CTUID, POPULATION_2021, TOTAL_PRIVATE_DWELLINGS`
  - Layer 6 — Housing tenure + age: `CTUID, RENTER, TOTAL_PRIV_HH_BY_TENURE_25, FROM1960_OR_BEFORE, FROM1961_TO_1980, TOTAL_PRIV_DWELL_PERIOD_25`
  - Layer 8 — Income: `CTUID, TOTAL_MED_HH_INC_2020`
  - Layer 11 — Low income: `CTUID, TOTAL_LOWINC_2020_LIM, TOTAL_PCT_LOWINC_2020_LIM`
- **Format:** JSON via ArcGIS REST `?f=json&where=1=1&outFields=...`
- **Pipeline script:** `pipeline/build_map.py` (inline fetch), also `pipeline/EDA.ipynb`
- **Coverage:** 122 Brampton Census Tracts (complete city coverage)
- **Columns produced:**
  - `population` — from `POPULATION_2021`
  - `median_income` — from `TOTAL_MED_HH_INC_2020` (2020 dollars)
  - `pct_renters` — computed: `RENTER / TOTAL_PRIV_HH_BY_TENURE_25`
  - `pct_pre1980` — computed: `(FROM1960_OR_BEFORE + FROM1961_TO_1980) / TOTAL_PRIV_DWELL_PERIOD_25`
- **Output file:** `pipeline/data/brampton_full.geojson`
- **License:** City of Brampton Open Data License
- **Status:** ✅ live-in-app
- **Notes:** All 57 CT-level census layers are available at this FeatureServer. We use 4. Data is 2021 Canadian Census of Population.

---

### A3 · Canadian Index of Social Vulnerability (CISV) — StatsCan 2021

- **Slug:** `statcan-cisv-2021`
- **Endpoint:** `https://www150.statcan.gc.ca/pub/45-20-0001/2025001/csv/cisv-eng.zip`
- **Format:** CSV zip — DA-level index scores
- **Pipeline script:** `pipeline/build_cisr_cisv.py`
- **Coverage:** National — filtered to Ontario (PRUID=35), CMAs 535+537
- **DA→CT crosswalk:** `2021_92-151_X.csv` from `https://www12.statcan.gc.ca/census-recensement/2021/geo/aip-pia/attribute-attribs/files-fichiers/2021_92-151_X.zip`
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
- **Reference:** Burrows et al. (2025). *Canadian Index of Social Vulnerability.* Statistics Canada Cat. No. 45-20-0001.

---

### A4 · Canadian Index of Social Resilience (CISR) — StatsCan 2021

- **Slug:** `statcan-cisr-2021`
- **Endpoint:** `https://www150.statcan.gc.ca/pub/45-20-0001/2025001/csv/cisr-eng.zip`
- **Format:** CSV zip — DA-level index scores
- **Pipeline script:** `pipeline/build_cisr_cisv.py` (same script as CISV)
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
- **Endpoint:** City of Brampton — Planning Official Plan FeatureServer  
  `https://services3.arcgis.com/rl7ACuZkiFsmDA2g/arcgis/rest/services/Planning_Official_Plan/FeatureServer/0`
- **Format:** GeoJSON via `?f=geojson`
- **Pipeline script:** `pipeline/build_map.py` — spatial join CT centroid → SPA polygon
- **Coverage:** 39 named Secondary Plan Areas covering all of Brampton
- **Columns produced:**
  - `neighbourhood` — human-readable area name (e.g. "Springdale", "Bramalea", "Brampton Flowertown")
- **Output file:** `neighbourhood` column in `pipeline/data/brampton_full.geojson`
- **License:** City of Brampton Open Data License
- **Status:** ✅ live-in-app
- **Notes:** Each CT centroid is point-in-polygon joined to its SPA. All 122 CTs matched (no fallback needed).

---

### A6 · NRCan Federal Flood Hazard Zones

- **Slug:** `nrcan-flood-hazard`
- **Endpoint:** `https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/national_flood_hazard_layer_en/MapServer/0/query`
- **Format:** GeoJSON via ArcGIS REST
- **Pipeline script:** `pipeline/build_weather.py`
- **Coverage:** Bounding box `-81.0,42.8,-78.5,44.2` (Alectra territory)
- **Columns produced:** `in_flood_zone` (boolean)
- **Output file:** `pipeline/data/weather_ct.csv`
- **License:** Open Government Licence — Canada
- **Status:** ⚠️ fetched but returned 0 polygons — all CTs marked `False`
- **Notes:** Layer returned HTTP 200 but no features for this bounding box. Likely correct (few federal flood zones in this area). Provincial MNRF layers would give more coverage but require a separate request.

---

## Tier B — Seasonal (refresh daily)

### B1 · Live Weather — Current Conditions (Open-Meteo)

- **Slug:** `open-meteo-current`
- **Endpoint:** `https://api.open-meteo.com/v1/forecast`
- **Format:** JSON (free API, no key required)
- **Pipeline script:** `pipeline/build_weather.py` — Step 1, batched by 10 CT centroids
- **Parameters fetched:** `temperature_2m, apparent_temperature, precipitation, wind_speed_10m, wind_gusts_10m, weather_code`
- **Columns produced:**
  - `temperature_c` — current air temperature (°C)
  - `humidex` — apparent temperature / feels-like (°C), used as heat stress proxy
  - `precipitation_mm` — current precipitation (mm)
  - `wind_speed_kmh` — current wind speed at 10m
  - `wind_gusts_kmh` — peak gusts
  - `weather_code` — WMO code (0=clear, 61=rain, 71=snow, 95=thunderstorm)
- **Output file:** `pipeline/data/weather_ct.csv` + joined into `pipeline/data/brampton_full.geojson`
- **License:** Open-Meteo CC-BY 4.0
- **Status:** ✅ live-in-app (569 CTs, 0 nulls)
- **Notes:** Grid resolution ~1km. Coordinates are CT polygon centroids (WGS84). Called once per build; refresh by re-running `build_weather.py`.

---

### B2 · Historical Climate Stats 2019–2024 (Open-Meteo Archive)

- **Slug:** `open-meteo-historical`
- **Endpoint:** `https://archive-api.open-meteo.com/v1/archive`
- **Format:** JSON (free API, no key required)
- **Pipeline script:** `pipeline/build_weather.py` — Step 2, one call per CT
- **Parameters fetched:** `temperature_2m_max, temperature_2m_min, precipitation_sum, wind_speed_10m_max` — daily, 2019-01-01 to 2024-12-31
- **Columns produced (annual averages over 6 years):**
  - `heat_days_per_yr` — days/yr with max temp > 30°C
  - `hot_days_per_yr` — days/yr with max temp > 25°C
  - `frost_days_per_yr` — days/yr with min temp < 0°C
  - `freezing_days_per_yr` — days/yr with max temp < 0°C
  - `annual_precip_mm` — mean annual total precipitation
  - `heavy_rain_days_per_yr` — days/yr with precip > 25mm
  - `max_24h_precip_mm` — highest single-day rainfall on record (2019–2024)
  - `max_wind_gust_kmh` — peak recorded wind gust (2019–2024)
- **Output file:** `pipeline/data/weather_ct.csv`
- **License:** Open-Meteo CC-BY 4.0
- **Status:** ⚠️ partial — 72/569 CTs populated (API rate-limited during bulk fetch). Not used in PCA scoring.
- **Notes:** The archive API is free but throttles at ~50–100 requests/min. Re-run `build_weather.py` with increased sleep to fill remaining nulls.

---

## Tier C — Live (refresh 5–15 min)

### C1 · Alectra Live Power Outage Feed

- **Slug:** `alectra-outages-live`
- **Endpoint:** Alectra Utilities — ArcGIS FeatureServer (public)  
  `https://services8.arcgis.com/wNDmObY7QplwZD9m/ArcGIS/rest/services/Outage_Details/FeatureServer/7`
  - Layer 7 = "Outage Area" polygons (confirmed by enumerating layers endpoint)
- **Format:** GeoJSON via `?f=geojson&where=1=1&outFields=*`
- **Pipeline script:** `pipeline/EDA.ipynb` cell `c1-fetch-outages`
- **Spatial join:** outage polygons → CT boundaries via `gpd.sjoin(cts, outages, predicate="intersects")`
- **Columns produced:**
  - `active_outages` — count of outage polygons overlapping this CT
  - `customers_affected` — sum of `CUSTOMERS_AFFECTED` from overlapping outage features
- **Output:** Joined directly into `master_cts.geojson` + `brampton_full.geojson`
- **License:** Esri/Alectra public ArcGIS Hub — public access permitted
- **Status:** ✅ live-in-app (0 active outages at time of last run)
- **Notes:** Currently 0 active outages — columns present but zero-valued. During an actual outage event, these will populate automatically on next pipeline run.

---

## Community Facilities

### F1 · Brampton Recreation Centres

- **Slug:** `brampton-esri-recreation`
- **Endpoint:** `https://services3.arcgis.com/rl7ACuZkiFsmDA2g/arcgis/rest/services/RecreationFacilities/FeatureServer/0`
- **Format:** GeoJSON via `?f=geojson`
- **Pipeline script:** `pipeline/build_map.py`
- **Coverage:** 38 active recreation facilities (community centres, arenas, sports complexes)
- **Role in app:** Labelled as "Cooling & Warming Centres" — these are Brampton's designated emergency shelters during heatwaves and ice storms
- **Fields used:** `FACILITY_NAME, ADDRESS, TYPE, STATUS, WEBSITE`
- **Output file:** `pipeline/data/brampton_facilities.geojson`
- **License:** City of Brampton Open Data License
- **Status:** ✅ live-in-app

---

### F2 · Brampton Libraries

- **Slug:** `brampton-esri-libraries`
- **Endpoint:** `https://services3.arcgis.com/rl7ACuZkiFsmDA2g/arcgis/rest/services/Libraries/FeatureServer/0`
- **Format:** GeoJSON via `?f=geojson`
- **Pipeline script:** `pipeline/build_map.py`
- **Coverage:** 7 library branches (Brampton Library system)
- **Role in app:** Labelled as "Cooling Centres" — air-conditioned public spaces open during heat events
- **Fields used:** `FACILITY_NAME, ADDRESS, TYPE, STATUS`
- **Output file:** `pipeline/data/brampton_facilities.geojson`
- **License:** City of Brampton Open Data License
- **Status:** ✅ live-in-app

---

## Computed Outputs

### Score · Threshold Vulnerability Score

- **Slug:** `threshold-score-pca`
- **Method:** Principal Component Analysis (PCA), PC1 rescaled 0–100
- **Library:** `sklearn.decomposition.PCA` + `sklearn.preprocessing.StandardScaler`
- **Input factors (all standardized before PCA):**

  | Factor | Direction | Weight (loading) |
  |--------|-----------|-----------------|
  | `cisv_score` | ↑ vulnerable | 0.537 |
  | `cisv_dim4` (dwelling conditions) | ↑ vulnerable | 0.439 |
  | `cisv_dim2` (income/labour) | ↑ vulnerable | 0.368 |
  | `cisv_dim3` (education) | ↑ vulnerable | 0.307 |
  | `cisv_dim1` (racialized/immigration) | ↑ vulnerable | 0.083 |
  | `pct_pre1980` | ↑ vulnerable | 0.054 |
  | `pct_renters` | ↑ vulnerable | 0.053 |
  | `cisr_score` | **inverted** (high = resilient) | −0.054 |
  | `median_income` | **inverted** (high = less vulnerable) | −0.002 |
  | `humidex` | ↑ vulnerable | context-dependent |

- **PC1 explained variance:** ~33% of total variation across Brampton CTs
- **Rescaling:** `score = (PC1 − min) / (max − min) × 100`
- **Interpretation:** Relative ranking within Brampton. Score 100 = highest vulnerability CT in the city. Score 0 = lowest.
- **Risk buckets:** Low (0–25) · Moderate (25–50) · High (50–75) · Critical (75–100)
- **Output column:** `threshold_score` in `pipeline/data/brampton_full.geojson`
- **Loadings file:** `pipeline/data/loadings.csv`

---

## Data Gaps & Known Issues

| Gap | Impact | Status |
|-----|--------|--------|
| Historical weather 87% null | `heat_days_per_yr` etc. mostly missing — not used in PCA | Open-Meteo rate limiting |
| NRCan flood zones empty | `in_flood_zone` all False | API returned no features for study area |
| No Mississauga CT census | Mississauga CTs use synthetic demographics | City portal blocks programmatic access |
| No Hamilton CT census for 80/129 CTs | Partial real data; rest synthetic | Hamilton 2016 data, partial CT coverage |
