"""
Directions Service for NavSmart.
Interacts with Google Maps Directions API and decodes polylines.
"""

import requests
import polyline
import logging
from typing import List, Tuple, Dict, Any
from app.config import settings

logger = logging.getLogger("navsmart.directions")

def get_all_stop_points(start: str, stop: str, api_key: str = None) -> List[Tuple[float, float]]:
    """
    Fetch Google Directions route polyline decoded into lat/lng coordinate tuples.
    
    Args:
        start (str): Origin location name or coordinate string.
        stop (str): Destination location name or coordinate string.
        api_key (str, optional): Google Maps API key.
        
    Returns:
        List[Tuple[float, float]]: List of (latitude, longitude) pairs along the route.
    """
    key = api_key or settings.GOOGLE_MAPS_API_KEY
    url = "https://maps.googleapis.com/maps/api/directions/json"
    params = {
        "origin": start,
        "destination": stop,
        "mode": "driving",
        "key": key
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        data = response.json()

        if data.get("status") != "OK":
            logger.warning(f"Google Directions API returned status: {data.get('status')}")
            # If Google API key fails or quota exceeded, fall back to geocoding start & end straight line segment
            return fallback_route_points(start, stop)

        route = data["routes"][0]
        overview_polyline = route.get("overview_polyline", {}).get("points", "")
        if overview_polyline:
            return polyline.decode(overview_polyline)
        
        return []

    except Exception as e:
        logger.error(f"Error calling Directions API: {e}")
        return fallback_route_points(start, stop)


def fallback_route_points(start: str, stop: str) -> List[Tuple[float, float]]:
    """Fallback route coordinate generator using geocoded start and end points."""
    from app.services.geocoding_service import get_coordinates
    start_coords = get_coordinates(start)
    end_coords = get_coordinates(stop)

    if "latitude" in start_coords and "latitude" in end_coords:
        lat1, lng1 = start_coords["latitude"], start_coords["longitude"]
        lat2, lng2 = end_coords["latitude"], end_coords["longitude"]
        # Interpolate 10 points between start and end
        points = []
        steps = 10
        for i in range(steps + 1):
            t = i / steps
            lat = lat1 + (lat2 - lat1) * t
            lng = lng1 + (lng2 - lng1) * t
            points.append((lat, lng))
        return points
    return []
