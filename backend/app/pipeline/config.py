"""Pipeline configuration: scenarios, factor columns, source slugs, MLflow.

The values here are read at the start of each stage so a tweak (new factor,
heavier scenario weight) does not require restarting the backend -- it only
needs the pipeline re-run.
"""

from __future__ import annotations

import os
from dataclasses import dataclass

# ----- Tier A factor columns (ML input) ------------------------------------
# Columns the PCA actually fits on. Tier C live signals (humidex, outages) are
# layered on at request time and never enter training.
FACTOR_COLS: tuple[str, ...] = (
    "median_income",
    "pct_pre1980",
    "pct_renters",
    "pct_low_income",   # added: low-income rate is a key energy-poverty signal
    "cisv_score",
    "cisv_dim1",
    "cisv_dim2",
    "cisv_dim3",
    "cisv_dim4",
    "cisr_score",
)

# Columns where a HIGHER raw value means LOWER vulnerability. The trainer
# flips their sign before fitting so PC1 always points "more vulnerable".
INVERTED_FACTORS: frozenset[str] = frozenset({"median_income", "cisr_score"})


# ----- Scenarios -----------------------------------------------------------
# Scenario weight overrides applied to factor columns before PCA fit.
# Weights multiply the factor value, making that factor drive PC1 more strongly.
# The empty dict for baseline means "equal weights -- use raw factors".
#
# Factor semantics:
#   pct_renters    -- renters cannot independently control HVAC / make efficiency upgrades
#   pct_low_income -- poverty limits ability to afford cooling equipment or leave
#   pct_pre1980    -- pre-1980 buildings lack insulation; HVAC failure is more likely
#   cisv_dim2      -- material deprivation dimension from StatsCan CISV (2021)
#   cisr_score     -- resilience score: LOWER cisr = less resilient (sign-flipped in train)
#   median_income  -- income inversely linked to vulnerability (sign-flipped in train)
#
# Heatwave: amplify heat-stress factors. Renters can't modify HVAC; low-income households
#   can't afford cooling; older buildings are thermal death traps in July.
# Ice Storm: amplify cold+outage factors. Old building envelopes fail first; low-income
#   households cannot afford hotel stays or supplemental heating; low resilience amplifies
#   recovery time after extended outages.
SCENARIOS: dict[str, dict[str, float]] = {
    "baseline": {},
    "heatwave": {
        "pct_renters": 1.8,     # renters cannot upgrade cooling
        "pct_low_income": 2.0,  # affordability gap for AC / fans
        "pct_pre1980": 1.3,     # poor insulation = heat trap
        "cisv_dim2": 1.5,       # material deprivation amplifies heat risk
    },
    "icestorm": {
        "pct_pre1980": 2.0,     # old envelope fails fastest in sustained cold
        "pct_low_income": 1.8,  # cannot afford supplemental heat or evacuation
        "cisr_score": 1.5,      # low resilience = slow recovery from outage
        "pct_renters": 1.2,     # renters depend on landlord for emergency repairs
    },
}


# ----- Grade buckets -------------------------------------------------------
# Composite score is 0..100. The bucket label is what the frontend shows and
# what the LLM uses to phrase the briefing.
GRADE_BUCKETS: tuple[tuple[float, str], ...] = (
    (75.0, "Critical"),
    (50.0, "High"),
    (25.0, "Moderate"),
    (0.0, "Low"),
)


def grade_for(score: float | None) -> str:
    if score is None:
        return "Low"
    try:
        s = float(score)
    except (TypeError, ValueError):
        return "Low"
    if s != s:  # NaN check without importing math
        return "Low"
    for threshold, label in GRADE_BUCKETS:
        if s >= threshold:
            return label
    return "Low"


# ----- Provenance (source slug map) ----------------------------------------
# Maps factor column -> upstream source slug for the loadings table. Backend
# joins on this to render "this score is driven by CISV (StatsCan 2021)" tags.
FACTOR_SOURCE_MAP: dict[str, str] = {
    "median_income": "brampton-esri-census2021",
    "pct_pre1980": "brampton-esri-census2021",
    "pct_renters": "brampton-esri-census2021",
    "pct_low_income": "brampton-esri-census2021",
    "population": "brampton-esri-census2021",
    "cisv_score": "statcan-cisv-2021",
    "cisv_dim1": "statcan-cisv-2021",
    "cisv_dim2": "statcan-cisv-2021",
    "cisv_dim3": "statcan-cisv-2021",
    "cisv_dim4": "statcan-cisv-2021",
    "cisr_score": "statcan-cisr-2021",
}


# ----- MLflow / Prefect runtime ---------------------------------------------
@dataclass(frozen=True)
class PipelineRuntime:
    mlflow_tracking_uri: str
    mlflow_experiment: str
    prefect_api_url: str | None


def runtime() -> PipelineRuntime:
    return PipelineRuntime(
        mlflow_tracking_uri=os.getenv(
            "THRESHOLD_MLFLOW_TRACKING_URI", "http://localhost:5000"
        ),
        mlflow_experiment=os.getenv(
            "THRESHOLD_MLFLOW_EXPERIMENT", "threshold-pca"
        ),
        prefect_api_url=os.getenv("THRESHOLD_PREFECT_API_URL"),
    )
