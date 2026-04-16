from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import scripts, transcription, roleplay
from app.services.llm import get_backend_info
from app.services.stt import is_available as stt_available, get_backend_name as stt_backend_name

app = FastAPI(title="Solar Sales AI Trainer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5180", "http://localhost:5176"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scripts.router, prefix="/api")
app.include_router(transcription.router, prefix="/api")
app.include_router(roleplay.router, prefix="/api")


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "llm": get_backend_info(),
        "stt_available": stt_available(),
        "stt_backend": stt_backend_name(),
    }
