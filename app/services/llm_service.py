import json
import os
from pydantic import BaseModel
from google import genai
from google.genai import types

PROVIDER = os.getenv("LLM_PROVIDER", "gemini").lower()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

# Initialize Gemini Client
gemini_client = None
if GEMINI_API_KEY:
    gemini_client = genai.Client(api_key=GEMINI_API_KEY)


# Define Pydantic Schema for 100% strict JSON Output
class DayItinerary(BaseModel):
    day: str
    location: str
    activities: list[str]


class ItineraryResponse(BaseModel):
    itinerary: list[DayItinerary]


def generate_structured_itinerary(prompt: str) -> dict:
    """
    Generates structured day-by-day itinerary JSON using Google Gemini API.
    Guarantees schema compliance via response_schema.
    """
    if PROVIDER == "gemini" and gemini_client:
        structured_prompt = f"""
        Generate a comprehensive, detailed day-by-day travel itinerary based on this request: "{prompt}".
        Include rich activity descriptions, local specialty stops, and transit details.
        """
        try:
            response = gemini_client.models.generate_content(
                model=GEMINI_MODEL,
                contents=structured_prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ItineraryResponse,
                    temperature=0.3,
                ),
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"Gemini Itinerary Generation Error: {e}")
            return {"itinerary": []}

    # Clean fallback when Gemini is not configured
    return {"itinerary": []}