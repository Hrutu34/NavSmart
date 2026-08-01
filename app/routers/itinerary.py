"""
Itinerary API Router for NavSmart.
Generates structured multi-day travel itineraries.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from app.services.llm_service import generate_itinerary_json

router = APIRouter(tags=["Itinerary"])

class ItineraryRequest(BaseModel):
    message: str


@router.post("/location/get-itinerary")
@router.post("/api/itinerary")
async def get_itinerary_plan(req: ItineraryRequest):
    """
    Generates structured JSON travel itinerary.
    """
    itinerary_data = await generate_itinerary_json(req.message)
    return itinerary_data
