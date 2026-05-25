# Source Catalogue

Authoritative catalogue of every data source Threshold ingests, with status, ontology mapping, and refresh tier.

Scope: **MVP — Alectra service territory across Mississauga, Brampton, and Hamilton.** Additional Alectra communities (Vaughan, Markham, Guelph, Barrie, etc.) added post-MVP.

Status legend: `not-started → fetched → normalized → joined → live-in-app`.

## Tier A — Structural (yearly, baked at build time)

### A1 · Census Tract boundaries (StatsCan)

- **Slug:** `statcan-census-tracts-2021`
- **Entity:** `Community` (geometry, id, name)
- **Coverage:** Mississauga + Brampton + Hamilton ≈ 400 CTs
- **Endpoint:** StatsCan Geography boundary files (cartographic). `https://www150.statcan.gc.ca/n1/en/catalogue/92-160-X` (CT polygons in lpr_000a16a_e or 2021 equivalent).
- **Format:** Shapefile / GeoJSON after conversion with `geopandas`.
- **Refresh:** Census cycle (~5 years). Next refresh 2027 with 2026 Census release.
- **License:** Statistics Canada Open License.
- **Status:** not-started
- **Notes:** The primary spatial spine. Every other Tier A source spatial-joins to this. Filter to CMAs of Toronto (35535) and Hamilton (35537) at ingest time to drop everything outside scope.

### A2 · 2021 Census demographics by CT (StatsCan)

- **Slug:** `statcan-census-2021-ct-demographics`
- **Entity:** `Community.demographics` (population, median income, age structure, dwelling age, renter/owner mix, recent-immigrant share)
- **Endpoint:** StatsCan Census Profile by CT, via web data service or bulk CSV. `https://www150.statcan.gc.ca/n1/en/type/data`
- **Format:** CSV (wide), reshaped to long form per CT.
- **Refresh:** Census cycle.
- **License:** Statistics Canada Open License.
- **Status:** not-started
- **Notes:** Source for energy-burden inputs (income × renter share × dwelling age). Drives Theme 3 PS1 directly.

### A3 · Canadian Index of Multiple Deprivation (CIMD) by CT

- **Slug:** `statcan-cimd-2021`
- **Entity:** `Community.vulnerability` (residential instability, economic dependency, ethno-cultural composition, situational vulnerability)
- **Endpoint:** `https://www150.statcan.gc.ca/n1/en/catalogue/45200001`
- **Format:** CSV joinable on CT UID.
- **Refresh:** Census cycle.
- **License:** Statistics Canada Open License.
- **Status:** not-started
- **Notes:** Replaces the retired Toronto Heat Vulnerability Index. CIMD is national, uniform, peer-reviewed, and joins directly on CTUID — the cleanest path to a vulnerability factor.

### A4 · NRCan Flood Hazard

- **Slug:** `nrcan-flood-hazard`
- **Entity:** `Community.flood_exposure` (percent area in mapped flood zone)
- **Endpoint:** `https://open.canada.ca` — Federal Flood Mapping Framework / Flood Hazard Inventory.
- **Format:** GeoJSON / Shapefile per province.
- **Refresh:** Annual or on advisory.
- **License:** Open Government Licence — Canada.
- **Status:** not-started
- **Notes:** Spatial join via `geopandas.overlay`, compute `intersect_area / community_area` per CT.

### A5 · Hamilton neighbourhoods (Code Red dataset)

- **Slug:** `hamilton-open-neighbourhoods`
- **Entity:** `Community.municipal_label` (Hamilton-only)
- **Endpoint:** Hamilton Open Data Portal — Neighbourhoods layer. Search at `https://open.hamilton.ca`.
- **Format:** GeoJSON.
- **Refresh:** Rare; on neighbourhood-scheme revision.
- **License:** Open Government Licence — Hamilton.
- **Status:** not-started
- **Notes:** 135 named neighbourhoods, used as a label overlay on the CT-keyed `Community`. Maps to the canonical Code Red equity narrative. Strategic anchor for the demo.

### A6 · Mississauga community planning areas

- **Slug:** `mississauga-open-planning-areas`
- **Entity:** `Community.municipal_label` (Mississauga-only)
- **Endpoint:** Mississauga Open Data Portal. `https://data.mississauga.ca`.
- **Format:** GeoJSON.
- **Refresh:** Rare.
- **License:** Open Government Licence — Mississauga.
- **Status:** not-started
- **Notes:** No official "neighbourhoods" in Mississauga open data; planning areas are the cleanest label source.

### A7 · Brampton wards

- **Slug:** `brampton-open-wards`
- **Entity:** `Community.municipal_label` (Brampton-only)
- **Endpoint:** Brampton Open Data Portal. `https://geohub.brampton.ca`.
- **Format:** GeoJSON.
- **Refresh:** Rare.
- **License:** Open Government Licence — Brampton.
- **Status:** not-started
- **Notes:** Wards used as the label scheme since Brampton lacks a uniform neighbourhood scheme. Less granular than Hamilton but accurate.

### A8 · Alectra service area

- **Slug:** `alectra-service-area`
- **Entity:** `Community.served_by_alectra` (boolean) + service-area polygon for map clipping
- **Endpoint:** ArcGIS Online item — `https://www.arcgis.com/home/item.html?id=8eba357e1b124587884bccb724743c4c`
- **Format:** GeoJSON via ArcGIS REST `?f=geojson`.
- **Refresh:** Rare.
- **License:** Esri Living Atlas item terms.
- **Status:** not-started
- **Notes:** Identifies which CTs sit in Alectra territory. Critical for the demo narrative.

## Tier B — Seasonal (refresh daily, server-cached)

### B1 · Esri Living Atlas — environmental justice layers

- **Slug:** `esri-living-atlas-ej-canada`
- **Entity:** `Community.env_justice` (composite indicator from Living Atlas EJ overlays)
- **Endpoint:** Per-layer ArcGIS REST FeatureServer URLs to be enumerated from `https://livingatlas.arcgis.com`. Filter by Canada coverage.
- **Format:** GeoJSON via `?f=geojson`.
- **Refresh:** Daily pull, monthly source updates.
- **License:** Esri Living Atlas terms.
- **Status:** not-started
- **Notes:** Use student ArcGIS Online account for highest-resolution access.

### B2 · Esri Canada Climate Hub — heat vulnerability layers

- **Slug:** `esri-canada-climate-heat-vuln`
- **Entity:** `Community.heat_vulnerability`
- **Endpoint:** `https://climate.esri.ca/` — specific layer URLs to be enumerated by browser exploration (page is JS-rendered, see sponsor-research.md).
- **Format:** GeoJSON / REST.
- **Refresh:** Daily.
- **License:** Esri Canada Climate Hub terms.
- **Status:** not-started

### B3 · Cooling and warming centres — Mississauga

- **Slug:** `mississauga-cooling-centres`
- **Entity:** `Shelter` (location, capacity, open_status)
- **Endpoint:** Mississauga Open Data Portal — cooling/warming centre layer.
- **Format:** GeoJSON / CSV.
- **Refresh:** Daily.
- **License:** OGL Mississauga.
- **Status:** not-started

### B4 · Cooling and warming centres — Brampton

- **Slug:** `brampton-cooling-centres`
- **Entity:** `Shelter`
- **Endpoint:** Brampton Open Data Portal.
- **Format:** GeoJSON / CSV.
- **Refresh:** Daily.
- **License:** OGL Brampton.
- **Status:** not-started

### B5 · Cooling and warming centres — Hamilton

- **Slug:** `hamilton-cooling-centres`
- **Entity:** `Shelter`
- **Endpoint:** Hamilton Open Data Portal — community centres + library locations as warming/cooling proxies (Hamilton's centre list is published seasonally).
- **Format:** GeoJSON / CSV.
- **Refresh:** Daily.
- **License:** OGL Hamilton.
- **Status:** not-started

### B6 · Air-quality monitoring stations (Ontario MECP / Environment Canada)

- **Slug:** `envcan-aqhi-stations`
- **Entity:** `PollutionSource` (station type) and overlay layer for current AQHI
- **Endpoint:** Environment Canada Meteorological Service AQHI data. Station metadata at `https://api.weather.gc.ca/collections/aqhi-observations-realtime`.
- **Format:** OGC API Features / GeoJSON.
- **Refresh:** Hourly station data, daily metadata.
- **License:** Environment Canada Open Government Licence.
- **Status:** not-started
- **Notes:** Stretch — addresses Theme 3 PS3.

## Tier C — Live (refresh 5–15 min, in-memory cache)

### C1 · 🔓 Alectra Outage feed — customer outage polygons

- **Slug:** `alectra-outages-live`
- **Entity:** `Outage` (polygon, customers_affected, cause, started_at, estimated_restoration) → spatial join to overlapping `Community`
- **Endpoint:** `https://services8.arcgis.com/wNDmObY7QplwZD9m/ArcGIS/rest/services/Outage_Details/FeatureServer` — **specific layer ID TBD.** Layer 0 confirmed to be internal "Barriers" / trace points. Enumerate `/layers?f=json` to find the customer outage areas layer.
- **Format:** GeoJSON via `?f=geojson&where=1=1&outFields=*`.
- **Refresh:** 5 min poll.
- **License:** ArcGIS Hub public item; usage permitted under Esri Canada apps terms.
- **Status:** not-started
- **Notes:** 🔓 **The unlock.** Sponsor-aligned (Alectra data on Esri infrastructure). Build historical archive by polling across the hackathon window — store every poll's snapshot to Postgres with `polled_at` timestamp.

### C2 · Environment Canada GeoMet — current weather

- **Slug:** `envcan-geomet-current`
- **Entity:** `WeatherCell` (temperature, humidex, wind, advisory_flags) → spatial join to overlapping `Community`
- **Endpoint:** `https://api.weather.gc.ca/collections/` — observations and forecasts. OGC API Features.
- **Format:** GeoJSON.
- **Refresh:** 10 min.
- **License:** Environment Canada Open Government Licence.
- **Status:** not-started
- **Notes:** Source for the live overlay and for the heat-stress model's runtime input.

### C3 · Environment Canada — active weather advisories

- **Slug:** `envcan-advisories`
- **Entity:** `Advisory` (type, severity, area, valid_from, valid_to) → spatial join to `Community`
- **Endpoint:** Environment Canada MSC Datamart / GeoMet alerts.
- **Format:** GeoJSON / CAP XML.
- **Refresh:** 5 min.
- **License:** OGL — Canada.
- **Status:** not-started

### C4 · AQHI live readings

- **Slug:** `envcan-aqhi-realtime`
- **Entity:** Updates per-station current AQHI value; spatial-interpolated to `Community`
- **Endpoint:** `https://api.weather.gc.ca/collections/aqhi-observations-realtime/items`
- **Format:** GeoJSON.
- **Refresh:** Hourly.
- **License:** OGL — Canada.
- **Status:** not-started
- **Notes:** Stretch — Theme 3 PS3.

## Ingestion Build Order (first vertical slice)

The first end-to-end slice ingests three sources and produces a coloured map. Do not add a fourth source until this slice is green.

1. **A1** Census Tract boundaries — write `frontend/public/data/communities.geojson`.
2. **A2** Census demographics — join into the same GeoJSON's `properties`.
3. **A8** Alectra service area — flag CTs as `served_by_alectra` and clip view.
4. Render the choropleth on a single dummy score derived from A2 fields.
5. Only once the map renders correctly: add **A3** CIMD, then **C1** outages, then **C2** weather.

## Open data-availability questions

- **Customer outage layer ID on Alectra FeatureServer** — must be confirmed by enumerating `Outage_Details/FeatureServer/layers?f=json`. Block on this before estimating Tier C effort.
- **Hamilton open data — warming/cooling centres** — Hamilton publishes seasonal lists but not always as a layer. May need to scrape the City's seasonal advisory page.
- **Esri Climate Hub layer enumeration** — page is JS-rendered, requires manual browser exploration to enumerate REST endpoints.
- **GeoMet OGC API collection names** — Environment Canada renamed some collections recently; confirm exact names at `https://api.weather.gc.ca/collections` before wiring.
