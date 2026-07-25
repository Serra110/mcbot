#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo ""
echo "========================================"
echo "  mcbot - Instalacao"
echo "========================================"
echo ""

if ! command -v node &>/dev/null; then
  echo "[mcbot] ERRO: Node.js nao encontrado!"
  echo "        Descarrega em https://nodejs.org/"
  exit 1
fi

NODE_MAJOR=$(node -e "console.log(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "[mcbot] ERRO: Node.js 18+ necessario (tens v$(node --version))"
  exit 1
fi
echo "[mcbot] Node.js $(node --version) detectado"

mkdir -p data

if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "[mcbot] .env criado a partir de .env.example"
    echo "        >>> Abre o .env e preenche os dados do teu servidor <<<"
  fi
else
  echo "[mcbot] .env ja existe — nada alterado"
fi

echo ""
echo "[mcbot] A instalar dependencias..."
if ! npm install; then
  echo "[mcbot] ERRO: Falhou ao instalar dependencias"
  echo "        Tenta manualmente: npm install"
  exit 1
fi
echo "[mcbot] Dependencias instaladas com sucesso"

echo ""
echo "========================================"
echo "  Setup concluido com sucesso!"
echo "========================================"
echo ""
echo "Proximos passos:"
echo ""
echo "  1. Abre o ficheiro .env e configura o host/porta do teu servidor Minecraft"
echo "  2. Instala e arranca o Ollama:"
echo "     - Descarrega: https://ollama.com/"
echo "     - Corre: ollama pull llama3.1:8b"
echo "  3. Arranca o bot: bash scripts/start.sh"
echo ""
