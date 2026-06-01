from fastapi import APIRouter, HTTPException
from ..models.refinery import SteamBalanceRequest, SteamBalanceResult
from ..services.steam_balance import calculate_steam_balance

router = APIRouter(prefix="/api/steam", tags=["Steam Balance"])


@router.post("/balance", response_model=SteamBalanceResult)
async def steam_balance(request: SteamBalanceRequest) -> SteamBalanceResult:
    try:
        return calculate_steam_balance(request)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
