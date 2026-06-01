"""
Steam balance calculator for HPS / MPS / LPS headers.
Based on the Feb 2024 Steam Balance sheet data.
"""
from ..models.refinery import SteamBalanceRequest, SteamBalanceResult


# Steam generation factors (T/h per 1000 BPSD crude feed)
STEAM_GEN_FACTOR = {
    "HPS": 2.10,   # T/h per 1000 BPSD
    "MPS": 0.45,
    "LPS": 0.20,
}

# Unit steam consumption (T/h) at 140k BPSD design basis
HPS_CONSUMERS = {
    "CDU": 50.7, "NHT": 43.7, "ISOM": 25.3, "KHT": 30.0,
    "DHT": 30.0, "VGO": 34.5, "FCC": 30.7, "CCR": 4.9,
    "HPU": 48.0, "SRU": 22.9, "ABU": 24.5, "Tank": 34.5,
    "ASL": 1.7,
}

MPS_CONSUMERS = {
    "CDU": 47.8, "NHT": 27.0, "ISOM": 46.9, "KHT": 0.8,
    "DHT": 0.8, "VGO": 12.0, "FCC": 31.9, "CCR": 33.8,
    "SGU": 87.5, "PGU": 3.8, "CCT": 9.4, "RFU": 0.6,
    "ASL": 2.6, "Tank": 0.0, "WWT": 0.0, "FLARE": 0.8,
}

LPS_CONSUMERS = {
    "ARU": 83.0, "SWS": 28.0, "SRU": 7.4, "ASL": 0.6,
    "SSB": 0.1, "Tank": 32.0, "Depot": 0.7,
    "HFO": 0.1, "WWT": 0.0, "RWT": 0.1, "DW": 0.1, "FLARE": 0.0,
}

# HPS generation sources
HPS_GENERATORS = {
    "36-STG": 320.0,   # Steam turbine generator
    "37-HRSG": 495.0,  # Heat recovery steam generators
    "36-B-001A": 164.0,
    "36-B-001B": 164.0,
    "36-B-001C": 167.0,
}


def calculate_steam_balance(req: SteamBalanceRequest) -> SteamBalanceResult:
    scale = req.crude_feed_bpd / 140_000.0
    eff = req.boiler_efficiency / 0.88  # relative to design

    # HPS generation (boilers + HRSG)
    hps_gen = sum(HPS_GENERATORS.values()) * eff * scale
    hps_cons = {k: round(v * scale, 1) for k, v in HPS_CONSUMERS.items()}
    hps_total_cons = sum(hps_cons.values())
    hps_letdown_to_mps = max(0.0, hps_gen - hps_total_cons)

    # MPS (receives letdown from HPS + turbine exhaust)
    mps_gen = hps_letdown_to_mps + 250.0 * scale
    mps_cons = {k: round(v * scale, 1) for k, v in MPS_CONSUMERS.items()}
    mps_total_cons = sum(mps_cons.values())
    mps_letdown_to_lps = max(0.0, mps_gen - mps_total_cons)

    # LPS (receives letdown from MPS)
    lps_gen = mps_letdown_to_lps + 50.0 * scale
    lps_cons = {k: round(v * scale, 1) for k, v in LPS_CONSUMERS.items()}
    lps_total_cons = sum(lps_cons.values())

    surplus = {
        "HPS": round(hps_gen - hps_total_cons, 1),
        "MPS": round(mps_gen - mps_total_cons, 1),
        "LPS": round(lps_gen - lps_total_cons, 1),
    }

    # Overall efficiency: useful steam / fuel equivalent
    useful_steam = hps_total_cons + mps_total_cons + lps_total_cons
    fuel_steam = hps_gen  # HPS is generated from fuel
    efficiency_pct = round((useful_steam / max(fuel_steam, 1)) * 100, 1)

    return SteamBalanceResult(
        hps_generation_t_h=round(hps_gen, 1),
        hps_consumption_t_h=hps_cons,
        mps_generation_t_h=round(mps_gen, 1),
        mps_consumption_t_h=mps_cons,
        lps_generation_t_h=round(lps_gen, 1),
        lps_consumption_t_h=lps_cons,
        surplus_deficit=surplus,
        efficiency_percent=efficiency_pct,
    )
