# EDA Notebook Design

**Date:** 2026-05-25
**File:** `pipeline/EDA.ipynb`
**Deadline:** 2026-05-26 23:59 ET

## Purpose

Two-phase notebook: (1) fetch and validate every data source before the pipeline is built, (2) prototype a PCA-derived Threshold Score with a visual choropleth proof. Output gives confidence that all spatial joins work and that the score makes geographic sense before any production code is written.

## Approach

PCA-derived composite score. All factor columns are normalized with `StandardScaler`, then `sklearn.decomposition.PCA` extracts PC1 as the Threshold Score. PC1 loadings are exported as a table (factor → loading → source dataset) to satisfy the Product Axiom — every score is traceable to named inputs which are traceable to public datasets. Three scenario variants (Baseline, Heatwave, Ice Storm) re-weight input columns before PCA to shift emphasis.

Trade-off accepted: PCA weighting is data-driven rather than manually set, which is harder to explain verbally but more defensible numerically. The loadings table in the UI makes it auditable.

## Sections

### Section 1 — Ingest & Validate

Fetch each source, print shape / dtypes / null counts / row sample.

| Source | Slug | Auth |
|--------|------|------|
| A1 — StatsCan CT boundaries | `statcan-census-tracts-2021` | None |
| A2 — Census demographics CSV | `statcan-census-2021-ct-demographics` | None |
| A3 — CIMD vulnerability index | `statcan-cimd-2021` | None |
| A8 — Alectra service area (ArcGIS REST) | `alectra-service-area` | None (public) |
| C1 — Alectra live outages (ArcGIS REST) | `alectra-outages-live` | None (public) — enumerate `/layers?f=json` first to confirm layer ID |
| C2 — Environment Canada GeoMet weather | `envcan-geomet-current` | None |
| B1 — Esri Living Atlas EJ layers | `esri-living-atlas-ej-canada` | `ARCGIS_TOKEN` env var |
| B2 — Esri Climate Hub heat vulnerability | `esri-canada-climate-heat-vuln` | `ARCGIS_TOKEN` env var |

Token-gated sources use `TOKEN = os.getenv("ARCGIS_TOKEN")` with a `# Set ARCGIS_TOKEN in your environment` comment. Cells run gracefully (skip with a warning) when token is absent.

Validation checks per source:
- Row count and column list
- Null percentage per column
- CRS (for spatial sources) — reproject to EPSG:4326 if not already
- Sample of 3 rows

### Section 2 — Spatial Joins

1. Filter A1 to CMAs 35535 (Toronto) and 35537 (Hamilton) — drops CTs outside scope.
2. Left-join A2 demographics onto A1 by `CTUID`.
3. Left-join A3 CIMD onto A1 by `CTUID`.
4. Spatial-join A8 Alectra service area to flag `served_by_alectra` boolean per CT.
5. Clip master GeoDataFrame to Alectra boundary.
6. Spatial-join C1 outage polygons → count `active_outages` per CT and sum `customers_affected`.
7. Spatial-join C2 weather cells → nearest-cell `temperature_c` and `humidex` per CT.

Output: single `gdf_master` GeoDataFrame, ~400 rows × N columns, saved as `pipeline/data/master_cts.geojson`.

Assertions after each join:
- Row count stays ≤ original CT count (no fan-out from spatial join)
- `CTUID` uniqueness preserved
- `served_by_alectra` has at least 1 True value

### Section 3 — Distributions & Quality

- Missing-value heatmap (`seaborn.heatmap` on null matrix)
- Histograms: median income, dwelling age (% pre-1980), renter share, CIMD sub-indices (4)
- Pearson correlation matrix of all numeric factor columns
- Quick choropleth of raw `median_income` to confirm spatial patterns look right (Hamilton south-end should be low)

### Section 4 — PCA Score

**Factor columns used:**
- `median_household_income` (inverted — lower income = higher vulnerability)
- `pct_dwellings_pre1980`
- `pct_renters`
- `cimd_residential_instability`
- `cimd_economic_dependency`
- `cimd_ethnocultural_composition`
- `cimd_situational_vulnerability`
- `active_outages` (C1)
- `customers_affected` (C1)
- `humidex` (C2, Heatwave scenario emphasis)

**Steps:**
1. Drop CTs missing >50% of factor columns.
2. Impute remaining NaN with column median.
3. Invert income (multiply by -1 after scaling).
4. `StandardScaler` normalize all columns.
5. `PCA(n_components=5)` — scree plot to confirm PC1 dominates.
6. Extract `pc1_score` as `threshold_score` (rescale 0–100 for readability).
7. Export loadings DataFrame: `factor | loading | source_slug | source_url`.

**Scenario variants:**
- Baseline: equal column weights (raw scaled)
- Heatwave: `humidex` × 2.5, `cimd_situational_vulnerability` × 1.5
- Ice Storm: `active_outages` × 3, `customers_affected` × 2, `pct_renters` × 1.5

Apply weights by multiplying scaled columns before PCA. Re-run PCA per scenario. Store `threshold_score_baseline`, `threshold_score_heatwave`, `threshold_score_icestorm`.

### Section 5 — Prototype Choropleth

- `geopandas` + `matplotlib` 3-panel figure: Baseline / Heatwave / Ice Storm
- 4-tier colour ramp (matching the planned Mapbox dark theme): grey → yellow → orange → red
- Annotate Hamilton Code Red neighbourhood centroids with labels
- Title each panel with explained-variance percentage from PCA
- Save to `pipeline/data/prototype_choropleth.png`

## Dependencies

```
geopandas>=0.14
pandas>=2.0
numpy>=1.26
scikit-learn>=1.4
matplotlib>=3.8
seaborn>=0.13
httpx>=0.27
```

All already in scope per `context/architecture.md`. No new packages.

## Success Criteria

1. All token-free sources fetch without error.
2. `gdf_master` has ≥ 350 rows (Alectra-territory CTs) and ≤ 5% null rate on core A2 columns.
3. Spatial joins produce no fan-out (row count ≤ input).
4. PCA PC1 explains ≥ 30% of variance.
5. Prototype choropleth renders and Hamilton south-end CTs score visibly higher vulnerability than Mississauga north-end.
6. Loadings table exported with all factor → source mappings complete.
