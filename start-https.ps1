Write-Host "Starting Next.js development server with HTTPS..." -ForegroundColor Green
Write-Host "You will access the application at https://localhost:3000" -ForegroundColor Cyan
Write-Host "Note: Your browser may show a security warning which is normal for self-signed certificates." -ForegroundColor Yellow
Write-Host "      You can safely proceed by clicking 'Advanced' and then 'Proceed to localhost (unsafe)'." -ForegroundColor Yellow
Set-Location -Path $PSScriptRoot
npm run dev:https 