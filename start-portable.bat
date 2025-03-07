@echo off
echo Starting ProjectPlanner Portable App...
echo This is the portable version that doesn't require installation
cd /d "%~dp0"

REM Check for admin rights
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: This script requires administrator privileges for Ollama installation.
    echo Please right-click on start-portable.bat and select "Run as administrator"
    echo.
    choice /C YN /M "Do you want to continue without admin privileges (Ollama installation may fail)?"
    if errorlevel 2 (
        echo Exiting...
        pause
        exit /b 1
    )
)

REM Check for the existence of the node_modules directory
if not exist "node_modules\" (
    echo First-time setup: Installing dependencies...
    echo This may take a few minutes, please wait...
    npm install --no-audit --no-fund
    if %ERRORLEVEL% neq 0 (
        echo Error installing dependencies
        pause
        exit /b 1
    )
)

REM Check if .env file exists, if not create from example
if not exist ".env" (
    echo Creating default environment file for portable use...
    copy .env.portable.example .env
)

REM Check for certificates directory
if not exist "certificates\" (
    echo Setting up HTTPS certificates for first use...
    node setup-https.js
)

REM Check for Ollama and setup if needed
echo Checking Ollama for local LLM support...
node setup-ollama.js

REM Build the app if not already built
if not exist ".next\" (
    echo Building application for first use...
    npm run build
    if %ERRORLEVEL% neq 0 (
        echo Error building application
        pause
        exit /b 1
    )
)

REM Check if port 3000 is already in use
set PORT=3000
netstat -ano | findstr :3000 >nul
if %errorlevel% equ 0 (
    echo Port 3000 is already in use, trying alternative port...
    set PORT=3001
    netstat -ano | findstr :3001 >nul
    if %errorlevel% equ 0 (
        set PORT=3002
        netstat -ano | findstr :3002 >nul
        if %errorlevel% equ 0 (
            set PORT=0
        )
    )
)

echo Using port %PORT%

REM Start Ollama in the background if it exists
if exist "%~dp0\ollama\ollama.exe" (
    echo Starting Ollama in the background...
    start /B "Ollama" "%~dp0\ollama\ollama.exe" serve
) else (
    echo Ollama executable not found. Some features may not work.
)

REM Start the server in portable mode with the selected port
echo Starting portable app server...
set NODE_ENV=production
set PORTABLE_MODE=true
npm run start -- -p %PORT%

REM When the app is shut down, shut down Ollama too if it's running
taskkill /F /IM ollama.exe >nul 2>&1

pause 