#!/bin/bash
# Start the Solar Sales AI Trainer
# Serves both API and frontend on a single port

set -e

PORT="${PORT:-8002}"
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Solar Sales AI Trainer ==="
echo ""

# Build frontend if dist doesn't exist
if [ ! -d "$DIR/frontend/dist" ]; then
    echo "[1/2] Building frontend..."
    cd "$DIR/frontend" && npm run build
    echo ""
fi

# Start backend (serves API + frontend)
echo "[2/2] Starting server on port $PORT..."
echo ""
echo "  Local:   http://localhost:$PORT"
echo "  Tunnel:  cloudflared tunnel --url http://localhost:$PORT"
echo ""
cd "$DIR/backend"
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --reload
