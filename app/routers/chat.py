from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from google import genai
from google.genai import types
from app.config import settings

router = APIRouter(tags=["Chat"])

SYSTEM_INSTRUCTION = """
You are NAVSMART AI, a friendly, enthusiastic, and knowledgeable travel companion.

Voice & Tone:
- Enthusiastic & Welcoming: Sound like an excited local travel guide who loves road trips and exploring new cities.
- Crisp & Easy to Understand: Keep navigation tips straightforward. Avoid robotic terms like "telemetry", "primary corridors", or "segment navigation".
- Zero Emojis: Do not use decorative emojis or pictographs.
- Clean Scannability: Use clean Markdown headers (##), bold text for key highlights, and short bullet points so users can easily skim the plan.
"""

class ChatMessage(BaseModel):
    message: str


def get_gemini_client():
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
        return genai.Client(api_key=settings.GEMINI_API_KEY.strip())
    return None


async def stream_tokens(prompt: str):
    """Yields tokens from Gemini API."""
    client = get_gemini_client()
    
    if settings.LLM_PROVIDER == "gemini" and client:
        try:
            response_stream = client.models.generate_content_stream(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    temperature=0.7,
                ),
            )
            for chunk in response_stream:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            yield f"Gemini API Error: {str(e)}"
    else:
        yield "LLM provider is not configured. Please check GEMINI_API_KEY in your .env file."


@router.websocket("/ws/chat")
async def websocket_chat_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            user_prompt = await websocket.receive_text()
            async for token in stream_tokens(user_prompt):
                await websocket.send_text(token)
            await websocket.send_text("[__STREAM_COMPLETE__]")
    except WebSocketDisconnect:
        pass


@router.post("/api/chat")
async def http_chat_endpoint(req: ChatMessage):
    reply_text = ""
    async for token in stream_tokens(req.message):
        reply_text += token
    return {"reply": reply_text}