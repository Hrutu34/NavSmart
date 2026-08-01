"""
Route & Navigation API Router for NavSmart.
Handles start-to-end location parsing, coordinate geocoding, and polyline extraction.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, List
from app.services.geocoding_service import get_coordinates
from app.services.directions_service import get_all_stop_points
from app.config import settings

router = APIRouter(tags=["Navigation & Route"])

class RouteRequest(BaseModel):
    message: str

def parse_from_to(message: str):
    """Parse 'from <start> to <end>' out of human prompt text."""
    msg = message.lower().strip()
    if "from " in msg and " to " in msg:
        try:
            after_from = msg.split("from ", 1)[1]
            parts = after_from.split(" to ", 1)
            return parts[0].strip(), parts[1].strip()
        except IndexError:
            pass
    return None, None


@router.post("/location/get-details-route")
@router.post("/api/route/details")
async def get_details_route(req: RouteRequest):
    """
    Extracts route waypoints and polyline coordinates.
    """
    start_location, end_location = parse_from_to(req.message)

    if not start_location or not end_location:
        # Fallback keyword extraction: try comma separated or simple space
        words = req.message.replace("from", "").replace("to", "").strip().split(" ")
        if len(words) >= 2:
            start_location, end_location = words[0], words[-1]
        else:
            return {
                "reply": "Please specify your route using the format: 'Route from [Start] to [Destination]'.",
                "points": []
            }

    points = get_all_stop_points(
        start_location,
        end_location,
        settings.GOOGLE_MAPS_API_KEY
    )

    return points


@router.post("/location/get-route")
@router.post("/api/route")
async def get_route_coordinates(req: RouteRequest):
    """
    Resolves origin and destination geocoded coordinates.
    """
    start_location, end_location = parse_from_to(req.message)

    if not start_location or not end_location:
        return {
            "reply": "Please specify 'from [Start]' and 'to [Destination]'.",
            "start": {"error": "Missing start location"},
            "end": {"error": "Missing destination location"}
        }

    start_coords = get_coordinates(start_location)
    end_coords = get_coordinates(end_location)

    return {
        "reply": f"Route calculated from {start_location.title()} to {end_location.title()}.",
        "start": start_coords,
        "end": end_coords
    }
