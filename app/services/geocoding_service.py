"""
Geocoding Service for NavSmart.
Handles location name to latitude/longitude resolution.
"""

import ssl
import logging
from typing import Dict, Any, Optional
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderUnavailable, GeocoderTimedOut

logger = logging.getLogger("navsmart.geocoding")

# Set up SSL Context for Geopy Nominatim
try:
    import certifi
    ctx = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE


geolocator = Nominatim(user_agent="navsmart_app_v2", ssl_context=ctx)


def get_coordinates(place_name: str) -> Dict[str, Any]:
    """
    Get latitude and longitude for a given place name.
    
    Args:
        place_name (str): Name of the location/city/landmark.
        
    Returns:
        dict: Location metadata including name, latitude, and longitude.
    """
    if not place_name or not place_name.strip():
        return {"name": place_name, "error": "Empty location query"}

    clean_name = place_name.strip()
    try:
        location = geolocator.geocode(clean_name, timeout=10)
        if location:
            return {
                "name": clean_name,
                "latitude": location.latitude,
                "longitude": location.longitude,
                "address": location.address
            }
        else:
            return {"name": clean_name, "error": f"Location '{clean_name}' not found"}
    except (GeocoderUnavailable, GeocoderTimedOut) as e:
        logger.error(f"Geocoding service unavailable: {e}")
        return {"name": clean_name, "error": "Geocoding service unavailable"}
    except Exception as e:
        logger.error(f"Geocoding error for '{clean_name}': {e}")
        return {"name": clean_name, "error": str(e)}
