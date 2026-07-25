$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  mcbot - Setup and Run" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $Root

# 1. Check Node.js
Write-Host "[1/6] Checking Node.js..." -ForegroundColor White
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Download and install Node.js 18+ from:" -ForegroundColor Yellow
    Write-Host "  https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After installing, run this script again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# 2. Install npm packages
Write-Host ""
Write-Host "[2/6] Installing npm packages..." -ForegroundColor White
try {
    npm install
    Write-Host "[OK] npm packages installed" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to install npm packages" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# 3. Create .env if needed
Write-Host ""
Write-Host "[3/6] Checking configuration..." -ForegroundColor White
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "[OK] Created .env from .env.example" -ForegroundColor Green
        Write-Host ""
        Write-Host ">>> OPEN .env AND CONFIGURE YOUR SERVER DETAILS <<<" -ForegroundColor Yellow
        Write-Host ""
        notepad .env
    }
} else {
    Write-Host "[OK] .env already exists" -ForegroundColor Green
}

# 4. Check Ollama
Write-Host ""
Write-Host "[4/6] Checking Ollama..." -ForegroundColor White
try {
    $ollamaVersion = ollama --version
    Write-Host "[OK] Ollama already installed" -ForegroundColor Green
} catch {
    Write-Host "Ollama is not installed. Installing now..." -ForegroundColor Yellow
    Write-Host ""
    try {
        winget install Ollama.Ollama --accept-source-agreements --accept-package-agreements
        Write-Host "[OK] Ollama installed" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Could not install Ollama automatically" -ForegroundColor Red
        Write-Host "Please install manually from: https://ollama.com/download" -ForegroundColor Yellow
        Write-Host "Then run this script again." -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# 5. Pull model
Write-Host ""
Write-Host "[5/6] Pulling AI model (llama3.1:8b)..." -ForegroundColor White
try {
    ollama pull llama3.1:8b
    Write-Host "[OK] Model ready" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to pull model" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# 6. Start Ollama and run bot
Write-Host ""
Write-Host "[6/6] Starting bot..." -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Bot is starting!" -ForegroundColor Green
Write-Host "  Join your Minecraft server and chat." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Start-Process -NoNewWindow -FilePath "ollama" -ArgumentList "serve"
Start-Sleep -Seconds 3
npm start

Read-Host "Press Enter to exit"
