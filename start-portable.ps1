# PowerShell Script for starting the ProjectPlanner Portable App
Write-Host "Starting ProjectPlanner Portable App..." -ForegroundColor Green
Write-Host "This is the portable version that doesn't require installation" -ForegroundColor Green

# Change to script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Check for admin rights
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "WARNING: This script requires administrator privileges for Ollama installation." -ForegroundColor Yellow
    Write-Host "Please right-click on start-portable.ps1 and select 'Run with PowerShell as administrator'" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Do you want to continue without admin privileges (Ollama installation may fail)? (Y/N)"
    if ($continue -ne "Y" -and $continue -ne "y") {
        Write-Host "Exiting..."
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Check for node_modules directory
if (-not (Test-Path "node_modules")) {
    Write-Host "First-time setup: Installing dependencies..." -ForegroundColor Cyan
    Write-Host "This may take a few minutes, please wait..." -ForegroundColor Cyan
    npm install --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error installing dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Check for .env file
if (-not (Test-Path ".env")) {
    Write-Host "Creating default environment file for portable use..." -ForegroundColor Cyan
    Copy-Item ".env.portable.example" ".env"
}

# Check for certificates directory
if (-not (Test-Path "certificates")) {
    Write-Host "Setting up HTTPS certificates for first use..." -ForegroundColor Cyan
    node setup-https.js
}

# Check for Ollama and setup if needed
Write-Host "Checking Ollama for local LLM support..." -ForegroundColor Cyan
node setup-ollama.js

# Build the app if not already built
if (-not (Test-Path ".next")) {
    Write-Host "Building application for first use..." -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error building application" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Check if port 3000 is already in use
$port = 3000

try {
    $tcpConnections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($tcpConnections) {
        Write-Host "Port 3000 is already in use, trying alternative port..." -ForegroundColor Yellow
        $port = 3001
        
        $tcpConnections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($tcpConnections) {
            $port = 3002
            
            $tcpConnections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
            if ($tcpConnections) {
                # Let Next.js pick a random port
                $port = 0
            }
        }
    }
} catch {
    Write-Host "Unable to check port availability. Will try to use default port."
}

Write-Host "Using port $port" -ForegroundColor Cyan

# Start Ollama in the background if it exists
$ollamaPath = Join-Path $scriptDir "ollama\ollama.exe"
if (Test-Path $ollamaPath) {
    Write-Host "Starting Ollama in the background..." -ForegroundColor Cyan
    Start-Process -FilePath $ollamaPath -ArgumentList "serve" -WindowStyle Hidden
} else {
    Write-Host "Ollama executable not found. Some features may not work." -ForegroundColor Yellow
}

# Start the server in portable mode with the selected port
Write-Host "Starting portable app server..." -ForegroundColor Green
$env:NODE_ENV = "production"
$env:PORTABLE_MODE = "true"
npm run start -- -p $port

# When the app is shut down, shut down Ollama too if it's running
$ollamaProcesses = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
if ($ollamaProcesses) {
    Write-Host "Shutting down Ollama..." -ForegroundColor Cyan
    Stop-Process -Name "ollama" -Force
}

Read-Host "Press Enter to exit" 