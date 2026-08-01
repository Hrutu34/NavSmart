<div align="center">

# ⚡ NAVSMART ⚡
### *Next-Gen AI Itinerary Planning & Tactical Navigation System*

[![Python](https://img.shields.io/badge/Python-3.10%2B-00f3ff?style=for-the-badge&logo=python&logoColor=black)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-2.0-00ff9d?style=for-the-badge&logo=fastapi&logoColor=black)](https://fastapi.tiangolo.com/)
[![Google Maps](https://img.shields.io/badge/Google%20Maps-API-a855f7?style=for-the-badge&logo=googlemaps&logoColor=white)](https://developers.google.com/maps)
[![Ollama](https://img.shields.io/badge/Ollama-LLaMA%203.2-ff0055?style=for-the-badge&logo=ollama&logoColor=white)](https://ollama.ai/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-00f3ff?style=for-the-badge&logo=openai&logoColor=black)](https://openai.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<p align="center">
  <b>NavSmart</b> is a futuristic, full-stack AI navigation command center. It combines real-time streaming LLM intelligence, interactive map polyline plotting, dynamic multi-day itinerary generation, and voice speech-to-text input inside a glassmorphic cyber interface.
</p>

</div>

---

## 🌟 Key Features

-**Futuristic Cyber HUD Interface:** Built with dark cybernetic glassmorphism, animated particle backgrounds, real-time status indicators, and glowing neon accents.
-**Real-Time Dynamic Token Streaming:** Real-time typewriter response generation powered by WebSockets, formatted dynamically with Markdown rendering and glowing location highlights.
-**Tactical Google Maps Integration:** Renders live driving routes, decodes polylines, plots start/end markers, and calculates real-time distance & duration metrics.
-**Dynamic Itinerary Visualizer:** Transforms travel queries into structured, interactive day-by-day itinerary cards with activity checklists.
-**Voice Speech-to-Text Input:** Built-in speech recognition with animated waveform indicators for hands-free navigation commands.
-**Dual LLM Engine (Ollama & OpenAI):** Switch seamlessly between local open-source models (Ollama `llama3.2:3b`) and cloud models (`gpt-4o-mini`). Includes intelligent fallback streaming.

---

## 🏗️ Architecture & Directory Structure

```text
NavSmart/
├── app/
│   ├── main.py                   # FastAPI Application setup & Middleware
│   ├── config.py                 # Centralized Configuration & Environment Settings
│   ├── nav_route.py              # Backward Compatibility Router Wrapper
│   ├── routers/
│   │   ├── chat.py               # WebSocket & HTTP Real-time Streaming Chat API
│   │   ├── config.py             # Public Frontend Environment Config Endpoint
│   │   ├── itinerary.py          # Structured JSON Itinerary Planner API
│   │   ├── route_navigation.py   # Route Calculation & Polyline Waypoint API
│   │   └── speech.py             # Voice Audio Transcription API
│   └── services/
│       ├── directions_service.py # Google Maps Directions & Polyline Decoder
│       ├── geocoding_service.py  # Nominatim & Geopy Geocoding Engine
│       ├── llm_service.py        # Ollama, OpenAI & Fallback Token Streamer
│       └── speech_service.py     # HuggingFace Whisper Speech Recognition
├── static/
│   ├── script.js                 # Cyber UI Logic, Maps Controller & Streaming Engine
│   └── styles.css                # Futuristic Glassmorphic HUD Stylesheet
├── index.html                    # Main Cyber Command Center HTML Template
├── run.py                        # Server Application Launcher
├── requirements.txt              # Production Python Dependencies
├── .env.example                  # Environment Variables Template
└── README.md                     # System Documentation
```

---

## 🔑 Setting Up API Keys & Environment Variables

NavSmart requires configuration for the **Google Maps API** and an **LLM Provider** (Ollama or OpenAI).

### 1️⃣ Setting Up Google Maps API Key
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Enable the following APIs under **APIs & Services > Library**:
   - **Maps JavaScript API** (for rendering the interactive map)
   - **Directions API** (for calculating routes and decoding polylines)
4. Go to **APIs & Services > Credentials** and click **Create Credentials > API Key**.
5. Copy your generated API key.

---

### 2️⃣ Setting Up the LLM API

NavSmart supports two LLM options out of the box:

#### Option A: Local Ollama (Recommended / Free & Private)
1. Download and install [Ollama](https://ollama.ai/).
2. Pull the default LLaMA 3.2 lightweight model:
   ```bash
   ollama pull llama3.2:3b
   ```
3. Ensure Ollama is running locally at `http://127.0.0.1:11434`.

#### Option B: OpenAI API (Cloud)
1. Obtain an API Key from the [OpenAI Platform](https://platform.openai.com/api-keys).
2. Set `LLM_PROVIDER=openai` and specify your `OPENAI_API_KEY` in `.env`.

---

### 3️⃣ Environment Variable Reference (`.env`)

Copy `.env.example` to create your local `.env` file:
```bash
cp .env.example .env
```

| Variable | Description | Default Value |
| :--- | :--- | :--- |
| `GOOGLE_MAPS_API_KEY` | Google Maps JS & Directions API key | *Default Provided* |
| `LLM_PROVIDER` | LLM backend (`ollama` or `openai`) | `ollama` |
| `OLLAMA_HOST` | Ollama local instance URL | `http://127.0.0.1:11434` |
| `OLLAMA_MODEL` | Ollama model name | `llama3.2:3b` |
| `OPENAI_API_KEY` | OpenAI API Key (Required if `LLM_PROVIDER=openai`) | *Optional* |
| `OPENAI_MODEL` | OpenAI Model name | `gpt-4o-mini` |
| `HOST` | Host address for server binding | `0.0.0.0` |
| `PORT` | Server port number | `8000` |

---

## 🚀 Quick Start Installation Guide

### Prerequisites
- Python 3.10 or higher
- Git

### Installation Steps

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/hariom90681/nav-smart-api.git
   cd nav-smart-api
   ```

2. **Create and Activate a Virtual Environment:**
   ```bash
   # Windows PowerShell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Launch the Application:**
   ```bash
   python run.py
   ```

5. **Access the HUD Terminal:**
   Open your browser and navigate to:
   `http://localhost:8000`

---

## 📡 API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `WS` | `/ws/chat` | WebSocket for real-time streaming AI chat responses |
| `POST` | `/api/chat` | HTTP fallback endpoint for AI chat |
| `POST` | `/location/get-details-route` | Returns route polyline coordinates for map rendering |
| `POST` | `/location/get-route` | Returns origin and destination geocoded coordinates |
| `POST` | `/location/get-itinerary` | Returns structured JSON travel itinerary |
| `POST` | `/api/speech/transcribe` | Transcribes uploaded voice audio files |
| `GET` | `/api/config` | Exposes public frontend environment configurations |
| `GET` | `/api/health` | System health check endpoint |

---

## 👥 Credits & Team

Developed with ❤️ by **Team Nav-E-Gators**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

