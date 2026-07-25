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

echo "[mcbot] Connecting to Minecraft server..."
npm start
