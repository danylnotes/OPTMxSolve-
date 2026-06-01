"""
RefOPx v2 Backend — FastAPI
Refinery Operations Optimization & Intelligence Platform
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import optimization, steam, ai

app = FastAPI(
    title="RefOPx API",
    description="Refinery Operations Optimization Platform",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(optimization.router)
app.include_router(steam.router)
app.include_router(ai.router)


@app.get("/")
async def root():
    return {
        "service": "RefOPx Backend",
        "version": "2.0.0",
        "endpoints": ["/api/optimize/lp", "/api/steam/balance", "/api/ai/analyze"],
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
