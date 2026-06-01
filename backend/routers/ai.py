from fastapi import APIRouter, HTTPException
from ..models.refinery import AIAnalysisRequest, AIAnalysisResponse
from ..services.ai_analyst import analyze_operations

router = APIRouter(prefix="/api/ai", tags=["AI Analyst"])


@router.post("/analyze", response_model=AIAnalysisResponse)
async def ai_analyze(request: AIAnalysisRequest) -> AIAnalysisResponse:
    try:
        return await analyze_operations(request)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
