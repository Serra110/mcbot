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

Write-Host "[mcbot] Starting local services..." -ForegroundColor Cyan
$ollama = Get-Command ollama -ErrorAction SilentlyContinue
if ($ollama) {
    try {
        $null = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
        Write-Host "[mcbot] Ollama already running" -ForegroundColor Green
    } catch {
        Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Minimized
        Start-Sleep -Seconds 3
        Write-Host "[mcbot] Ollama server started" -ForegroundColor Green
    }
} else {
    Write-Host "[mcbot] Ollama not found. Install it from https://ollama.com/ and run the bot again." -ForegroundColor Yellow
}

$paperProcess = $null
if (Test-Path "paper-1.20.1-196.jar") {
    if (-not (Test-Path "eula.txt")) {
        "eula=true" | Out-File -FilePath "eula.txt" -Encoding ascii
    }
    if (-not (Test-Path "server.properties")) {
        @(
            "allow-flight=true",
            "online-mode=false",
            "server-port=25565",
            "motd=mcbot server",
            "max-players=20"
        ) | Out-File -FilePath "server.properties" -Encoding ascii
    }
    $paperRunning = Get-NetTCPConnection -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq 25565 }
    if (-not $paperRunning) {
        $paperProcess = Start-Process -FilePath "java" -ArgumentList "-jar", "paper-1.20.1-196.jar" -WorkingDirectory $Root -PassThru -WindowStyle Normal
        Start-Sleep -Seconds 5
        Write-Host "[mcbot] Paper server started" -ForegroundColor Green
    } else {
        Write-Host "[mcbot] Paper server already running" -ForegroundColor Green
    }
}

$null = [Console]::CancelKeyPress += {
    if ($paperProcess) {
        Stop-Process -Id $paperProcess.Id -Force -ErrorAction SilentlyContinue
    }
    exit 0
}

Write-Host "[mcbot] Connecting to Minecraft server..." -ForegroundColor Cyan
try {
    npm start
}
finally {
    if ($paperProcess) {
        Stop-Process -Id $paperProcess.Id -Force -ErrorAction SilentlyContinue
    }
}
