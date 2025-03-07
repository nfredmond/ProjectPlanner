Write-Host "Starting Next.js development server..." -ForegroundColor Green
Write-Host "For HTTPS mode, use .\start-https.ps1 instead" -ForegroundColor Yellow
Set-Location -Path $PSScriptRoot
npm run dev 