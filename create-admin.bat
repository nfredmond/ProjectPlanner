@echo off
echo Creating superuser admin account...
node src/scripts/create-superuser.js
echo.
echo If successful, you can now log in with your superuser account!
pause 