"""
Chat API & WebSocket Streaming Router for NavSmart.
Provides dynamic real-time AI response generation.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from app.services.llm_service import stream_chat_response

router = APIRouter(tags=["Chat"])

class ChatRequest(BaseModel):
    message: str

@router.websocket("/ws/chat")
@router.websocket("/ws/ollama")  # Maintained for backward compatibility
async def websocket_chat(websocket: WebSocket):
    """
    WebSocket endpoint streaming LLM tokens in real-time.
    """
    await websocket.accept()
    try:
        while True:
            user_message = await websocket.receive_text()
            if not user_message.strip():
                continue

            async for token in stream_chat_response(user_message):
                await websocket.send_text(token)
            
            # Send completion signal frame
            await websocket.send_text("[__STREAM_COMPLETE__]")

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_text(f"\n[Error: {str(e)}]")
            await websocket.send_text("[__STREAM_COMPLETE__]")
        except Exception:
            pass


@router.post("/api/chat")
@router.post("/chat/ollama")  # Maintained for backward compatibility
async def http_chat(req: ChatRequest):
    """
    HTTP POST fallback for non-websocket clients.
    """
    full_response = []
    async for chunk in stream_chat_response(req.message):
        full_response.append(chunk)
    return {"reply": "".join(full_response)}
