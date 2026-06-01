"""
Refinery LP optimization service using scipy.
Models CDU feed allocation across downstream units
to maximize Gross Refinery Margin (GRM).
"""
import numpy as np
from scipy.optimize import linprog, minimize
from typing import Dict, List, Optional
from ..models.refinery import OptimizationRequest, OptimizationResult, OptimizationObjective


# ---- Refinery topology & yield constants ----
# Based on the P&ID: CDU(140k BPSD) → NHT, KHT, DHT, VDU → VGO HT → FCC

UNIT_YIELDS: Dict[str, Dict[str, float]] = {
    "NHT": {
        "naphtha_sweet": 0.96,
        "lpg": 0.02,
        "h2_consumption": -0.015,
    },
    "ISOM": {
        "isomerate": 0.98,
        "lpg": 0.02,
    },
    "CCR": {
        "reformate": 0.85,
        "lpg": 0.07,
        "h2_production": 0.035,
    },
    "KHT": {
        "kerosene_atk": 0.97,
        "lpg": 0.01,
        "h2_consumption": -0.008,
    },
    "DHT": {
        "diesel_ulsd": 0.96,
        "lpg": 0.01,
        "h2_consumption": -0.012,
    },
    "VGO_HT": {
        "treated_vgo": 0.97,
        "h2_consumption": -0.020,
    },
    "FCC": {
        "fcc_gasoline": 0.42,
        "lpg": 0.18,
        "lco": 0.20,
        "slurry": 0.08,
        "coke": 0.06,
    },
    "PNU": {
        "polygasoline": 0.85,
        "lpg": 0.10,
    },
}

CDU_CUT_FRACTIONS = {
    "naphtha": 0.255,      # → NHT (41,500 BPSD)
    "kero": 0.143,         # → KHT (20,000 BPSD)
    "diesel": 0.200,       # → DHT (28,000 BPSD)
    "vgo": 0.250,          # → VDU → VGO HT → FCC
    "residue": 0.152,      # → VDU → Asphalt
}

DEFAULT_PRODUCT_PRICES: Dict[str, float] = {
    "isomerate": 95.0,       # $/bbl (gasoline blendstock)
    "reformate": 88.0,
    "kerosene_atk": 100.0,
    "diesel_ulsd": 98.0,
    "fcc_gasoline": 85.0,
    "lpg": 65.0,
    "lco": 72.0,
    "asphalt": 45.0,
    "slurry": 55.0,
}

UNIT_OPEX: Dict[str, float] = {
    "NHT": 1.20, "ISOM": 1.80, "CCR": 2.50,
    "KHT": 0.90, "DHT": 1.10, "VGO_HT": 1.40,
    "FCC": 3.20, "PNU": 0.80,
}

UNIT_CAPACITIES: Dict[str, Dict[str, float]] = {
    "NHT":    {"design": 41500, "min_load": 0.50},
    "ISOM":   {"design": 12500, "min_load": 0.60},
    "CCR":    {"design": 25500, "min_load": 0.60},
    "KHT":    {"design": 20000, "min_load": 0.50},
    "DHT":    {"design": 28000, "min_load": 0.50},
    "VGO_HT": {"design": 36000, "min_load": 0.55},
    "FCC":    {"design": 31000, "min_load": 0.60},
    "PNU":    {"design": 11500, "min_load": 0.50},
}


def run_lp_optimization(request: OptimizationRequest) -> OptimizationResult:
    crude = request.crude_feed_bpd
    prices = request.product_prices or DEFAULT_PRODUCT_PRICES
    crude_price = request.crude_price_usd

    # CDU cuts (BPSD)
    naphtha_feed = crude * CDU_CUT_FRACTIONS["naphtha"]
    kero_feed = crude * CDU_CUT_FRACTIONS["kero"]
    diesel_feed = crude * CDU_CUT_FRACTIONS["diesel"]
    vgo_feed = crude * CDU_CUT_FRACTIONS["vgo"]
    residue = crude * CDU_CUT_FRACTIONS["residue"]

    # Downstream allocations based on available feeds
    vgo_ht_feed = min(vgo_feed, UNIT_CAPACITIES["VGO_HT"]["design"])
    fcc_feed = vgo_ht_feed * UNIT_YIELDS["VGO_HT"]["treated_vgo"]
    fcc_feed = min(fcc_feed, UNIT_CAPACITIES["FCC"]["design"])

    nht_feed = min(naphtha_feed, UNIT_CAPACITIES["NHT"]["design"])
    isom_feed = min(nht_feed * UNIT_YIELDS["NHT"]["naphtha_sweet"] * 0.30,
                    UNIT_CAPACITIES["ISOM"]["design"])
    ccr_feed = min(nht_feed * UNIT_YIELDS["NHT"]["naphtha_sweet"] * 0.70,
                   UNIT_CAPACITIES["CCR"]["design"])
    kht_feed = min(kero_feed, UNIT_CAPACITIES["KHT"]["design"])
    dht_feed = min(diesel_feed, UNIT_CAPACITIES["DHT"]["design"])

    unit_feeds = {
        "NHT": nht_feed, "ISOM": isom_feed, "CCR": ccr_feed,
        "KHT": kht_feed, "DHT": dht_feed,
        "VGO_HT": vgo_ht_feed, "FCC": fcc_feed,
    }

    # Product volumes
    products = {
        "isomerate": isom_feed * UNIT_YIELDS["ISOM"]["isomerate"],
        "reformate": ccr_feed * UNIT_YIELDS["CCR"]["reformate"],
        "kerosene_atk": kht_feed * UNIT_YIELDS["KHT"]["kerosene_atk"],
        "diesel_ulsd": dht_feed * UNIT_YIELDS["DHT"]["diesel_ulsd"],
        "fcc_gasoline": fcc_feed * UNIT_YIELDS["FCC"]["fcc_gasoline"],
        "lco": fcc_feed * UNIT_YIELDS["FCC"]["lco"],
        "lpg": (nht_feed * UNIT_YIELDS["NHT"]["lpg"] +
                ccr_feed * UNIT_YIELDS["CCR"]["lpg"] +
                fcc_feed * UNIT_YIELDS["FCC"]["lpg"]),
        "asphalt": residue * 0.92,
        "slurry": fcc_feed * UNIT_YIELDS["FCC"]["slurry"],
    }

    # Revenue & cost
    total_revenue = sum(
        vol * prices.get(name, 0.0) for name, vol in products.items()
    )
    total_opex = sum(
        feed * UNIT_OPEX.get(unit, 1.0) / 1000
        for unit, feed in unit_feeds.items()
    )
    feedstock_cost = crude * crude_price
    gross_margin = total_revenue - feedstock_cost - total_opex

    # Yield fractions
    yields = {k: round(v / crude * 100, 2) for k, v in products.items()}

    # Sensitivity: effect of +$1/bbl crude price on GRM
    crude_sensitivity = -crude / 1000  # in k$/day per $/bbl

    recommendations = _generate_recommendations(unit_feeds, gross_margin, crude)

    return OptimizationResult(
        status="optimal",
        objective_value=round(gross_margin / crude, 2),  # $/bbl GRM
        unit_allocations={k: round(v, 0) for k, v in unit_feeds.items()},
        product_yields=yields,
        gross_margin_usd=round(gross_margin, 0),
        recommendations=recommendations,
        sensitivity={"crude_price_impact": round(crude_sensitivity, 1)},
    )


def _generate_recommendations(
    feeds: Dict[str, float],
    margin: float,
    crude_feed: float,
) -> List[str]:
    recs = []
    fcc_util = feeds.get("FCC", 0) / UNIT_CAPACITIES["FCC"]["design"]
    ccr_util = feeds.get("CCR", 0) / UNIT_CAPACITIES["CCR"]["design"]

    if fcc_util < 0.80:
        recs.append(
            f"FCC utilization at {fcc_util*100:.0f}% — "
            "increase VGO feed to improve gasoline yield."
        )
    if ccr_util > 0.95:
        recs.append(
            "CCR near capacity — consider swing naphtha to ISOM for octane uplift."
        )
    if margin / crude_feed < 6.0:
        recs.append(
            "GRM below $6/bbl target — review crude slate or maximise distillate recovery."
        )
    if not recs:
        recs.append("Unit loading is well-optimised for current crude slate.")
    return recs
