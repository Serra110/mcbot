$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  mcbot - Starting..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".env")) {
    Write-Host "[mcbot] ERROR: .env not found!" -ForegroundColor Red
    Write-Host "        Run setup first: .\scripts\setup.ps1" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path "node_modules")) {
    Write-Host "[mcbot] node_modules not found. Installing..." -ForegroundColor Yellow
    try {
        npm install
        Write-Host "[mcbot] Dependencies installed" -ForegroundColor Green
    } catch {
        Write-Host "[mcbot] ERROR: Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

Write-Host "[mcbot] Connecting to Minecraft server..." -ForegroundColor Cyan
npm start
