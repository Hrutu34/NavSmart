<div align="center">

# NAVSMART
### *AI-Powered Intelligent Multi-Stop Navigation & Itinerary Planning Engine*

[![Python](https://img.shields.io/badge/Python-3.10%2B-00f3ff?style=for-the-badge&logo=python&logoColor=black)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-2.0-00ff9d?style=for-the-badge&logo=fastapi&logoColor=black)](https://fastapi.tiangolo.com/)
[![Google Maps](https://img.shields.io/badge/Google%20Maps-API-a855f7?style=for-the-badge&logo=googlemaps&logoColor=white)](https://developers.google.com/maps)
[![Gemini](https://img.shields.io/badge/Gemini-3.6--Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Ollama](https://img.shields.io/badge/Ollama-LLaMA%203.2-ff0055?style=for-the-badge&logo=ollama&logoColor=white)](https://ollama.ai/)

<p align="center">
  <b>NavSmart</b> is an AI-driven navigation and travel planning platform. It combines real-time streaming LLM intelligence, multi-stop route optimization, live geolocation detection, categorized POI discovery, and an interactive day-by-day itinerary visualizer within a responsive glassmorphic cyber HUD. NavSmart supports both zero-setup cloud LLMs (Google Gemini API) and private offline open-source models (Local Ollama).
</p>

</div>

---

## Demo

<p align="center">
  <img src="app/assets/demo.gif" alt="Project Demo" width="900">
</p>

---

## Key Features

* **Cyber HUD Interface:** Dark glassmorphic design featuring canvas particle animations, real-time WebSocket connection telemetry, and neon status indicators.
* **Real-Time Token Streaming:** Low-latency conversational responses streamed token-by-token over WebSockets with live Markdown parsing.
* **Multi-Stop Route Planning:** Dynamic waypoint routing that parses queries like *"Route from Paris to Rome via Lyon and Florence"*, draws optimized polylines, and outputs leg-by-leg metrics.
* **Live Geolocation & Exploration:** One-click GPS location detection and natural language triggers (*"Where am I?"*) to center the map on your exact coordinates.
* **Categorized POI Discovery:** Explores and plots nearby Delicacies (restaurants/cafes), Sightseeing spots (attractions/museums), and Resting places (hotels/gas stations) with interactive info bubbles.
* **Interactive Itinerary Visualizer:** AI-generated day-by-day travel schedules with activity checklists and click-to-focus map actions.
* **Hands-Free Voice Input:** Web Speech API integration with animated recording state indicators.
* **Dual LLM Architecture (Gemini & Ollama):** Toggle between cloud inference with `gemini-3.6-flash` and local inference with `llama3.2:3b`.

---

## Architecture & Directory Structure

```text
NavSmart/
├── app/
│   ├── main.py                   # FastAPI Application setup, static mounts & CORS
│   ├── config.py                 # Centralized Configuration & Environment Settings
│   ├── nav_route.py              # Route wrapper compatibility endpoints
│   ├── routers/
│   │   ├── chat.py               # WebSocket & HTTP real-time streaming AI chat
│   │   ├── config.py             # Public frontend config endpoint (Maps API keys)
│   │   ├── itinerary.py          # Structured JSON itinerary generation endpoint
│   │   ├── route_navigation.py   # Directions & geocoded coordinate endpoints
│   │   └── speech.py             # Audio transcription endpoint
│   └── services/
│       ├── directions_service.py # Google Maps Directions & Polyline Decoder
│       ├── geocoding_service.py  # Nominatim & Geopy Geocoding Engine
│       ├── llm_service.py        # Gemini & Ollama Structured Output Engine
│       └── speech_service.py     # Speech Recognition & Audio Processor
├── static/
│   ├── js/
│   │   ├── mapService.js         # Geolocation, POI search & marker overlay manager
│   │   └── routeService.js       # Waypoint management & DirectionsRenderer handler
│   ├── script.js                 # UI controller, WebSocket client & Markdown renderer
│   └── styles.css                # Glassmorphic HUD stylesheet & animations
├── index.html                    # Single-page Cyber Command Center interface
├── run.py                        # Uvicorn server launcher
├── requirements.txt              # Python production dependencies
├── .env.example                  # Environment variables template
└── README.md                     # Project documentation

```

---

## Setting Up API Keys & Environment Variables

### 1. Google Maps API Key

1. Visit the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select an existing project.
3. Enable the following APIs under **APIs & Services > Library**:
* **Maps JavaScript API** (for interactive rendering)
* **Places API** (for POI delicacies, sightseeing, and lodging queries)
* **Directions API** (for polyline decoding and multi-stop calculation)
* **Geocoding API** (for address-to-coordinate translation)


4. Create an API key under **APIs & Services > Credentials** and paste it into `.env`.

### 2. LLM Provider Setup

#### Option A: Google Gemini API (Recommended / Cloud)

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/).
2. Set `LLM_PROVIDER=gemini` and `GEMINI_MODEL=gemini-3.6-flash`.

#### Option B: Local Ollama (Offline / Private)

1. Install [Ollama](https://ollama.ai/).
2. Pull the default lightweight model:
```bash
ollama pull llama3.2:3b

```


3. Ensure the Ollama daemon is running at `http://127.0.0.1:11434`.

---

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=True

# Google Maps API Key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# LLM Provider Configuration ('gemini' or 'ollama')
LLM_PROVIDER=gemini

# Google Gemini Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.6-flash

# Ollama Settings (Used when LLM_PROVIDER=ollama)
OLLAMA_HOST=[http://127.0.0.1:11434](http://127.0.0.1:11434)
OLLAMA_MODEL=llama3.2:3b

```

| Variable | Description | Default Value |
| --- | --- | --- |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key (Maps, Places, Directions, Geocoding) | *None* |
| `LLM_PROVIDER` | Active LLM backend (`gemini` or `ollama`) | `gemini` |
| `GEMINI_API_KEY` | Google Gemini API Key (Required if `LLM_PROVIDER=gemini`) | *None* |
| `GEMINI_MODEL` | Gemini Model identifier | `gemini-3.6-flash` |
| `OLLAMA_HOST` | Ollama local daemon URL | `http://127.0.0.1:11434` |
| `OLLAMA_MODEL` | Ollama model identifier | `llama3.2:3b` |
| `HOST` | Server host binding address | `0.0.0.0` |
| `PORT` | Server port number | `8000` |

---

## Quick Start Installation Guide

### Prerequisites

* Python 3.10+
* Git

### Installation Steps

1. **Clone the Repository:**
```bash
git clone [https://github.com/hariom90681/nav-smart-api.git](https://github.com/hariom90681/nav-smart-api.git)
cd nav-smart-api

```


2. **Create and Activate a Virtual Environment:**
* **Windows PowerShell:**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1

```


* **Linux / macOS:**
```bash
python3 -m venv .venv
source .venv/bin/activate

```




3. **Install Dependencies:**
```bash
pip install -r requirements.txt

```


4. **Start the Application:**
```bash
python run.py

```


5. **Access the HUD Terminal:**
Open your browser and navigate to:
`http://localhost:8000`

---

## API Endpoints Summary

| Method | Endpoint | Description |
| --- | --- | --- |
| `WS` | `/ws/chat` | WebSocket stream for real-time AI conversational output |
| `POST` | `/api/chat` | HTTP fallback endpoint for AI chat queries |
| `POST` | `/location/get-itinerary` | Generates schema-validated JSON day-by-day itinerary plans |
| `POST` | `/location/get-details-route` | Returns multi-point coordinates for route polyline plotting |
| `POST` | `/location/get-route` | Returns geocoded origin and destination coordinates |
| `POST` | `/api/speech/transcribe` | Transcribes uploaded voice audio samples |
| `GET` | `/api/config` | Exposes client-safe environment variables to the frontend |
| `GET` | `/api/health` | Service health status check |

---

## Credits & Team

Developed by **Team Nav-E-Gators** as part of the **I.Mobilothon** initiative.

| Developer Name |
| --- |
| Hrutu Surve |
| Hariom Jangra |
| Tanveer Sheikh |
