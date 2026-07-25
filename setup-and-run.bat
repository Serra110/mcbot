@echo off
title mcbot - Minecraft AI Bot
color 0B

echo.
echo ========================================
echo   mcbot - Setup and Run
echo ========================================
echo.

:: Check Node.js
echo [1/6] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Node.js is not installed!
    echo.
    echo Download and install Node.js 18+ from:
    echo   https://nodejs.org/
    echo.
    echo After installing, run this script again.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo [OK] Node.js %NODE_VER% detected

:: Install npm packages
echo.
echo [2/6] Installing npm packages...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install npm packages
    pause
    exit /b 1
)
echo [OK] npm packages installed

:: Create .env if needed
echo.
echo [3/6] Checking configuration...
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
        echo [OK] Created .env from .env.example
        echo.
        echo >>> OPEN .env AND CONFIGURE YOUR SERVER DETAILS <<<
        echo.
        notepad .env
    )
) else (
    echo [OK] .env already exists
)

:: Check Ollama
echo.
echo [4/6] Checking Ollama...
ollama --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo Ollama is not installed. Installing now...
    echo.
    winget install Ollama.Ollama --accept-source-agreements --accept-package-agreements
    if %errorlevel% neq 0 (
        echo.
        echo [WARNING] Could not install Ollama automatically.
        echo Please install it manually from: https://ollama.com/download
        echo Then run this script again.
        pause
        exit /b 1
    )
    echo [OK] Ollama installed
) else (
    echo [OK] Ollama already installed
)

:: Pull model
echo.
echo [5/6] Pulling AI model (llama3.1:8b)...
ollama pull llama3.1:8b
if %errorlevel% neq 0 (
    echo [ERROR] Failed to pull model
    pause
    exit /b 1
)
echo [OK] Model ready

:: Start Ollama and run bot
echo.
echo [6/6] Starting bot...
echo.
echo ========================================
echo   Bot is starting!
echo   Join your Minecraft server and chat.
echo ========================================
echo.

start "" cmd /c "ollama serve"
timeout /t 3 /nobreak >nul
call npm start

pause
