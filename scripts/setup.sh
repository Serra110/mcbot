#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "[setup] mcbot - instalacao Linux/macOS"

if ! command -v node &>/dev/null; then
  echo "[setup] ERRO: Node.js nao encontrado. Instala em https://nodejs.org/"
  exit 1
fi

NODE_MAJOR=$(node -e "console.log(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "[setup] ERRO: Node.js 18+ necessario"
  exit 1
fi
echo "[setup] Node.js $(node --version) OK"

mkdir -p data

if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "[setup] .env criado a partir de .env.example"
  fi
else
  echo "[setup] .env ja existe"
fi

echo "[setup] A instalar dependencias npm..."
npm install

echo ""
echo "=== Setup concluido ==="
echo "  1. Edita .env com os dados do servidor Minecraft"
echo "  2. Instala Ollama: https://ollama.com/ e corre: ollama pull llama3.1:8b"
echo "  3. Arranca o bot: npm start"
echo ""
