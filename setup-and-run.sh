#!/usr/bin/env bash

set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "========================================"
echo "  mcbot - Setup and Run"
echo "========================================"
echo ""

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo -e "${BOLD}[1/6] Checking Node.js...${NC}"
if ! command -v node &>/dev/null; then
  echo -e "${RED}[ERROR] Node.js is not installed!${NC}"
  echo ""
  echo "Download and install Node.js 18+ from:"
  echo "  https://nodejs.org/"
  echo ""
  echo "After installing, run this script again."
  exit 1
fi

NODE_MAJOR=$(node -e "console.log(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo -e "${RED}[ERROR] Node.js 18+ required (you have v$(node --version))${NC}"
  exit 1
fi
echo -e "${GREEN}[OK] Node.js $(node --version) detected${NC}"

echo ""
echo -e "${BOLD}[2/6] Installing npm packages...${NC}"
if ! npm install; then
  echo -e "${RED}[ERROR] Failed to install npm packages${NC}"
  exit 1
fi
echo -e "${GREEN}[OK] npm packages installed${NC}"

echo ""
echo -e "${BOLD}[3/6] Checking configuration...${NC}"
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo -e "${GREEN}[OK] Created .env from .env.example${NC}"
    echo ""
    echo -e "${YELLOW}>>> OPEN .env AND CONFIGURE YOUR SERVER DETAILS <<<${NC}"
    echo ""
    if command -v nano &>/dev/null; then
      read -p "Press Enter to open .env in nano (or Ctrl+C to edit later)... " || true
      nano .env
    elif command -v vim &>/dev/null; then
      read -p "Press Enter to open .env in vim (or Ctrl+C to edit later)... " || true
      vim .env
    else
      echo "Edit the .env file before running the bot."
    fi
  fi
else
  echo -e "${GREEN}[OK] .env already exists${NC}"
fi

echo ""
echo -e "${BOLD}[4/6] Checking Ollama...${NC}"
if ! command -v ollama &>/dev/null; then
  echo "Ollama is not installed. Installing now..."
  echo ""
  if ! curl -fsSL https://ollama.com/install.sh | sh; then
    echo -e "${RED}[ERROR] Failed to install Ollama${NC}"
    echo "Install manually from: https://ollama.com/download"
    exit 1
  fi
  echo -e "${GREEN}[OK] Ollama installed${NC}"
else
  echo -e "${GREEN}[OK] Ollama already installed${NC}"
fi

echo ""
echo -e "${BOLD}[5/6] Pulling AI model (llama3.1:8b)...${NC}"
if ! ollama pull llama3.1:8b; then
  echo -e "${RED}[ERROR] Failed to pull model${NC}"
  exit 1
fi
echo -e "${GREEN}[OK] Model ready${NC}"

echo ""
echo -e "${BOLD}[6/6] Starting bot...${NC}"
echo ""
echo "========================================"
echo "  Bot is starting!"
echo "  Join your Minecraft server and chat."
echo "========================================"
echo ""

ollama serve &
OLLAMA_PID=$!
sleep 2

cleanup() {
  echo ""
  echo "Shutting down..."
  kill $OLLAMA_PID 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM

npm start

cleanup
