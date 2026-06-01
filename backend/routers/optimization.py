from fastapi import APIRouter, HTTPException
from ..models.refinery import OptimizationRequest, OptimizationResult
from ..services.optimization import run_lp_optimization

router = APIRouter(prefix="/api/optimize", tags=["Optimization"])


@router.post("/lp", response_model=OptimizationResult)
async def optimize_refinery(request: OptimizationRequest) -> OptimizationResult:
    try:
        return run_lp_optimization(request)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "LP Optimizer"}
