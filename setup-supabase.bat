@echo off
echo Setting up Supabase database and creating superuser admin account...
node src/scripts/setup-supabase.js
echo.
echo If successful, you can now log in with the credentials shown above.
pause 