Write-Host "Starting ProjectPlanner Portable App..." -ForegroundColor Green
Write-Host "This is the portable version that doesn't require installation" -ForegroundColor Cyan
Set-Location -Path $PSScriptRoot

# Check for the existence of the node_modules directory
if (-not (Test-Path "node_modules")) {
    Write-Host "First-time setup: Installing dependencies..." -ForegroundColor Yellow
    Write-Host "This may take a few minutes, please wait..." -ForegroundColor Yellow
    npm install --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error installing dependencies" -ForegroundColor Red
        Read-Host -Prompt "Press Enter to exit"
        exit 1
    }
}

# Check if .env file exists, if not create from example
if (-not (Test-Path ".env")) {
    Write-Host "Creating default environment file for portable use..." -ForegroundColor Yellow
    Copy-Item ".env.portable.example" ".env"
}

# Check for certificates directory
if (-not (Test-Path "certificates")) {
    Write-Host "Setting up HTTPS certificates for first use..." -ForegroundColor Yellow
    node setup-https.js
}

# Build the app if not already built
if (-not (Test-Path ".next")) {
    Write-Host "Building application for first use..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error building application" -ForegroundColor Red
        Read-Host -Prompt "Press Enter to exit"
        exit 1
    }
}

# Start the server in portable mode
Write-Host "Starting portable app server..." -ForegroundColor Green
$env:NODE_ENV = "production"
$env:PORTABLE_MODE = "true"
npm run start

Read-Host -Prompt "Press Enter to exit" 