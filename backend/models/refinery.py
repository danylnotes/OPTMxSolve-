from pydantic import BaseModel
from typing import Optional, List, Dict
from enum import Enum


class UnitStatus(str, Enum):
    OPERATIONAL = "Operational"
    WARNING = "Warning"
    CRITICAL = "Critical"
    MAINTENANCE = "Maintenance"


class OptimizationObjective(str, Enum):
    MAX_MARGIN = "max_margin"
    MIN_ENERGY = "min_energy"
    MAX_THROUGHPUT = "max_throughput"
    MAX_DISTILLATE = "max_distillate"


class UnitConstraint(BaseModel):
    unit_id: str
    min_feed: float
    max_feed: float
    current_feed: float


class OptimizationRequest(BaseModel):
    crude_feed_bpd: float = 140000
    objective: OptimizationObjective = OptimizationObjective.MAX_MARGIN
    constraints: Optional[List[UnitConstraint]] = None
    crude_price_usd: float = 78.0
    product_prices: Optional[Dict[str, float]] = None


class OptimizationResult(BaseModel):
    status: str
    objective_value: float
    unit_allocations: Dict[str, float]
    product_yields: Dict[str, float]
    gross_margin_usd: float
    recommendations: List[str]
    sensitivity: Dict[str, float]


class SteamBalanceRequest(BaseModel):
    crude_feed_bpd: float = 140000
    ambient_temp_c: float = 32.0
    boiler_efficiency: float = 0.88


class SteamBalanceResult(BaseModel):
    hps_generation_t_h: float
    hps_consumption_t_h: Dict[str, float]
    mps_generation_t_h: float
    mps_consumption_t_h: Dict[str, float]
    lps_generation_t_h: float
    lps_consumption_t_h: Dict[str, float]
    surplus_deficit: Dict[str, float]
    efficiency_percent: float


class AIAnalysisRequest(BaseModel):
    context: str
    sensor_data: Optional[Dict[str, float]] = None
    alerts: Optional[List[Dict]] = None
    analysis_type: str = "general"


class AIAnalysisResponse(BaseModel):
    analysis: str
    recommendations: List[str]
    risk_level: str
    confidence: float
