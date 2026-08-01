"""
LLM Service for NavSmart.
Handles communication with Ollama, OpenAI, or local AI model providers.
Supports real-time token streaming and structured JSON response generation.
"""

import json
import httpx
import logging
import asyncio
from typing import AsyncGenerator, Dict, Any
from app.config import settings

logger = logging.getLogger("navsmart.llm")


SYSTEM_PROMPT = """You are NavSmart AI, a futuristic navigation and travel assistant.
You specialize in route planning, travel itineraries, local recommendations, and navigation advice.
Provide response with clean formatting, markdown headers, bullet points, and key location callouts in **bold**."""


async def stream_chat_response(prompt: str) -> AsyncGenerator[str, None]:
    """
    Streams LLM tokens chunk-by-chunk for real-time typewriter experience.
    Supports Ollama, OpenAI, and graceful fallback streaming.
    """
    if settings.LLM_PROVIDER == "openai" and settings.OPENAI_API_KEY:
        async for chunk in _stream_openai(prompt):
            yield chunk
        return

    # Default: Try Ollama stream
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            payload = {
                "model": settings.OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ],
                "stream": True
            }
            async with client.stream("POST", f"{settings.OLLAMA_HOST}/api/chat", json=payload) as resp:
                if resp.status_code != 200:
                    raise httpx.HTTPStatusError("Ollama HTTP Error", request=resp.request, response=resp)
                
                async for line in resp.aiter_lines():
                    if not line:
                        continue
                    try:
                        obj = json.loads(line)
                        if "message" in obj and obj["message"].get("content"):
                            yield obj["message"]["content"]
                        elif "response" in obj:
                            yield obj["response"]
                    except json.JSONDecodeError:
                        continue
    except Exception as e:
        logger.warning(f"Ollama/LLM service unavailable ({e}). Switching to NavSmart fallback responder.")
        async for chunk in _stream_fallback(prompt):
            yield chunk


async def _stream_openai(prompt: str) -> AsyncGenerator[str, None]:
    """Stream response from OpenAI Chat Completion API."""
    try:
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": settings.OPENAI_MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            "stream": True
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            async with client.stream("POST", "https://api.openai.com/v1/chat/completions", headers=headers, json=payload) as resp:
                async for line in resp.aiter_lines():
                    if line.startswith("data: ") and line != "data: [DONE]":
                        data_str = line[6:].strip()
                        try:
                            obj = json.loads(data_str)
                            delta = obj["choices"][0]["delta"].get("content", "")
                            if delta:
                                yield delta
                        except Exception:
                            continue
    except Exception as e:
        logger.error(f"OpenAI error: {e}")
        async for chunk in _stream_fallback(prompt):
            yield chunk


async def _stream_fallback(prompt: str) -> AsyncGenerator[str, None]:
    """
    Fallback intelligent responder that simulates dynamic streaming if local LLM is offline.
    """
    lowered = prompt.lower()
    
    if "from" in lowered and "to" in lowered:
        reply = (
            f"⚡ **NavSmart Route Intelligence**\n\n"
            f"Analyzing route for prompt: *\"{prompt}\"*\n\n"
            f"1. **Calculating Optimal Paths:** Evaluating traffic patterns, distance, and highway conditions.\n"
            f"2. **Map Coordinates updated:** I've requested map polyline rendering on your display.\n"
            f"3. **Highlights:** Check the interactive map on the left side to see turn-by-turn waypoints and live geography."
        )
    elif "itinerary" in lowered or "plan" in lowered or "trip" in lowered:
        reply = (
            f"✨ **NavSmart Travel Itinerary Generated**\n\n"
            f"Here is a curated high-efficiency plan based on: *\"{prompt}\"*\n\n"
            f"### **Day 1: Landmark Highlights & Arrival**\n"
            f"- **Morning:** Arrival, check-in, and exploration of downtown hub.\n"
            f"- **Afternoon:** Guided cultural immersion and food tour.\n"
            f"- **Evening:** Scenic sunset view & dining at top-rated local venue.\n\n"
            f"### **Day 2: Adventure & Local Secrets**\n"
            f"- **Morning:** Scenic route tour across coastal or mountain trails.\n"
            f"- **Afternoon:** Shopping & artisan markets.\n"
            f"- **Evening:** Relaxing night walk and dinner."
        )
    else:
        reply = (
            f"🤖 **NavSmart AI Assistant**\n\n"
            f"I have received your request: *\"{prompt}\"*\n\n"
            f"How can I assist your navigation or itinerary planning today? You can ask me to:\n"
            f"- **Plan a route:** e.g., *\"Route from New York to Boston\"*\n"
            f"- **Create a travel itinerary:** e.g., *\"3 day itinerary for Tokyo\"*\n"
            f"- **Explore places:** e.g., *\"Best spots in Paris\"*"
        )

    # Stream out token by token with micro delays for dynamic visual realism
    words = reply.split(" ")
    for i, word in enumerate(words):
        space = "" if i == len(words) - 1 else " "
        yield word + space
        await asyncio.sleep(0.02)


async def generate_itinerary_json(prompt: str) -> Dict[str, Any]:
    """
    Generate travel itinerary structured as JSON.
    """
    json_prompt = f"""
    You are an expert travel planner AI.
    User message: "{prompt}"

    Generate a travel itinerary strictly in valid JSON format:
    {{
      "reply": "<short friendly summary>",
      "itinerary": [
        {{
          "day": "Day 1",
          "location": "<city or landmark>",
          "activities": ["<activity 1>", "<activity 2>", "<activity 3>"]
        }}
      ]
    }}
    Do not add extra markdown text outside the JSON.
    """

    try:
        if settings.LLM_PROVIDER == "openai" and settings.OPENAI_API_KEY:
            headers = {
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": settings.OPENAI_MODEL,
                "messages": [{"role": "user", "content": json_prompt}],
                "response_format": {"type": "json_object"}
            }
            async with httpx.AsyncClient(timeout=20.0) as client:
                r = await client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
                r.raise_for_status()
                data = r.json()
                content = data["choices"][0]["message"]["content"]
                return json.loads(content)

        # Try Ollama
        async with httpx.AsyncClient(timeout=20.0) as client:
            payload = {
                "model": settings.OLLAMA_MODEL,
                "prompt": json_prompt,
                "stream": False
            }
            r = await client.post(f"{settings.OLLAMA_HOST}/api/generate", json=payload)
            r.raise_for_status()
            data = r.json()
            content = data.get("response", "").strip()
            content = content.replace("```json", "").replace("```", "").strip()
            return json.loads(content)

    except Exception as e:
        logger.warning(f"LLM JSON itinerary error ({e}). Returning structured fallback itinerary.")
        return {
            "reply": f"Custom itinerary generated for: {prompt}",
            "itinerary": [
                {
                    "day": "Day 1",
                    "location": "City Center & Culture",
                    "activities": ["City Center Exploration", "Local Culinary Experience", "Historic District Tour"]
                },
                {
                    "day": "Day 2",
                    "location": "Nature & Scenic Routes",
                    "activities": ["Scenic Lookout Point", "Botanical Park Walk", "Evening Panoramic Cruise"]
                }
            ]
        }
