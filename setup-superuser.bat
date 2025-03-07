@echo off
echo Setting up Supabase database and creating superuser admin account...
echo.
echo This script will:
echo 1. Create necessary database tables if they don't exist
echo 2. Create or update a superuser admin account
echo 3. Create the agency in the database
echo 4. Set up the profile with admin role
echo.
echo Please wait...
echo.

npm install node-fetch@2.6.7

node src/scripts/setup-superuser.js

echo.
echo If successful, you can now log in with the credentials shown above.
pause 