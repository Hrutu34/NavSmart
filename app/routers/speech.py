"""
Speech Recognition API Router for NavSmart.
Handles voice input audio uploads and transcribes audio to text.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.speech_service import transcribe_audio_bytes

router = APIRouter(tags=["Speech"])

@router.post("/api/speech/transcribe")
async def transcribe_speech_file(file: UploadFile = File(...)):
    """
    Accepts uploaded audio file and transcribes speech into text.
    """
    try:
        audio_data = await file.read()
        transcription = transcribe_audio_bytes(audio_data)
        return {"text": transcription}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
