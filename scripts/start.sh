#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo ""
echo "========================================"
echo "  mcbot - Starting..."
echo "========================================"
echo ""

if [ ! -f .env ]; then
  echo "[mcbot] ERROR: .env not found!"
  echo "        Run setup first: bash scripts/setup.sh"
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "[mcbot] node_modules not found. Installing..."
  if ! npm install; then
    echo "[mcbot] ERROR: Failed to install dependencies"
    exit 1
  fi
  echo "[mcbot] Dependencies installed"
fi

echo "[mcbot] Starting local services..."
if command -v ollama >/dev/null 2>&1; then
  if ! curl -fsS http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo "[mcbot] Starting Ollama server..."
    ollama serve >/dev/null 2>&1 &
    sleep 3
  else
    echo "[mcbot] Ollama already running"
  fi
else
  echo "[mcbot] Ollama not found. Install it from https://ollama.com/ and run the bot again."
fi

if [ -f "paper-1.20.1-196.jar" ]; then
  if [ ! -f eula.txt ]; then
    echo "eula=true" > eula.txt
  fi
  if [ ! -f server.properties ]; then
    cat > server.properties <<'EOF'
allow-flight=true
online-mode=false
server-port=25565
motd=mcbot server
max-players=20
EOF
  fi

  if ! ss -lnt 2>/dev/null | grep -q ':25565 '; then
    echo "[mcbot] Starting Paper server..."
    java -jar paper-1.20.1-196.jar --nogui >/tmp/mcbot-paper.log 2>&1 &
    sleep 5
  else
    echo "[mcbot] Paper server already running"
  fi
fi

echo "[mcbot] Connecting to Minecraft server..."
npm start
