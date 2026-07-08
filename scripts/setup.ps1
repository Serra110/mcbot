$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

Write-Host "[setup] mcbot - instalacao Windows" -ForegroundColor Cyan

try {
    $nodeVersion = node --version
    Write-Host "[setup] Node.js $nodeVersion OK" -ForegroundColor Green
} catch {
    Write-Host "[setup] ERRO: Node.js nao encontrado. Instala em https://nodejs.org/" -ForegroundColor Red
    exit 1
}

Set-Location $Root

if (-not (Test-Path "data")) {
    New-Item -ItemType Directory -Path "data" | Out-Null
    Write-Host "[setup] Pasta data/ criada" -ForegroundColor Green
}

if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "[setup] .env criado a partir de .env.example" -ForegroundColor Green
    }
} else {
    Write-Host "[setup] .env ja existe" -ForegroundColor Yellow
}

Write-Host "[setup] A instalar dependencias npm..." -ForegroundColor Cyan
npm install

Write-Host ""
Write-Host "=== Setup concluido ===" -ForegroundColor Green
Write-Host "  1. Edita .env com os dados do servidor Minecraft"
Write-Host "  2. Instala Ollama: https://ollama.com/ e corre: ollama pull llama3.1:8b"
Write-Host "  3. Arranca o bot: npm start"
Write-Host ""
