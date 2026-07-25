$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  mcbot - Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
    $nodeVersion = node --version
    Write-Host "[mcbot] Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "[mcbot] ERROR: Node.js not found!" -ForegroundColor Red
    Write-Host "        Download from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Set-Location $Root

if (-not (Test-Path "data")) {
    New-Item -ItemType Directory -Path "data" | Out-Null
    Write-Host "[mcbot] Folder 'data/' created" -ForegroundColor Green
}

if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "[mcbot] .env created from .env.example" -ForegroundColor Green
        Write-Host "        >>> Open .env and fill in your server details <<<" -ForegroundColor Yellow
    }
} else {
    Write-Host "[mcbot] .env already exists - nothing changed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[mcbot] Installing dependencies..." -ForegroundColor Cyan
try {
    npm install
    Write-Host "[mcbot] Dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "[mcbot] ERROR: Failed to install dependencies" -ForegroundColor Red
    Write-Host "        Try manually: npm install" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host ""
Write-Host "  1. Open .env and configure your Minecraft server host/port"
Write-Host "  2. Install and start Ollama:"
Write-Host "     - Download: https://ollama.com/"
Write-Host "     - Run: ollama pull llama3.1:8b"
Write-Host "  3. Start the bot: .\scripts\start.ps1"
Write-Host ""
