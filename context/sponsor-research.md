# Sponsor Research

Durable reference for sponsor alignment, data access, mentor contacts, and strategic framing. Last researched 2026-05-25. All URLs verified at time of writing.

## Alectra Utilities (sponsor — primary alignment target)

### Scale and territory

- **Customers:** ~1,000,000 homes and businesses.
- **Area:** 1,924 km².
- **Status:** Largest municipally-owned electricity utility in Canada.
- **17 communities served:** Alliston, Aurora, Barrie, Beeton, Brampton, Bradford West Gwillimbury, Guelph, Hamilton (partial), Markham, Mississauga, Penetanguishene, Richmond Hill, Rockwood, St. Catharines, Thornton, Tottenham, Vaughan.
- **Note on Hamilton:** Alectra serves part of Hamilton (legacy Horizon Utilities territory). Full Hamilton coverage requires combining with Hamilton Utilities. For MVP we treat Hamilton as a Threshold community regardless of which LDC serves the feeder.

### GRE&T Centre — Alectra's innovation arm

The Green Energy & Technology Centre is Alectra's R&D vehicle and the source of their technical public profile. 5+ years old. Funded internally with co-funding from NRCan and IESO.

**Current and recent projects:**

| Project           | Focus                                             |
| ----------------- | ------------------------------------------------- |
| Centricity        | Canada's first end-to-end DSO model, $6M project  |
| AlectraDrive (Fleets, V2X, @Home, @Work) | EV charging, V2G, fleet electrification |
| GridExchange      | Blockchain-based DER marketplace                  |
| SmartCharge       | EV charging personalization                       |
| Power.House Hybrid| Net-zero homes with thermal/electrical integration|
| Cityview Microgrid| Smart grid testing facility                       |
| York Region NWA   | Non-wires alternatives, DER market design         |

**Strategic gap in their portfolio:** every project is EV / DER / grid-edge. **Nothing focused on community equity, vulnerable populations, or energy poverty.** This is the opening Threshold walks into. Frame in pitch: "the equity and vulnerability layer Alectra's innovation portfolio doesn't have yet."

### Hackathon mentors from Alectra

- **Keith Hemingway** — Head, Emerging Technology, GRE&T Centre. Virtual domain session **May 26 10:00–11:00 AM**.
- **Daniel Carr** — Head, Grid Edge Solutions, GRE&T Centre. Virtual domain session **May 26 11:00 AM–12:00 PM**.

Both are senior. Pre-read recommended: `alectra.com/innovation-projects` and the Alectra video link in opening-day slides.

### 🔓 Alectra outage data access

**Alectra publishes its live outage feed via ArcGIS Hub.** This was the hardest blocker in the original pipeline plan; it turns out to be effectively free and aligns with both sponsors simultaneously (Esri infrastructure).

- **Public experience (user-facing map):** `https://experience.arcgis.com/experience/8371de586076441192a1fa7058816c00`
- **ArcGIS Hub dataset (downloadable CSV / KML / GeoJSON):** `https://arcgis-natgeo-home-learngis.hub.arcgis.com/datasets/esrica-apps::alectra-utilities-live-outages-map`
- **Candidate FeatureServer:** `https://services8.arcgis.com/wNDmObY7QplwZD9m/ArcGIS/rest/services/Outage_Details/FeatureServer`
- **Status of investigation:** layer 0 confirmed to be internal "Barriers" / trace data (point geometry, edit-capable). The customer-facing outage area polygons live on a different layer of the same service. **TODO during pipeline build:** enumerate all layers on `Outage_Details/FeatureServer` and identify the layer ID for customer outage polygons.
- **Strategic note on historical data:** Alectra exposes the live feed but does **not** appear to publish historical outage archives. We build our own historical sample by polling the feed across the hackathon window. Honest narrative: "Alectra publishes the present; Threshold gives them the past."

### Alectra service-area boundary (for the map)

ArcGIS Online item: `https://www.arcgis.com/home/item.html?id=8eba357e1b124587884bccb724743c4c` ("Alectra Service Areas — Overview"). Use to clip the map view and confirm community membership.

## Esri Canada (sponsor — platform and data library)

### Living Atlas — Canada Edition

- Esri Canada has a dedicated team curating Canadian content in the Living Atlas.
- 100+ web maps, apps, and layers for Canada across environment, infrastructure, people, basemaps, imagery.
- All exposed via ArcGIS REST FeatureServer endpoints, returnable as GeoJSON (`?f=geojson&where=1=1&outFields=*`).
- Reference: `https://resources.esri.ca/news-and-updates/living-atlas-of-the-world-canada-edition`

### Climate Change Hub

- Landing: `https://climate.esri.ca/`
- Open data page: `https://climate.esri.ca/pages/open-data` (JS-rendered; manual browser exploration during build to enumerate datasets)
- Confirmed coverage: flood polygons (Alberta and other provinces), heat vulnerability layers, active flood/drought monitoring layers.
- Reference: `https://resources.esri.ca/arcgis-hub/navigating-the-climate-change-data-resource-hub`

### Reference products we should cite in the pitch

- **Interactive Atlas of the Vulnerability of the Québec Population to Climatic Hazards** — Laval University + Ouranos + INSPQ. Esri Canada's App of the Month. Strong precedent for our category. *Pitch line: "What Laval did for Quebec with research funding, Threshold does for Ontario in 48 hours using sponsor data, with real-time integration they don't have."*  `https://resources.esri.ca/news-and-updates/app-of-the-month-qu%C3%A9bec-populations-vulnerability-to-climatic-hazards`
- **Heat Waves & Vulnerability App** (Esri Canada). Confirms Esri is invested in this problem domain. `https://resources.esri.ca/public-health/heat-waves-vulnerability-app-puts-mapping-at-the-centre`

### Student access

- Student ArcGIS Online accounts include **GeoEnrichment service** (Census + consumer-behaviour variables on demand). Free with the student account. Could replace some Tier A ingestion if we use it.
- Three essential Esri resources for Canadian spatial research (U of T Map and Data Library): `https://mdl.library.utoronto.ca/mdl-blog/three-essential-esri-resources-canadian-spatial-research`

### Hackathon mentors from Esri Canada

- **Daniel Noakes** — Technical Solutions Specialist. Domain session May 24 1:00–2:00 PM (virtual).
- **Jonathan Van Dusen** — Higher Education Specialist. Technical session May 24 2:00–3:00 PM (virtual) + technical hands-on May 25 (in-person K2001).
- **Alex Smith, PhD** — Spatial Data Scientist. Technical session May 24 2:00–3:00 PM (virtual) + technical hands-on May 25 (in-person K2001).

Alex Smith is the most relevant for the ML/spatial-data side of Threshold.

## Other sponsors and partners

### Seneca Student Federation (sponsor)

Student union; logistical sponsor. No product-relevant data access. Acknowledge in deck.

### Octo (partner — `getocto.com`)

No-code community-app platform — branded apps with member engagement, payments, events, AI analytics. Founder Kartik Sorathiya. **Not energy-related.** Kartik's May 24 3:00–4:00 PM session is generic Product Thinking & Innovation mentoring. Worth attending for demo-framing advice, but no data alignment.

### GDG (Google Developer Groups), Toronto Tech Week, Comunity

Community partners, not data partners. Toronto Tech Week May 25–29, 2026 — the hackathon rides TTW visibility. Useful contextual line in pitch ("submitted during Toronto Tech Week 2026").

## Strategic implications for Threshold

### Pitch framing

> Threshold is the community equity and vulnerability layer that Alectra's innovation portfolio doesn't have yet, built on Esri Canada infrastructure.

This sentence threads both sponsors and identifies a real gap. Bake into Vision §08 and the demo script.

### Architectural alignment

- **Use ArcGIS REST as a primary ingestion mechanism** wherever possible. It's a sponsor-aligned choice that simplifies the pipeline (uniform JSON/GeoJSON access pattern) and gives access to Alectra outage data + Living Atlas + Esri Climate Hub in one stack.
- **Use student GeoEnrichment account** to enrich Census Tracts with demographic variables without standing up a StatsCan ingestion pipeline.
- **Consider the ArcGIS Maps SDK for JavaScript** as the map library instead of Mapbox if time allows (sponsor alignment), but Mapbox remains the safe default given familiarity.

### Demo positioning

- **Mentioning Alectra by name** in the demo opening is high-value. The judge panel includes Alectra mentors.
- **Showing the live outage overlay refreshing on screen** is a clear sponsor-data demonstration. Even a stub showing one or two real outages mid-demo is enough.
- **Hamilton Code Red** is the canonical Canadian community-vulnerability story — using Hamilton as a primary example anchors the equity narrative in a way every Canadian planner recognizes.

### Mentor outreach plan

- **May 26 morning:** attend Keith Hemingway (10:00) and Daniel Carr (11:00) Alectra domain sessions. **Ask directly:** is the customer-outage polygon layer of `Outage_Details/FeatureServer` open for programmatic access during the hackathon window?
- **May 25 afternoon (in-person K2001):** attend Van Dusen + Smith technical hands-on. **Ask Alex Smith:** strongest practice for spatial joins across Census Tracts and feeder topology; whether there's a Living Atlas layer for utility feeder boundaries.
- **May 25 afternoon:** Mark Buchner (Hackathon Chair) pitch development 2:00–3:00 PM. Use for narrative shaping, not data.
