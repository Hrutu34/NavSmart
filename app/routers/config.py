"""
Configuration API Endpoints for NavSmart.
Exposes required frontend configuration values safely.
"""

from fastapi import APIRouter
from app.config import settings

router = APIRouter(prefix="/api/config", tags=["Config"])

@router.get("")
async def get_frontend_config():
    """
    Returns public environment configurations needed by the frontend script.
    """
    return {
        "googleMapsApiKey": settings.GOOGLE_MAPS_API_KEY,
        "llmProvider": settings.LLM_PROVIDER
    }
