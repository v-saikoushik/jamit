"""Jamit AI Service — audio separation, mood detection, recommendations, remix."""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import audio_editor, separate, mood, recommend, remix

load_dotenv()

app = FastAPI(
    title="Jamit AI Service",
    description="ML microservice for audio processing and NLP recommendations",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(os.getenv("UPLOAD_DIR", "./uploads"), exist_ok=True)
os.makedirs(os.getenv("OUTPUT_DIR", "./outputs"), exist_ok=True)

app.include_router(separate.router, prefix="/api", tags=["separation"])
app.include_router(mood.router, prefix="/api/mood", tags=["mood"])
app.include_router(recommend.router, prefix="/api", tags=["recommendations"])
app.include_router(remix.router, prefix="/api/remix", tags=["remix"])
app.include_router(audio_editor.router, prefix="/api/audio-editor", tags=["audio-editor"])


@app.get("/health")
def health():
    return {
        "status": "ok",
        "mock_mode": os.getenv("AI_MOCK_MODE", "true").lower() == "true",
    }
