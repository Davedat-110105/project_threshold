"""
build_map.py

Builds an interactive Folium map for Brampton showing:
  - Choropleth of Threshold vulnerability score (0–100) per Census Tract
  - CISV social vulnerability overlay
  - Live weather conditions per CT
  - Recreation centres + libraries as facility markers

Output: pipeline/data/brampton_map.html

Run from project root:
  pipeline/.venv/bin/python3 pipeline/build_map.py
"""

import json
from pathlib import Path

import folium
import folium.plugins
import geopandas as gpd
import pandas as pd
import numpy as np
from branca.colormap import linear
from branca.element import Template, MacroElement

DATA_DIR = Path(__file__).parent / "data"

# ── Load data ─────────────────────────────────────────────────────────────────
print("Loading data...")
cts   = gpd.read_file(DATA_DIR / "brampton_full.geojson")
facs  = gpd.read_file(DATA_DIR / "brampton_facilities.geojson")

cts["CTUID"] = cts["CTUID"].astype(str)
cts["threshold_score"] = cts["threshold_score"].fillna(0).round(1)
cts["cisv_score"]      = cts["cisv_score"].fillna(cts["cisv_score"].median()).round(3)
cts["temperature_c"]   = cts["temperature_c"].round(1)
cts["humidex"]         = cts["humidex"].round(1)

print(f"  CTs: {len(cts)},  Facilities: {len(facs)}")

# ── Base map ──────────────────────────────────────────────────────────────────
centre = [43.731, -79.762]
m = folium.Map(
    location=centre,
    zoom_start=11,
    tiles=None,
)

# Tile layers
folium.TileLayer("CartoDB positron", name="Light basemap", control=True).add_to(m)
folium.TileLayer("CartoDB dark_matter", name="Dark basemap", control=True).add_to(m)
folium.TileLayer("OpenStreetMap", name="OpenStreetMap", control=True).add_to(m)

# ── Colour maps ───────────────────────────────────────────────────────────────
cmap_threshold = linear.RdYlGn_09.scale(0, 100).to_step(10)
cmap_threshold.caption = "Threshold Vulnerability Score (0=low, 100=critical)"
cmap_threshold = cmap_threshold  # red=high risk, green=low risk (reversed below)

cmap_cisv = linear.YlOrRd_09.scale(
    float(cts["cisv_score"].min()), float(cts["cisv_score"].max())
)
cmap_cisv.caption = "CISV Social Vulnerability Score"

# ── Helper: risk colour (green→red) ──────────────────────────────────────────
def score_colour(score):
    if pd.isna(score):
        return "#aaaaaa"
    s = float(score)
    if s < 25:   return "#1a9850"   # green
    if s < 50:   return "#fee08b"   # yellow
    if s < 75:   return "#f46d43"   # orange
    return "#d73027"                 # red

def cisv_colour(val):
    if pd.isna(val):
        return "#aaaaaa"
    lo = cts["cisv_score"].min()
    hi = cts["cisv_score"].max()
    t  = (float(val) - lo) / (hi - lo + 1e-9)
    r  = int(255 * t)
    g  = int(180 * (1 - t))
    return f"#{r:02x}{g:02x}50"

def weather_colour(temp):
    if pd.isna(temp):
        return "#aaaaaa"
    t = float(temp)
    if t > 32:  return "#d73027"
    if t > 28:  return "#f46d43"
    if t > 24:  return "#fee08b"
    if t > 18:  return "#74add1"
    return "#4575b4"

# ── Layer 1: Threshold Score choropleth ──────────────────────────────────────
print("Building Threshold Score layer...")
fg_threshold = folium.FeatureGroup(name="🔴 Threshold Vulnerability Score", show=True)

for _, row in cts.iterrows():
    # Build popup HTML
    risk_col = score_colour(row["threshold_score"])
    risk_lbl = str(row.get("risk_level", "?"))
    nbhd = str(row.get("neighbourhood", "Brampton"))
    popup_html = f"""
    <div style="font-family:Arial,sans-serif; width:280px; font-size:13px;">
      <h4 style="margin:0 0 2px 0; color:#333;">{nbhd}</h4>
      <div style="font-size:11px; color:#888; margin-bottom:6px;">Census Tract {row['CTUID']}</div>
      <div style="background:{risk_col}; color:white; padding:4px 8px; border-radius:4px;
                  font-weight:bold; margin-bottom:8px; display:inline-block;">
        {risk_lbl} Risk &nbsp;|&nbsp; Score: {row['threshold_score']:.1f}/100
      </div>

      <table style="width:100%; border-collapse:collapse; font-size:12px;">
        <tr style="background:#f5f5f5"><td colspan="2" style="padding:4px 6px; font-weight:bold; color:#555;">
          📊 Demographics (2021 Census)
        </td></tr>
        <tr><td style="padding:3px 6px; color:#666;">Population</td>
            <td style="padding:3px 6px;">{int(row['population']) if not pd.isna(row.get('population')) else '—'}</td></tr>
        <tr><td style="padding:3px 6px; color:#666;">Median Income</td>
            <td style="padding:3px 6px;">${int(row['median_income']):,}</td></tr>
        <tr><td style="padding:3px 6px; color:#666;">Renters</td>
            <td style="padding:3px 6px;">{row['pct_renters']*100:.0f}%</td></tr>
        <tr><td style="padding:3px 6px; color:#666;">Pre-1980 Housing</td>
            <td style="padding:3px 6px;">{row['pct_pre1980']*100:.0f}%</td></tr>

        <tr style="background:#f5f5f5"><td colspan="2" style="padding:4px 6px; font-weight:bold; color:#555;">
          🧩 Social Vulnerability (StatsCan CISV)
        </td></tr>
        <tr><td style="padding:3px 6px; color:#666;">CISV Score</td>
            <td style="padding:3px 6px;">{row['cisv_score']:.3f}</td></tr>
        <tr><td style="padding:3px 6px; color:#666;">Racialized/Immigration</td>
            <td style="padding:3px 6px;">{row['cisv_dim1']:.3f}</td></tr>
        <tr><td style="padding:3px 6px; color:#666;">Income/Labour</td>
            <td style="padding:3px 6px;">{row['cisv_dim2']:.3f}</td></tr>
        <tr><td style="padding:3px 6px; color:#666;">Education/Indigenous</td>
            <td style="padding:3px 6px;">{row['cisv_dim3']:.3f}</td></tr>
        <tr><td style="padding:3px 6px; color:#666;">Dwelling Conditions</td>
            <td style="padding:3px 6px;">{row['cisv_dim4']:.3f}</td></tr>

        <tr style="background:#f5f5f5"><td colspan="2" style="padding:4px 6px; font-weight:bold; color:#555;">
          💪 Social Resilience (StatsCan CISR)
        </td></tr>
        <tr><td style="padding:3px 6px; color:#666;">CISR Score</td>
            <td style="padding:3px 6px;">{row['cisr_score']:.3f}</td></tr>

        <tr style="background:#f5f5f5"><td colspan="2" style="padding:4px 6px; font-weight:bold; color:#555;">
          🌤 Live Weather (Open-Meteo)
        </td></tr>
        <tr><td style="padding:3px 6px; color:#666;">Temperature</td>
            <td style="padding:3px 6px;">{row['temperature_c']:.1f}°C</td></tr>
        <tr><td style="padding:3px 6px; color:#666;">Humidex</td>
            <td style="padding:3px 6px;">{row['humidex']:.1f}°C</td></tr>

        <tr style="background:#f5f5f5"><td colspan="2" style="padding:4px 6px; font-weight:bold; color:#555; font-size:10px;">
          🔗 Data Sources
        </td></tr>
        <tr><td colspan="2" style="padding:3px 6px; color:#888; font-size:10px;">{row['data_sources']}</td></tr>
      </table>
    </div>
    """

    folium.GeoJson(
        row["geometry"].__geo_interface__,
        style_function=lambda feat, s=row["threshold_score"]: {
            "fillColor":   score_colour(s),
            "color":       "#555555",
            "weight":      0.8,
            "fillOpacity": 0.70,
        },
        highlight_function=lambda feat: {
            "weight": 2.5,
            "color":  "#333333",
            "fillOpacity": 0.85,
        },
        tooltip=folium.Tooltip(
            f"{nbhd} | Score: {row['threshold_score']:.1f} | {str(row.get('risk_level','?'))} Risk",
            sticky=False
        ),
        popup=folium.Popup(popup_html, max_width=300),
    ).add_to(fg_threshold)

fg_threshold.add_to(m)

# ── Layer 2: CISV Social Vulnerability ───────────────────────────────────────
print("Building CISV layer...")
fg_cisv = folium.FeatureGroup(name="🟠 CISV Social Vulnerability", show=False)

for _, row in cts.iterrows():
    q = int(row.get("cisv_quintile", 3) or 3)
    folium.GeoJson(
        row["geometry"].__geo_interface__,
        style_function=lambda feat, s=row["cisv_score"]: {
            "fillColor":   cisv_colour(s),
            "color":       "#666666",
            "weight":      0.8,
            "fillOpacity": 0.65,
        },
        highlight_function=lambda feat: {"weight": 2.5, "fillOpacity": 0.85},
        tooltip=folium.Tooltip(
            f"{row.get('neighbourhood','Brampton')} | CISV: {row['cisv_score']:.3f} (Q{q})",
        ),
    ).add_to(fg_cisv)

fg_cisv.add_to(m)

# ── Layer 3: Live Weather ─────────────────────────────────────────────────────
print("Building weather layer...")
fg_weather = folium.FeatureGroup(name="🌡 Live Temperature", show=False)

for _, row in cts.iterrows():
    folium.GeoJson(
        row["geometry"].__geo_interface__,
        style_function=lambda feat, t=row["temperature_c"]: {
            "fillColor":   weather_colour(t),
            "color":       "#444444",
            "weight":      0.6,
            "fillOpacity": 0.60,
        },
        highlight_function=lambda feat: {"weight": 2.5, "fillOpacity": 0.85},
        tooltip=folium.Tooltip(
            f"{row.get('neighbourhood','Brampton')} | Temp: {row['temperature_c']:.1f}°C | Humidex: {row['humidex']:.1f}°C",
        ),
    ).add_to(fg_weather)

fg_weather.add_to(m)

# ── Layer 4: Facilities (cooling/warming centres) ─────────────────────────────
print("Building facilities layer...")
fg_fac = folium.FeatureGroup(name="🏢 Cooling & Warming Centres", show=True)

ROLE_ICONS = {
    "cooling_and_warming_centre": ("blue",   "home"),
    "cooling_centre":             ("green",  "book"),
    "warming_centre":             ("orange", "fire"),
    "community_facility":         ("gray",   "info-sign"),
}

ROLE_LABELS = {
    "cooling_and_warming_centre": "Cooling & Warming Centre",
    "cooling_centre":             "Cooling Centre (Library)",
    "warming_centre":             "Warming Centre",
    "community_facility":         "Community Facility",
}

for _, frow in facs.iterrows():
    if frow.geometry is None or frow.geometry.is_empty:
        continue

    role    = str(frow.get("role", "community_facility"))
    colour, icon_name = ROLE_ICONS.get(role, ("gray", "info-sign"))
    label   = ROLE_LABELS.get(role, role.replace("_", " ").title())
    website = frow.get("website", "")

    popup_html = f"""
    <div style="font-family:Arial,sans-serif; width:240px; font-size:13px;">
      <h4 style="margin:0 0 4px 0; color:#333;">{frow['name']}</h4>
      <span style="font-size:11px; color:#888;">{label}</span><br><br>
      <b>📍</b> {frow.get('address','')}<br>
      {"<b>🌐</b> <a href='" + website + "' target='_blank'>Website</a><br>" if website else ''}
      <br><span style="font-size:10px; color:#aaa;">Source: Brampton ESRI ArcGIS</span>
    </div>
    """

    folium.Marker(
        location=[frow.geometry.y, frow.geometry.x],
        tooltip=frow["name"],
        popup=folium.Popup(popup_html, max_width=260),
        icon=folium.Icon(color=colour, icon=icon_name, prefix="glyphicon"),
    ).add_to(fg_fac)

fg_fac.add_to(m)

# ── Legend ────────────────────────────────────────────────────────────────────
legend_html = """
{% macro html(this, kwargs) %}
<div style="
    position: fixed; bottom: 40px; left: 15px; z-index: 1000;
    background: white; padding: 12px 16px; border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.25); font-family: Arial,sans-serif;
    font-size: 12px; min-width: 180px;">
  <b style="font-size:13px;">Threshold Score</b><br><br>
  <span style="background:#1a9850;display:inline-block;width:14px;height:14px;
    border-radius:3px;margin-right:6px;vertical-align:middle;"></span> Low (0–25)<br>
  <span style="background:#fee08b;display:inline-block;width:14px;height:14px;
    border-radius:3px;margin-right:6px;vertical-align:middle;"></span> Moderate (25–50)<br>
  <span style="background:#f46d43;display:inline-block;width:14px;height:14px;
    border-radius:3px;margin-right:6px;vertical-align:middle;"></span> High (50–75)<br>
  <span style="background:#d73027;display:inline-block;width:14px;height:14px;
    border-radius:3px;margin-right:6px;vertical-align:middle;"></span> Critical (75–100)<br>
  <hr style="margin:8px 0; border-color:#eee;">
  <b style="font-size:13px;">Facilities</b><br><br>
  <span style="color:#3388ff">●</span> Cooling &amp; Warming Centre<br>
  <span style="color:#2ca02c">●</span> Library (Cooling)<br>
  <span style="color:#ff7f0e">●</span> Warming Centre<br>
  <hr style="margin:8px 0; border-color:#eee; font-size:10px; color:#aaa;">
  <span style="font-size:10px; color:#aaa;">
    Sources: StatsCan CISV/CISR · Brampton ESRI<br>Open-Meteo Weather · Alectra Outages
  </span>
</div>
{% endmacro %}
"""

class Legend(MacroElement):
    def __init__(self):
        super().__init__()
        self._template = Template(legend_html)

m.add_child(Legend())

# ── Title bar ─────────────────────────────────────────────────────────────────
title_html = """
{% macro html(this, kwargs) %}
<div style="
    position: fixed; top: 10px; left: 50%; transform: translateX(-50%);
    z-index: 1001; background: rgba(0,0,0,0.75); color: white;
    padding: 8px 20px; border-radius: 20px;
    font-family: Arial,sans-serif; font-size: 14px; font-weight: bold;">
  ⚡ Threshold — Brampton Energy Vulnerability Map
  <span style="font-size:11px; font-weight:normal; color:#ccc;"> · Seneca Hackathon 2026</span>
</div>
{% endmacro %}
"""

class TitleBar(MacroElement):
    def __init__(self):
        super().__init__()
        self._template = Template(title_html)

m.add_child(TitleBar())

# ── Layer control + minimap ───────────────────────────────────────────────────
folium.LayerControl(collapsed=False, position="topright").add_to(m)
folium.plugins.MiniMap(toggle_display=True).add_to(m)
folium.plugins.Fullscreen().add_to(m)

# ── Save ──────────────────────────────────────────────────────────────────────
OUT = DATA_DIR / "brampton_map.html"
m.save(str(OUT))
print(f"\n✅ Map saved → {OUT}")
print(f"   Open in browser: open {OUT}")

# Print summary stats
print("\n── Brampton Vulnerability Summary ──")
print(cts.groupby("risk_level")["CTUID"].count().rename("CTs").to_string())
print(f"\nMost vulnerable CT: {cts.loc[cts['threshold_score'].idxmax(), 'CTUID']} "
      f"(score {cts['threshold_score'].max():.1f})")
print(f"Avg temperature today: {cts['temperature_c'].mean():.1f}°C")
print(f"Facilities nearby: {len(facs)} (rec centres + libraries)")
