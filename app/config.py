"""
Configuration module for NavSmart Application.
Handles environment variables for Google Maps API, LLM Providers, and Server configuration.
"""

import os
from pathlib import Path

# Base directory of the repository
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables if .env exists
env_file = BASE_DIR / ".env"
if env_file.exists():
    try:
        from dotenv import load_dotenv
        load_dotenv(dotenv_path=env_file)
    except ImportError:
        pass

class Settings:
    """Application Settings class with environment variable fallbacks."""
    
    # Server configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")

    # Google Maps API Key
    # Defaults to the provided key, but can be overridden via environment variable
    GOOGLE_MAPS_API_KEY: str = os.getenv(
        "GOOGLE_MAPS_API_KEY", 
        "AIzaSyDDgJKSce1dwXMTZ886PDMqjaJrF9z1ErA"
    )

    # LLM Settings
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "ollama").lower()  # 'ollama' or 'openai'
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
    
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

settings = Settings()
