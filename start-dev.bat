@echo off
echo Starting Next.js development server with HTTPS...
echo Note: For regular HTTP use start-dev.bat, for HTTPS use start-https.bat
cd /d "%~dp0"
npm run dev:https 