@echo off
echo Starting Next.js development server with HTTPS...
echo You will access the application at https://localhost:3000
echo Note: Your browser may show a security warning which is normal for self-signed certificates.
echo       You can safely proceed by clicking "Advanced" and then "Proceed to localhost (unsafe)".
cd /d "%~dp0"
npm run dev:https 