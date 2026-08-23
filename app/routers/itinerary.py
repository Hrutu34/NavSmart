from fastapi import APIRouter
from pydantic import BaseModel
import json
from google import genai
from google.genai import types
from app.config import settings

router = APIRouter(prefix="/location", tags=["Itinerary"])

gemini_client = None
if settings.GEMINI_API_KEY:
    gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)

class ItineraryRequest(BaseModel):
    message: str

@router.post("/get-itinerary")
async def get_itinerary_endpoint(req: ItineraryRequest):
    if settings.LLM_PROVIDER == "gemini" and gemini_client:
        prompt = f"""
        Generate a detailed travel itinerary based on this request: "{req.message}".
        Return a valid JSON object strictly matching this schema:
        {{
            "itinerary": [
                {{
                    "day": "Day 1",
                    "location": "Destination Name",
                    "activities": [
                        "Activity description 1",
                        "Activity description 2",
                        "Activity description 3"
                    ]
                }}
            ]
        }}
        """
        response = gemini_client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.3,
            )
        )
        try:
            return json.loads(response.text)
        except Exception:
            return {"itinerary": []}
            
    return {"itinerary": []}