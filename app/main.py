from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from app.routers.config import router as config_router
from app.routers.chat import router as chat_router
from app.routers.route_navigation import router as route_router
from app.routers.itinerary import router as itinerary_router
from app.routers.speech import router as speech_router

app = FastAPI(
    title="NavSmart - AI Itinerary & Navigation System",
    description="Futuristic AI-powered Navigation and Itinerary Planner",
    version="2.0.0"
)

# Enable CORS for cross-origin frontend support
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base project directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Serve static files
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")

# Include Routers
app.include_router(config_router)
app.include_router(chat_router)
app.include_router(route_router)
app.include_router(itinerary_router)
app.include_router(speech_router)

# Healthcheck endpoint
@app.get("/api/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "app": "NavSmart", "version": "2.0.0"}

# Serve index.html at root
@app.get("/")
async def serve_index():
    return FileResponse(BASE_DIR / "index.html")

