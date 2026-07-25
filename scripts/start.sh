#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo ""
echo "========================================"
echo "  mcbot - A arrancar..."
echo "========================================"
echo ""

if [ ! -f .env ]; then
  echo "[mcbot] ERRO: .env nao encontrado!"
  echo "        Corre primeiro: bash scripts/setup.sh"
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "[mcbot] node_modules nao encontrado. A instalar..."
  if ! npm install; then
    echo "[mcbot] ERRO: Falhou ao instalar dependencias"
    exit 1
  fi
  echo "[mcbot] Dependencias instaladas"
fi

echo "[mcbot] A ligar ao servidor Minecraft..."
npm start
