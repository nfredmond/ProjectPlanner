@echo off
echo Starting ProjectPlanner Portable App...
echo This is the portable version that doesn't require installation
cd /d "%~dp0"

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

REM Start the server in portable mode
echo Starting portable app server...
set NODE_ENV=production
set PORTABLE_MODE=true
npm run start

pause 