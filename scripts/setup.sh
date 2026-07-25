#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo ""
echo "========================================"
echo "  mcbot - Setup"
echo "========================================"
echo ""

if ! command -v node &>/dev/null; then
  echo "[mcbot] ERROR: Node.js not found!"
  echo "        Download from https://nodejs.org/"
  exit 1
fi

NODE_MAJOR=$(node -e "console.log(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "[mcbot] ERROR: Node.js 18+ required (you have v$(node --version))"
  exit 1
fi
echo "[mcbot] Node.js $(node --version) detected"

mkdir -p data

if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "[mcbot] .env created from .env.example"
    echo "        >>> Open .env and fill in your server details <<<"
  fi
else
  echo "[mcbot] .env already exists — nothing changed"
fi

echo ""
echo "[mcbot] Installing dependencies..."
if ! npm install; then
  echo "[mcbot] ERROR: Failed to install dependencies"
  echo "        Try manually: npm install"
  exit 1
fi
echo "[mcbot] Dependencies installed successfully"

echo ""
echo "========================================"
echo "  Setup completed successfully!"
echo "========================================"
echo ""
echo "Next steps:"
echo ""
echo "  1. Open the .env file and configure your Minecraft server host/port"
echo "  2. Install and start Ollama:"
echo "     - Download: https://ollama.com/"
echo "     - Run: ollama pull llama3.1:8b"
echo "  3. Start the bot: bash scripts/start.sh"
echo ""
