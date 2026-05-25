"""
build_weather.py

Pulls climate hazard data for every CT centroid in master_cts.geojson.

Sources:
  - Open-Meteo current weather (free, no key, ~1 km gridded)
  - Open-Meteo historical archive 2019-2024 (heat/frost/precip/wind stats)
  - Environment Canada GeoMet active weather alerts
  - NRCan flood hazard zones (federal layer)

Output:
  pipeline/data/weather_ct.csv  — one row per CTUID, all hazard columns

Run from project root:
  pipeline/.venv/bin/python3 pipeline/build_weather.py
"""

from pathlib import Path
import json
import time
import sys
import numpy as np
import pandas as pd
import httpx
import geopandas as gpd

PIPELINE_DIR = Path(__file__).parent
DATA_DIR     = PIPELINE_DIR / "data"
OUT_CSV      = DATA_DIR / "weather_ct.csv"

# ── Load CT centroids ─────────────────────────────────────────────────────────
print("Loading CT centroids from master_cts.geojson …")
gdf = gpd.read_file(DATA_DIR / "master_cts.geojson")
gdf["centroid_lon"] = gdf.geometry.centroid.x.round(5)
gdf["centroid_lat"] = gdf.geometry.centroid.y.round(5)
centroids = gdf[["CTUID", "centroid_lat", "centroid_lon"]].copy()
print(f"  {len(centroids)} CTs")

# ── Open-Meteo helpers ────────────────────────────────────────────────────────
CURRENT_URL   = "https://api.open-meteo.com/v1/forecast"
HISTORICAL_URL = "https://archive-api.open-meteo.com/v1/archive"
BATCH_SIZE = 10   # Open-Meteo handles up to ~50 coords but be conservative

def fetch_current(lats, lons):
    """Fetch current conditions for a batch of lat/lon pairs."""
    params = {
        "latitude":            ",".join(str(x) for x in lats),
        "longitude":           ",".join(str(x) for x in lons),
        "current":             "temperature_2m,apparent_temperature,precipitation,wind_speed_10m,wind_gusts_10m,weather_code",
        "timezone":            "America/Toronto",
        "forecast_days":       1,
    }
    with httpx.Client(timeout=30) as c:
        r = c.get(CURRENT_URL, params=params)
        r.raise_for_status()
    return r.json()

def fetch_historical(lat, lon, start="2019-01-01", end="2024-12-31"):
    """Fetch daily historical data for one point and compute annual stats."""
    params = {
        "latitude":   lat,
        "longitude":  lon,
        "start_date": start,
        "end_date":   end,
        "daily":      "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,et0_fao_evapotranspiration",
        "timezone":   "America/Toronto",
    }
    with httpx.Client(timeout=60) as c:
        r = c.get(HISTORICAL_URL, params=params)
        r.raise_for_status()
    d = r.json().get("daily", {})
    if not d:
        return {}

    tmax  = np.array(d.get("temperature_2m_max", []), dtype=float)
    tmin  = np.array(d.get("temperature_2m_min", []), dtype=float)
    precip = np.array(d.get("precipitation_sum", []), dtype=float)
    wind   = np.array(d.get("wind_speed_10m_max", []), dtype=float)

    n_years = max((2024 - 2019 + 1), 1)

    return {
        "heat_days_per_yr":       float(np.nansum(tmax > 30)  / n_years),
        "hot_days_per_yr":        float(np.nansum(tmax > 25)  / n_years),
        "frost_days_per_yr":      float(np.nansum(tmin < 0)   / n_years),
        "freezing_days_per_yr":   float(np.nansum(tmax < 0)   / n_years),
        "annual_precip_mm":       float(np.nansum(precip)     / n_years),
        "heavy_rain_days_per_yr": float(np.nansum(precip > 25) / n_years),
        "max_24h_precip_mm":      float(np.nanmax(precip)) if len(precip) else np.nan,
        "max_wind_gust_kmh":      float(np.nanmax(wind))   if len(wind)   else np.nan,
        "mean_summer_tmax":       float(np.nanmean(tmax[np.arange(len(tmax)) % 365 > 150]))
                                  if len(tmax) > 365 else np.nan,
    }

# ── Step 1: Current weather (batched) ────────────────────────────────────────
print("\nStep 1 — current weather (Open-Meteo, batched) …")
current_rows = []

rows_list = centroids.to_dict("records")
for i in range(0, len(rows_list), BATCH_SIZE):
    batch = rows_list[i : i + BATCH_SIZE]
    lats  = [r["centroid_lat"] for r in batch]
    lons  = [r["centroid_lon"] for r in batch]
    try:
        result = fetch_current(lats, lons)
        # When multiple locations, result is a list
        if isinstance(result, dict):
            result = [result]
        for j, loc in enumerate(result):
            cur = loc.get("current", {})
            current_rows.append({
                "CTUID":             batch[j]["CTUID"],
                "temperature_c":     cur.get("temperature_2m"),
                "apparent_temp_c":   cur.get("apparent_temperature"),   # humidex proxy
                "precipitation_mm":  cur.get("precipitation"),
                "wind_speed_kmh":    cur.get("wind_speed_10m"),
                "wind_gusts_kmh":    cur.get("wind_gusts_10m"),
                "weather_code":      cur.get("weather_code"),
            })
    except Exception as e:
        print(f"  ⚠️  batch {i//BATCH_SIZE}: {e}")
        for r in batch:
            current_rows.append({"CTUID": r["CTUID"]})
    time.sleep(0.05)

df_current = pd.DataFrame(current_rows)
print(f"  Got current weather for {df_current['temperature_c'].notna().sum()} / {len(df_current)} CTs")

# ── Step 2: Historical climate stats (one call per CT — takes a few minutes) ─
print("\nStep 2 — historical climate stats 2019–2024 (Open-Meteo archive) …")
print("  This makes one API call per CT (~569 calls). Takes ~3–5 minutes.")

hist_rows = []
for idx, row in centroids.iterrows():
    try:
        stats = fetch_historical(row["centroid_lat"], row["centroid_lon"])
        stats["CTUID"] = row["CTUID"]
        hist_rows.append(stats)
    except Exception as e:
        hist_rows.append({"CTUID": row["CTUID"]})
    if (idx + 1) % 50 == 0:
        print(f"  … {idx + 1}/{len(centroids)} done")
    time.sleep(0.03)   # be polite to the free API

df_hist = pd.DataFrame(hist_rows)
print(f"  Historical stats ready — heat_days_per_yr range: "
      f"{df_hist['heat_days_per_yr'].min():.1f} – {df_hist['heat_days_per_yr'].max():.1f}")

# ── Step 3: Environment Canada active alerts ───────────────────────────────────
print("\nStep 3 — Environment Canada active weather alerts …")
ALERTS_URL = "https://geo.weather.gc.ca/geomet?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=ALERTS&OUTPUTFORMAT=application/json&bbox=-81.0,42.8,-78.5,44.2"
active_alert_types = []
try:
    with httpx.Client(timeout=30) as c:
        r = c.get(ALERTS_URL)
    if r.status_code == 200:
        alerts_gdf = gpd.read_file(r.text)
        if len(alerts_gdf) > 0:
            active_alert_types = alerts_gdf.get("alert_type", pd.Series()).dropna().unique().tolist()
            print(f"  Active alerts: {active_alert_types}")
        else:
            print("  No active weather alerts right now")
    else:
        print(f"  Alerts API: {r.status_code}")
except Exception as e:
    print(f"  Alerts skipped: {e}")

# ── Step 4: NRCan flood hazard zones ─────────────────────────────────────────
print("\nStep 4 — NRCan federal flood hazard zones …")
# NRCan National Flood Hazard Layer via ArcGIS REST
FLOOD_URL = "https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/national_flood_hazard_layer_en/MapServer/0/query"
gdf_flood = gpd.GeoDataFrame()
try:
    params = {
        "f":              "geojson",
        "where":          "1=1",
        "geometry":       "-81.0,42.8,-78.5,44.2",
        "geometryType":   "esriGeometryEnvelope",
        "inSR":           "4326",
        "spatialRel":     "esriSpatialRelIntersects",
        "outFields":      "FLOOD_FREQ,FLOOD_ZONE",
        "returnGeometry": "true",
        "resultRecordCount": 2000,
    }
    with httpx.Client(timeout=60) as c:
        r = c.get(FLOOD_URL, params=params)
    if r.status_code == 200 and r.content[:1] == b'{':
        gdf_flood = gpd.read_file(r.text).to_crs("EPSG:4326")
        print(f"  NRCan flood zones: {len(gdf_flood)} polygons")
    else:
        print(f"  NRCan flood layer: status {r.status_code} — skipping")
except Exception as e:
    print(f"  NRCan flood skipped: {e}")

# Flag CTs that intersect flood zones
if len(gdf_flood) > 0:
    ct_pts = gdf[["CTUID", "geometry"]].copy()
    ct_pts.geometry = ct_pts.geometry.centroid
    try:
        flood_join = gpd.sjoin(ct_pts, gdf_flood[["geometry"]], how="left", predicate="within")
        flood_flags = flood_join.groupby("CTUID").size().reset_index(name="flood_zone_overlap")
        flood_flags["in_flood_zone"] = flood_flags["flood_zone_overlap"] > 0
    except Exception as e:
        print(f"  Flood spatial join failed: {e}")
        flood_flags = pd.DataFrame({"CTUID": gdf["CTUID"], "in_flood_zone": False})
else:
    flood_flags = pd.DataFrame({"CTUID": gdf["CTUID"].tolist(), "in_flood_zone": False})

# ── Merge everything ──────────────────────────────────────────────────────────
print("\nMerging all weather/hazard data …")
df_weather = (centroids[["CTUID"]]
              .merge(df_current, on="CTUID", how="left")
              .merge(df_hist,    on="CTUID", how="left")
              .merge(flood_flags[["CTUID","in_flood_zone"]], on="CTUID", how="left"))

df_weather.to_csv(OUT_CSV, index=False)

print(f"\n✅ Saved {OUT_CSV.name} — {len(df_weather)} CTs × {len(df_weather.columns)} columns")
print("\nColumn summary:")
for col in df_weather.columns:
    if col == "CTUID":
        continue
    nulls = df_weather[col].isna().sum()
    if df_weather[col].dtype in [float, "float64"]:
        print(f"  {col:35s}  null={nulls:3d}  min={df_weather[col].min():.2f}  max={df_weather[col].max():.2f}")
    else:
        print(f"  {col:35s}  null={nulls:3d}  values={df_weather[col].unique()[:3].tolist()}")

print("\nActive EC alerts in study area:", active_alert_types if active_alert_types else "none right now")
print("\nRun pipeline/build_weather.py again to refresh live data.")
