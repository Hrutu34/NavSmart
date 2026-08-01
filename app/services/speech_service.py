"""
Speech Service for NavSmart.
Handles audio transcription using Hugging Face Whisper pipeline.
"""

import io
import logging

logger = logging.getLogger("navsmart.speech")

_asr_pipeline = None

def get_asr_pipeline():
    """Lazy load Whisper ASR model when requested to save startup time & memory."""
    global _asr_pipeline
    if _asr_pipeline is None:
        try:
            from transformers import pipeline
            logger.info("Initializing HuggingFace Whisper ASR model...")
            _asr_pipeline = pipeline(
                "automatic-speech-recognition",
                model="openai/whisper-base",
                generate_kwargs={"task": "translate"}
            )
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
            _asr_pipeline = False
    return _asr_pipeline


def transcribe_audio_bytes(audio_bytes: bytes) -> str:
    """
    Transcribe raw audio bytes into English text string.
    """
    pipeline_obj = get_asr_pipeline()
    if not pipeline_obj:
        return "Speech recognition model unavailable on server."

    try:
        audio_file = io.BytesIO(audio_bytes)
        result = pipeline_obj(audio_file)
        return result.get("text", "")
    except Exception as e:
        logger.error(f"Speech transcription error: {e}")
        return f"Transcription error: {str(e)}"
