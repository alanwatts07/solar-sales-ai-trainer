#!/bin/bash
# Solar Sales AI Trainer — unified management script
#
# Usage:
#   ./start.sh          start (or restart) the app
#   ./start.sh stop     stop the app
#   ./start.sh restart  stop, rebuild frontend, start
#   ./start.sh status   show what's running
#   ./start.sh logs     tail the server log
#   ./start.sh build    just rebuild the frontend
#   ./start.sh tunnel   show tunnel URL
#
# Env vars:
#   PORT       backend port (default: 8002)
#   NO_BUILD=1 skip frontend rebuild

set -u

DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${PORT:-8002}"
LOG="/tmp/solar-trainer.log"
PIDFILE="/tmp/solar-trainer.pid"
TUNNEL_HOST="trainer.ftrai.uk"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

_header() {
    echo -e "${BLUE}=== Solar Sales AI Trainer ===${NC}"
}

_is_running() {
    if [ -f "$PIDFILE" ]; then
        local pid=$(cat "$PIDFILE")
        if kill -0 "$pid" 2>/dev/null; then
            return 0
        fi
    fi
    # Fallback: check port
    if curl -sf -o /dev/null -m 1 "http://localhost:$PORT/api/health" 2>/dev/null; then
        return 0
    fi
    return 1
}

_kill_port() {
    # Kill anything bound to $PORT. Try lsof, ss, or pgrep in order.
    local pids=""
    if command -v lsof >/dev/null 2>&1; then
        pids=$(lsof -ti ":$PORT" 2>/dev/null || true)
    fi
    if [ -z "$pids" ] && command -v ss >/dev/null 2>&1; then
        # Parse ss output: users:(("name",pid=1234,fd=5))
        pids=$(ss -tlnp 2>/dev/null | grep ":$PORT " | grep -oP 'pid=\K[0-9]+' | sort -u || true)
    fi
    if [ -z "$pids" ]; then
        # Last resort: pgrep for uvicorn on our port
        pids=$(pgrep -f "uvicorn.*app\.main.*$PORT" 2>/dev/null || true)
    fi

    if [ -n "$pids" ]; then
        echo "  killing process(es) on port $PORT: $pids"
        kill $pids 2>/dev/null || true
        sleep 1
        for p in $pids; do
            if kill -0 "$p" 2>/dev/null; then
                kill -9 "$p" 2>/dev/null || true
            fi
        done
    fi
    rm -f "$PIDFILE"
}

_check_deps() {
    if ! [ -d "$DIR/backend/venv" ]; then
        echo -e "${RED}ERROR: backend venv not found. Run:${NC}"
        echo "  cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
        exit 1
    fi
    if ! [ -d "$DIR/frontend/node_modules" ]; then
        echo -e "${YELLOW}Installing frontend deps...${NC}"
        (cd "$DIR/frontend" && npm install)
    fi
}

_build_frontend() {
    echo -e "${YELLOW}Building frontend...${NC}"
    (cd "$DIR/frontend" && npx vite build) || {
        echo -e "${RED}Frontend build failed${NC}"
        exit 1
    }
}

_start() {
    _header
    _check_deps

    if _is_running; then
        echo -e "${YELLOW}Already running on port $PORT. Use 'restart' to reload.${NC}"
        _status
        return 0
    fi

    # Kill anything holding the port (zombie processes)
    _kill_port

    # Build frontend unless skipped
    if [ "${NO_BUILD:-}" != "1" ]; then
        if [ ! -d "$DIR/frontend/dist" ] || [ -n "$(find "$DIR/frontend/src" -newer "$DIR/frontend/dist/index.html" 2>/dev/null | head -1)" ]; then
            _build_frontend
        else
            echo -e "${GREEN}Frontend up to date${NC}"
        fi
    fi

    # Start backend
    echo -e "${YELLOW}Starting backend on port $PORT...${NC}"
    cd "$DIR/backend"

    # Use nohup so it survives shell exit, log to file
    nohup bash -c "source venv/bin/activate && exec uvicorn app.main:app --host 0.0.0.0 --port $PORT" > "$LOG" 2>&1 &
    echo $! > "$PIDFILE"

    # Wait for health check (up to 15s)
    local tries=0
    while [ $tries -lt 15 ]; do
        if curl -sf -o /dev/null -m 1 "http://localhost:$PORT/api/health" 2>/dev/null; then
            echo -e "${GREEN}✓ Backend up (pid $(cat $PIDFILE))${NC}"
            _status
            return 0
        fi
        sleep 1
        tries=$((tries + 1))
    done

    echo -e "${RED}✗ Backend failed to start. Last 20 lines of log:${NC}"
    tail -n 20 "$LOG"
    return 1
}

_stop() {
    _header
    echo "Stopping..."
    if [ -f "$PIDFILE" ]; then
        local pid=$(cat "$PIDFILE")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            sleep 1
            kill -9 "$pid" 2>/dev/null || true
        fi
        rm -f "$PIDFILE"
    fi
    _kill_port
    echo -e "${GREEN}✓ Stopped${NC}"
}

_status() {
    echo ""
    if _is_running; then
        echo -e "${GREEN}● Running${NC}"
        echo "  Local:   http://localhost:$PORT"
        echo "  Tunnel:  https://$TUNNEL_HOST"
        local health=$(curl -sf -m 2 "http://localhost:$PORT/api/health" 2>/dev/null)
        if [ -n "$health" ]; then
            local llm=$(echo "$health" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['llm']['backend'])" 2>/dev/null)
            local stt=$(echo "$health" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('stt_backend','?'))" 2>/dev/null)
            echo "  LLM:     $llm"
            echo "  STT:     $stt"
        fi
        # Cloudflared status
        if pgrep -f "cloudflared tunnel run" > /dev/null; then
            echo -e "  Tunnel:  ${GREEN}● running${NC}"
        else
            echo -e "  Tunnel:  ${YELLOW}○ not running${NC}"
        fi
    else
        echo -e "${RED}● Not running${NC}"
    fi
    echo ""
}

_logs() {
    if [ -f "$LOG" ]; then
        tail -f -n 50 "$LOG"
    else
        echo "No log file at $LOG"
    fi
}

_tunnel() {
    if pgrep -f "cloudflared tunnel run" > /dev/null; then
        echo -e "${GREEN}Tunnel running:${NC} https://$TUNNEL_HOST"
    else
        echo -e "${YELLOW}Tunnel not running. Start with:${NC}"
        echo "  cloudflared tunnel run --protocol http2 &"
    fi
}

# ---- Dispatch ----

case "${1:-start}" in
    start) _start ;;
    stop) _stop ;;
    restart) _stop; sleep 1; _start ;;
    status) _header; _status ;;
    logs) _logs ;;
    build) _header; _build_frontend ;;
    tunnel) _tunnel ;;
    *) echo "Usage: $0 {start|stop|restart|status|logs|build|tunnel}"; exit 1 ;;
esac
