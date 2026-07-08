#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  echo "[start] ERRO: .env nao encontrado. Corre primeiro: bash scripts/setup.sh"
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "[start] node_modules nao encontrado. A instalar..."
  npm install
fi

echo "[start] A ligar ao servidor Minecraft..."
npm start
