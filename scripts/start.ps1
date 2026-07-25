$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  mcbot - A arrancar..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".env")) {
    Write-Host "[mcbot] ERRO: .env nao encontrado!" -ForegroundColor Red
    Write-Host "        Corre primeiro: .\scripts\setup.ps1" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path "node_modules")) {
    Write-Host "[mcbot] node_modules nao encontrado. A instalar..." -ForegroundColor Yellow
    try {
        npm install
        Write-Host "[mcbot] Dependencias instaladas" -ForegroundColor Green
    } catch {
        Write-Host "[mcbot] ERRO: Falhou ao instalar dependencias" -ForegroundColor Red
        exit 1
    }
}

Write-Host "[mcbot] A ligar ao servidor Minecraft..." -ForegroundColor Cyan
npm start
