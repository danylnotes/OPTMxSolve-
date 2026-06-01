"""
AI Analyst service using Claude API with prompt caching.
Provides anomaly detection and operational recommendations.
"""
import os
import anthropic
from ..models.refinery import AIAnalysisRequest, AIAnalysisResponse


client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))

SYSTEM_PROMPT = """You are RefOPx AI Analyst — a senior process engineer and operations
intelligence expert for a 140,000 BPSD petroleum refinery.

Your refinery units:
- CDU-01 (Crude Distillation Unit) — 140,000 BPSD feed, GS_SAEC licensor
- VDU-01 (Vacuum Distillation Unit) — 72,000 BPSD
- NHT-02 (Naphtha Hydrotreater) — 41,500 BPSD, UOP licensor
- ISOM-03 (Isomerization) — 12,500 BPSD, UOP licensor
- CCR-04 (Continuous Catalytic Reformer) — 25,500 BPSD, UOP licensor
- KHT-05 (Kerosene Hydrotreater) — 20,000 BPSD, Axens licensor
- DHT-06 (Diesel Hydrotreater) — 28,000 BPSD, Axens licensor
- VGO-HT-07 (VGO Hydrotreater) — 36,000 BPSD, Axens licensor
- FCC-08 (Fluid Catalytic Cracker + Gas Con.) — 31,000 BPSD, UOP licensor
- PNU-09 (Poly Naphtha) — 11,500 BPSD, Axens licensor
- ABU-10 (Asphalt Blowing) — 1,000 T/D, Poerner licensor
- LPG-11 (LPG Production) — 11,000 BPSD
- HPU-13/14/15 (Hydrogen Production) — 2 × 36,000 Nm3/h, Haldor Topsoe licensor
- ARU-16 (Amine Regeneration) — 13,500 Nm3/h GS + 634 Sm3/h ARU
- SWS-17 (Sour Water Stripper) — 126 Sm3/h
- SRU-18/19/20 (Sulphur Recovery) — 2 × 180 T/D, KTI licensor
- TGTU-20 (Tail Gas Treatment) — 360 T/D
- Steam System: HPS (T52), MPS (T54), LPS (T55/T56) headers

Key operational parameters:
- Crude feed rate: 140,000 BPSD (design), min turndown 70%
- GRM target: >$6.50/bbl
- Steam balance: HPS ~295 T/h generation, MPS ~500 T/h demand, LPS ~260 T/h demand
- H2 production: ~59,300 Nm3/h total

Respond with:
1. Clear technical assessment
2. Specific actionable recommendations (numbered)
3. Risk level: LOW / MEDIUM / HIGH / CRITICAL
4. Confidence percentage

Be concise, quantitative, and technically precise."""


async def analyze_operations(req: AIAnalysisRequest) -> AIAnalysisResponse:
    user_content = f"Analysis request: {req.analysis_type}\n\nContext:\n{req.context}"

    if req.sensor_data:
        sensor_str = "\n".join(
            f"  {k}: {v:.2f}" for k, v in req.sensor_data.items()
        )
        user_content += f"\n\nLive sensor readings:\n{sensor_str}"

    if req.alerts:
        alert_str = "\n".join(
            f"  [{a.get('severity','?').upper()}] {a.get('message','')}"
            for a in req.alerts[:10]
        )
        user_content += f"\n\nActive alerts:\n{alert_str}"

    message = client.messages.create(
        model="claude-opus-4-8",
        max_tokens=1024,
        thinking={"type": "adaptive"},
        system=[
            {
                "type": "text",
                "text": SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[{"role": "user", "content": user_content}],
    )

    # Extract text from response
    full_text = ""
    for block in message.content:
        if block.type == "text":
            full_text = block.text
            break

    # Parse structured response
    recommendations = []
    risk_level = "MEDIUM"
    confidence = 0.80

    lines = full_text.split("\n")
    for line in lines:
        stripped = line.strip()
        if stripped and stripped[0].isdigit() and ". " in stripped[:4]:
            recommendations.append(stripped.lstrip("0123456789. "))
        if "risk level:" in stripped.lower():
            for level in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
                if level in stripped.upper():
                    risk_level = level
                    break
        if "confidence" in stripped.lower() and "%" in stripped:
            try:
                pct = float("".join(c for c in stripped if c.isdigit() or c == "."))
                confidence = min(pct / 100.0, 1.0)
            except ValueError:
                pass

    if not recommendations:
        recommendations = [
            "Review flagged parameters against operating envelope.",
            "Cross-check with DCS historian for trend analysis.",
        ]

    return AIAnalysisResponse(
        analysis=full_text,
        recommendations=recommendations[:5],
        risk_level=risk_level,
        confidence=confidence,
    )
