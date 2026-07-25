$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  mcbot - Instalacao" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
    $nodeVersion = node --version
    Write-Host "[mcbot] Node.js $nodeVersion detectado" -ForegroundColor Green
} catch {
    Write-Host "[mcbot] ERRO: Node.js nao encontrado!" -ForegroundColor Red
    Write-Host "        Descarrega em https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Set-Location $Root

if (-not (Test-Path "data")) {
    New-Item -ItemType Directory -Path "data" | Out-Null
    Write-Host "[mcbot] Pasta 'data/' criada" -ForegroundColor Green
}

if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "[mcbot] .env criado a partir de .env.example" -ForegroundColor Green
        Write-Host "        >>> Abre o .env e preenche os dados do teu servidor <<<" -ForegroundColor Yellow
    }
} else {
    Write-Host "[mcbot] .env ja existe - nada alterado" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[mcbot] A instalar dependencias..." -ForegroundColor Cyan
try {
    npm install
    Write-Host "[mcbot] Dependencias instaladas com sucesso" -ForegroundColor Green
} catch {
    Write-Host "[mcbot] ERRO: Falhou ao instalar dependencias" -ForegroundColor Red
    Write-Host "        Tenta manualmente: npm install" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup concluido com sucesso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor White
Write-Host ""
Write-Host "  1. Abre o ficheiro .env e configura o host/porta do teu servidor Minecraft"
Write-Host "  2. Instala e arranca o Ollama:"
Write-Host "     - Descarrega: https://ollama.com/"
Write-Host "     - Corre: ollama pull llama3.1:8b"
Write-Host "  3. Arranca o bot: .\scripts\start.ps1"
Write-Host ""
