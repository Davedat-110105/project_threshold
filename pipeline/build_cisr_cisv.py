"""
build_cisr_cisv.py

Downloads and aggregates the StatsCan CISR + CISV indices from DA to CT level.

Sources:
  CISR: https://www150.statcan.gc.ca/pub/45-20-0001/2025001/csv/cisr-eng.zip
  CISV: https://www150.statcan.gc.ca/pub/45-20-0001/2025001/csv/cisv-eng.zip
  Geo:  https://www12.statcan.gc.ca/census-recensement/2021/geo/aip-pia/attribute-attribs/files-fichiers/2021_92-151_X.zip

Output:
  pipeline/data/real_cisr_cisv.csv  — CT-level mean aggregation of CISR + CISV

Run from project root:
  pipeline/.venv/bin/python3 pipeline/build_cisr_cisv.py
"""

from pathlib import Path
import sys
import zipfile
import io
import httpx
import pandas as pd

PIPELINE_DIR = Path(__file__).parent
DATA_DIR = PIPELINE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

CISR_URL = "https://www150.statcan.gc.ca/pub/45-20-0001/2025001/csv/cisr-eng.zip"
CISV_URL = "https://www150.statcan.gc.ca/pub/45-20-0001/2025001/csv/cisv-eng.zip"
GEO_URL  = "https://www12.statcan.gc.ca/census-recensement/2021/geo/aip-pia/attribute-attribs/files-fichiers/2021_92-151_X.zip"

CISR_DIR = DATA_DIR / "cisr"
CISV_DIR = DATA_DIR / "cisv"
GEO_DIR  = DATA_DIR / "geo_attr"
OUT_CSV  = DATA_DIR / "real_cisr_cisv.csv"


def download_and_unzip(url: str, dest_dir: Path, label: str) -> None:
    if dest_dir.exists() and any(dest_dir.iterdir()):
        print(f"  {label}: using cached {dest_dir}")
        return
    dest_dir.mkdir(exist_ok=True)
    print(f"  {label}: downloading {url} …")
    with httpx.Client(follow_redirects=True, timeout=120) as client:
        r = client.get(url)
        r.raise_for_status()
    with zipfile.ZipFile(io.BytesIO(r.content)) as z:
        z.extractall(dest_dir)
    print(f"  {label}: saved to {dest_dir}")


print("Step 1 — downloading source files")
download_and_unzip(CISR_URL, CISR_DIR, "CISR")
download_and_unzip(CISV_URL, CISV_DIR, "CISV")
download_and_unzip(GEO_URL,  GEO_DIR,  "Geo crosswalk")

print("Step 2 — building DA→CT crosswalk (Ontario CMAs 535 + 537)")
geo_csv = next(GEO_DIR.glob("*.csv"))
geo = pd.read_csv(geo_csv, dtype=str, encoding="latin-1",
                  usecols=["PRUID_PRIDU", "DAUID_ADIDU", "CTUID_SRIDU", "CMAUID_RMRIDU"])
xwalk = geo[
    (geo["PRUID_PRIDU"] == "35") &
    (geo["CMAUID_RMRIDU"].isin(["535", "537"]))
][["DAUID_ADIDU", "CTUID_SRIDU"]].drop_duplicates()
xwalk["DAUID_ADIDU"] = xwalk["DAUID_ADIDU"].astype(str)
print(f"  Crosswalk: {len(xwalk)} DAs → {xwalk['CTUID_SRIDU'].nunique()} CTs")

print("Step 3 — loading CISR")
cisr_csv = next(p for p in CISR_DIR.glob("*.csv") if "notes" not in p.name)
cisr = pd.read_csv(cisr_csv)
cisr["DAUID_ADIDU"] = cisr["Dissemination Area (DA)"].astype(str).str.zfill(8)
cisr = cisr.rename(columns={
    "Dimension 1 Scores": "cisr_dim1",
    "Dimension 2 Scores": "cisr_dim2",
    "Dimension 3 Scores": "cisr_dim3",
    "CISR Scores":        "cisr_score",
    "CISR Quintiles":     "cisr_quintile",
})

print("Step 4 — loading CISV")
cisv_csv = next(p for p in CISV_DIR.glob("*.csv") if "notes" not in p.name)
cisv = pd.read_csv(cisv_csv)
cisv["DAUID_ADIDU"] = cisv["Dissemination Area (DA)"].astype(str).str.zfill(8)
cisv = cisv.rename(columns={
    "Dimension 1 Scores": "cisv_dim1",
    "Dimension 2 Scores": "cisv_dim2",
    "Dimension 3 Scores": "cisv_dim3",
    "Dimension 4 Scores": "cisv_dim4",
    "CISV Scores":        "cisv_score",
    "CISV Quintiles":     "cisv_quintile",
})

print("Step 5 — joining and aggregating to CT level")
cisr_cols = ["DAUID_ADIDU", "cisr_dim1", "cisr_dim2", "cisr_dim3", "cisr_score", "cisr_quintile"]
cisv_cols = ["DAUID_ADIDU", "cisv_dim1", "cisv_dim2", "cisv_dim3", "cisv_dim4", "cisv_score", "cisv_quintile"]

da = (xwalk
      .merge(cisr[cisr_cols], on="DAUID_ADIDU", how="left")
      .merge(cisv[cisv_cols], on="DAUID_ADIDU", how="left"))

score_cols = [c for c in da.columns if c not in ("DAUID_ADIDU", "CTUID_SRIDU")]
ct = (da.groupby("CTUID_SRIDU")[score_cols]
        .mean()
        .round(4)
        .reset_index()
        .rename(columns={"CTUID_SRIDU": "CTUID"}))

ct.to_csv(OUT_CSV, index=False)
print(f"✅ {OUT_CSV.name} — {len(ct)} CTs, "
      f"null rate cisv_score={ct['cisv_score'].isna().mean():.1%}, "
      f"cisr_score={ct['cisr_score'].isna().mean():.1%}")
