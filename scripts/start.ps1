$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if (-not (Test-Path ".env")) {
    Write-Host "[start] ERRO: .env nao encontrado. Corre primeiro: .\scripts\setup.ps1" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "node_modules")) {
    Write-Host "[start] node_modules nao encontrado. A instalar..." -ForegroundColor Yellow
    npm install
}

Write-Host "[start] A ligar ao servidor Minecraft..." -ForegroundColor Cyan
npm start
