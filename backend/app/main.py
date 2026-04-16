import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from app.routers import scripts, transcription, roleplay, assessment, history
from app.services.llm import get_backend_info
from app.services.stt import is_available as stt_available, get_backend_name as stt_backend_name
from app.services.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Solar Sales AI Trainer", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(scripts.router, prefix="/api")
app.include_router(transcription.router, prefix="/api")
app.include_router(roleplay.router, prefix="/api")
app.include_router(assessment.router, prefix="/api")
app.include_router(history.router, prefix="/api")


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "llm": get_backend_info(),
        "stt_available": stt_available(),
        "stt_backend": stt_backend_name(),
    }


# Serve frontend static build (if it exists)
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if FRONTEND_DIST.is_dir():
    # Serve static assets (js, css, images)
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    # Serve other static files from dist root (manifest, icons, etc)
    @app.get("/manifest.json")
    async def manifest():
        return FileResponse(FRONTEND_DIST / "manifest.json")

    # Catch-all: serve index.html for any non-API route (SPA routing)
    @app.get("/{path:path}")
    async def spa_fallback(path: str):
        # Try to serve the exact file first
        file_path = FRONTEND_DIST / path
        if file_path.is_file() and ".." not in path:
            return FileResponse(file_path)
        # Otherwise serve index.html (SPA client-side routing)
        return FileResponse(FRONTEND_DIST / "index.html")
