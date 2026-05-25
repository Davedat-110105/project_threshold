"""
generate_demo_data.py

Generates realistic synthetic census and vulnerability data keyed to the
ACTUAL Census Tract UIDs from the downloaded StatsCan boundary file.

Run once before the EDA notebook (from the project root):
    pipeline/.venv/bin/python3 pipeline/generate_demo_data.py

Outputs (CSV — no pyarrow dependency):
    pipeline/data/demo_census.csv    -- A2 demographics
    pipeline/data/demo_cimd.csv      -- A3 CIMD sub-indices
"""

from pathlib import Path
import sys
import numpy as np
import pandas as pd

PIPELINE_DIR = Path(__file__).parent
DATA_DIR = PIPELINE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

RNG = np.random.default_rng(42)

CTUID_CSV = DATA_DIR / "scoped_ctuids.csv"
if not CTUID_CSV.exists():
    # Try to build it from the shapefile
    try:
        import geopandas as gpd
        import glob
        shp_files = glob.glob(str(DATA_DIR / "ct_boundaries" / "*.shp"))
        if not shp_files:
            print("ERROR: CT boundary shapefile not found. Run the A1 cell in the notebook first.")
            sys.exit(1)
        gdf = gpd.read_file(shp_files[0])
        mask = (
            gdf["CTUID"].astype(str).str[:3].isin(["535", "537"]) &
            (gdf["PRUID"].astype(str) == "35")
        )
        gdf[mask][["CTUID"]].to_csv(CTUID_CSV, index=False)
        print(f"Built {CTUID_CSV} from shapefile ({mask.sum()} CTs)")
    except Exception as e:
        print(f"ERROR building CTUID list: {e}")
        sys.exit(1)

df_ids = pd.read_csv(CTUID_CSV)
ctuids = df_ids["CTUID"].astype(str).tolist()
n = len(ctuids)
print(f"Generating demo data for {n} CTs...")

# Per-CT profile driven by CMA prefix:
# 535 = Toronto CMA (Mississauga/Brampton mix — moderate vulnerability)
# 537 = Hamilton CMA (Code Red narrative — higher vulnerability, wider spread)
cma_codes = [c[:3] for c in ctuids]

def profile_value(cma, param_535, param_537):
    """Return per-CT value drawn from CMA-specific normal distribution."""
    mean_535, std_535 = param_535
    mean_537, std_537 = param_537
    vals = np.where(
        np.array(cma_codes) == "537",
        RNG.normal(mean_537, std_537, n),
        RNG.normal(mean_535, std_535, n),
    )
    return vals

def clamp(arr, lo, hi):
    return np.clip(arr, lo, hi)

# --- A2: Census demographics ---
income       = clamp(profile_value(cma_codes, (88_000, 28_000), (68_000, 30_000)), 18_000, 260_000)
pct_renters  = clamp(profile_value(cma_codes, (0.28, 0.13), (0.42, 0.18)), 0.01, 0.95)
pct_pre1980  = clamp(profile_value(cma_codes, (0.30, 0.18), (0.58, 0.22)), 0.00, 1.00)
population   = RNG.integers(700, 6_500, n)

df_census = pd.DataFrame({
    "CTUID":          ctuids,
    "population":     population,
    "median_income":  income.round(0).astype(int),
    "pct_renters":    pct_renters.round(4),
    "pct_pre1980":    pct_pre1980.round(4),
})

# --- A3: CIMD sub-indices (0–1 percentile scale) ---
ri = clamp(profile_value(cma_codes, (48, 20), (62, 24)), 1, 99) / 100
ed = clamp(profile_value(cma_codes, (42, 18), (60, 22)), 1, 99) / 100
ec = clamp(profile_value(cma_codes, (55, 20), (42, 20)), 1, 99) / 100
sv = clamp(profile_value(cma_codes, (36, 15), (55, 22)), 1, 99) / 100

df_cimd = pd.DataFrame({
    "CTUID":                           ctuids,
    "cimd_residential_instability":    ri.round(4),
    "cimd_economic_dependency":        ed.round(4),
    "cimd_ethnocultural_composition":  ec.round(4),
    "cimd_situational_vulnerability":  sv.round(4),
})

out_census = DATA_DIR / "demo_census.csv"
out_cimd   = DATA_DIR / "demo_cimd.csv"
df_census.to_csv(out_census, index=False)
df_cimd.to_csv(out_cimd, index=False)

print(f"✅ {out_census.name}  — {len(df_census)} CTs")
print(f"✅ {out_cimd.name}    — {len(df_cimd)} CTs")
print(f"\nIncome range:   ${df_census['median_income'].min():,} – ${df_census['median_income'].max():,}")
print(f"Renter % range: {df_census['pct_renters'].min():.1%} – {df_census['pct_renters'].max():.1%}")
