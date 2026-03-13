"""
app/routes/health.py
====================
Health check endpoint.

Purpose:
  - Used by Docker, load balancers, and monitoring tools to check
    if the service is alive and ready to handle requests.
  - A simple endpoint that returns { "status": "ok" }.

Endpoint:
  GET /health

Author : Christo
"""

from fastapi import APIRouter
from app.schemas import HealthResponse
from app.model_loader import is_model_loaded

router = APIRouter(
    tags=["Health"],
)


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description="Returns the health status of the API and whether the ML model is loaded.",
)
async def health_check() -> HealthResponse:
    """
    Returns 'ok' if the service is running.
    Also reports whether the ML model is loaded in memory.
    """
    return HealthResponse(
        status="ok",
        model_loaded=is_model_loaded(),
        service="Housing ML Model Service",
    )
