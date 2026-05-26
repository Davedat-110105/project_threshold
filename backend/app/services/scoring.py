"""Score lookup and factor traceability.

Scoring formula (from pipeline to frontend)
--------------------------------------------
1. The pipeline (``python -m app.pipeline``) fits a separate
   ``StandardScaler + PCA(n_components=5)`` for each scenario on the
   curated feature table (``curated.community_features``).
2. PC1 from each fit is rescaled to [0, 100] using the training-set min/max.
   Higher score = more vulnerable.
3. The publish stage writes these pre-computed scores as
   ``threshold_score_<scenario>`` into ``public.communities``.
4. At request time this module reads those pre-computed values directly.
   No scoring happens in the request path.

Scenario factor weights (applied before PCA fit in pipeline/config.py)
-----------------------------------------------------------------------
  baseline  -- equal weights across all 10 factors
  heatwave  -- pct_renters ×1.8, pct_low_income ×2.0, pct_pre1980 ×1.3,
               cisv_dim2 ×1.5
  icestorm  -- pct_pre1980 ×2.0, pct_low_income ×1.8, cisr_score ×1.5,
               pct_renters ×1.2

Note: humidex, active_outages, and customers_affected are Tier C live signals.
They are layered as UI overlays and never enter PCA training.
"""

from __future__ import annotations

from ..models.community import (
    CommunityDetail,
    CommunitySummary,
    FactorBreakdown,
    RiskTier,
    Scenario,
)
from ..sources import FACTOR_TO_SOURCE, get_source
from .data_loader import (
    FACTOR_DIRECTION,
    FACTOR_LABELS,
    PCA_FACTORS,
    CommunityRecord,
    DataStore,
    FactorLoading,
)

SCENARIOS: tuple[Scenario, ...] = ("baseline", "heatwave", "icestorm")

SCENARIO_LABELS: dict[Scenario, str] = {
    "baseline": "Baseline",
    "heatwave": "Heatwave",
    "icestorm": "Ice Storm",
}

SCENARIO_DESCRIPTIONS: dict[Scenario, str] = {
    "baseline": "Equal-weight PCA composite across all 10 factors.",
    "heatwave": (
        "Amplifies heat-stress factors: renter share (×1.8), low-income rate (×2.0), "
        "pre-1980 buildings (×1.3), and material deprivation (CISV dim2 ×1.5)."
    ),
    "icestorm": (
        "Amplifies cold-outage factors: pre-1980 buildings (×2.0), low-income rate (×1.8), "
        "resilience score (CISR ×1.5), and renter share (×1.2)."
    ),
}

# Documentation reference for what the pipeline trained with (see pipeline/config.py).
# These values are NOT applied at request time -- scores are pre-computed.
# Update this dict whenever pipeline/config.py SCENARIOS changes.
SCENARIO_WEIGHTS: dict[Scenario, dict[str, float]] = {
    "baseline": {},
    "heatwave": {
        "pct_renters": 1.8,
        "pct_low_income": 2.0,
        "pct_pre1980": 1.3,
        "cisv_dim2": 1.5,
    },
    "icestorm": {
        "pct_pre1980": 2.0,
        "pct_low_income": 1.8,
        "cisr_score": 1.5,
        "pct_renters": 1.2,
    },
}


def risk_tier(score: float | None) -> RiskTier | None:
    """Map a 0–100 score to the four-tier label used throughout the UI."""
    if score is None:
        return None
    if score >= 75:
        return "Critical"
    if score >= 50:
        return "High"
    if score >= 25:
        return "Moderate"
    return "Low"


def score_for(rec: CommunityRecord, scenario: Scenario) -> float | None:
    """Read the pre-computed score for a CT/scenario. Numbers come from PCA."""
    key = {
        "baseline": "threshold_score_baseline",
        "heatwave": "threshold_score_heatwave",
        "icestorm": "threshold_score_icestorm",
    }[scenario]
    val = rec.properties.get(key)
    if val is None:
        return None
    try:
        return float(val)
    except (TypeError, ValueError):
        return None


def to_summary(rec: CommunityRecord) -> CommunitySummary:
    props = rec.properties
    return CommunitySummary(
        ctuid=rec.ctuid,
        neighbourhood=str(props.get("neighbourhood") or "Brampton"),
        population=_to_int(props.get("population")),
        median_income=_to_float(props.get("median_income")),
        pct_renters=_to_float(props.get("pct_renters")),
        pct_pre1980=_to_float(props.get("pct_pre1980")),
        pct_low_income=_to_float(props.get("pct_low_income")),
        cisv_score=_to_float(props.get("cisv_score")),
        cisv_dim1=_to_float(props.get("cisv_dim1")),
        cisv_dim2=_to_float(props.get("cisv_dim2")),
        cisv_dim3=_to_float(props.get("cisv_dim3")),
        cisv_dim4=_to_float(props.get("cisv_dim4")),
        cisv_quintile=_to_int(props.get("cisv_quintile")),
        cisr_score=_to_float(props.get("cisr_score")),
        cisr_quintile=_to_int(props.get("cisr_quintile")),
        humidex=_to_float(props.get("humidex")),
        temperature_c=_to_float(props.get("temperature_c")),
        precipitation_mm=_to_float(props.get("precipitation_mm")),
        wind_speed_kmh=_to_float(props.get("wind_speed_kmh")),
        wind_gusts_kmh=_to_float(props.get("wind_gusts_kmh")),
        weather_code=_to_int(props.get("weather_code")),
        active_outages=_to_int(props.get("active_outages")) or 0,
        customers_affected=_to_int(props.get("customers_affected")) or 0,
        threshold_score_baseline=_to_float(props.get("threshold_score_baseline")),
        threshold_score_heatwave=_to_float(props.get("threshold_score_heatwave")),
        threshold_score_icestorm=_to_float(props.get("threshold_score_icestorm")),
        risk_level=props.get("risk_level") or risk_tier(_to_float(props.get("threshold_score_baseline"))),
    )


def to_detail(rec: CommunityRecord, store: DataStore, scenario: Scenario) -> CommunityDetail:
    props = rec.properties
    score = score_for(rec, scenario)
    return CommunityDetail(
        ctuid=rec.ctuid,
        neighbourhood=str(props.get("neighbourhood") or "Brampton"),
        risk_level=risk_tier(score),
        scores={
            "baseline": score_for(rec, "baseline"),
            "heatwave": score_for(rec, "heatwave"),
            "icestorm": score_for(rec, "icestorm"),
        },
        population=_to_int(props.get("population")),
        median_income=_to_float(props.get("median_income")),
        pct_renters=_to_float(props.get("pct_renters")),
        pct_pre1980=_to_float(props.get("pct_pre1980")),
        pct_low_income=_to_float(props.get("pct_low_income")),
        cisv={
            "score": _to_float(props.get("cisv_score")),
            "dim1": _to_float(props.get("cisv_dim1")),
            "dim2": _to_float(props.get("cisv_dim2")),
            "dim3": _to_float(props.get("cisv_dim3")),
            "dim4": _to_float(props.get("cisv_dim4")),
            "quintile": _to_float(props.get("cisv_quintile")),
        },
        cisr={
            "score": _to_float(props.get("cisr_score")),
            "dim1": _to_float(props.get("cisr_dim1")),
            "dim2": _to_float(props.get("cisr_dim2")),
            "dim3": _to_float(props.get("cisr_dim3")),
            "quintile": _to_float(props.get("cisr_quintile")),
        },
        weather={
            "temperature_c": _to_float(props.get("temperature_c")),
            "humidex": _to_float(props.get("humidex")),
            "precipitation_mm": _to_float(props.get("precipitation_mm")),
            "wind_speed_kmh": _to_float(props.get("wind_speed_kmh")),
            "wind_gusts_kmh": _to_float(props.get("wind_gusts_kmh")),
            "weather_code": _to_int(props.get("weather_code")),
        },
        outages={
            "active_outages": _to_int(props.get("active_outages")) or 0,
            "customers_affected": _to_int(props.get("customers_affected")) or 0,
        },
        factors=factor_breakdown(rec, store),
    )


def factor_breakdown(rec: CommunityRecord, store: DataStore) -> list[FactorBreakdown]:
    """Per-CT factor radar. PCA loadings come from the ``pca_loadings`` table."""
    out: list[FactorBreakdown] = []
    for name in PCA_FACTORS:
        loading = store.loadings.get(name) or FactorLoading(name=name, loading_baseline=0.0, loading_heatwave=0.0, loading_icestorm=0.0)
        raw = _to_float(rec.properties.get(name))
        source_slug = FACTOR_TO_SOURCE.get(name)
        if source_slug is None:
            continue
        direction = FACTOR_DIRECTION.get(name, "vulnerable")
        # mypy-narrow: direction is one of the two literals
        if direction not in ("vulnerable", "resilient"):
            direction = "vulnerable"
        out.append(
            FactorBreakdown(
                name=name,
                label=FACTOR_LABELS.get(name, name),
                raw_value=raw,
                loading_baseline=loading.loading_baseline,
                loading_heatwave=loading.loading_heatwave,
                loading_icestorm=loading.loading_icestorm,
                direction=direction,  # type: ignore[arg-type]
                source=get_source(source_slug),
            )
        )
    return out


def _to_float(v: object) -> float | None:
    if v is None or v == "":
        return None
    try:
        return float(v)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None


def _to_int(v: object) -> int | None:
    f = _to_float(v)
    if f is None:
        return None
    return int(f)
