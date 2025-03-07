@echo off
setlocal enabledelayedexpansion

echo.
echo ===================================
echo Project Planner - Issue Fixer Tool
echo ===================================
echo.
echo This tool will attempt to diagnose and fix common issues with Project Planner.
echo.

:menu
echo What issue would you like to fix?
echo.
echo 1) Port 3000 already in use (can't start server)
echo 2) Ollama installation issues
echo 3) Clear Next.js build cache
echo 4) Kill any running Node.js processes
echo 5) Reset application to default state
echo 6) Exit
echo.
set /p choice=Enter your choice (1-6): 

if "%choice%"=="1" goto fix_port
if "%choice%"=="2" goto fix_ollama
if "%choice%"=="3" goto clear_cache
if "%choice%"=="4" goto kill_node
if "%choice%"=="5" goto reset_app
if "%choice%"=="6" goto end
goto menu

:fix_port
echo.
echo ===================================
echo Fixing Port 3000 Issue
echo ===================================
echo.
echo Checking for processes using port 3000...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    set pid=%%a
    if not "!pid!"=="" (
        echo Found process with PID !pid! using port 3000.
        echo Attempting to kill process...
        taskkill /F /PID !pid!
        if !errorlevel! equ 0 (
            echo Successfully killed process using port 3000.
        ) else (
            echo Failed to kill process. You may need administrator privileges.
        )
    )
)

echo Checking if port 3000 is now available...
netstat -ano | findstr :3000 > nul
if !errorlevel! equ 0 (
    echo Port 3000 is still in use.
    echo.
    echo Recommendations:
    echo 1. Try running this tool as administrator
    echo 2. Restart your computer
    echo 3. Set a different port in your .env file with PORT=3001
) else (
    echo Port 3000 is now available. You should be able to start the server.
)

goto menu_return

:fix_ollama
echo.
echo ===================================
echo Fixing Ollama Installation Issues
echo ===================================
echo.

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo This fix requires administrator privileges.
    echo Please right-click on fix-common-issues.bat and select "Run as administrator".
    goto menu_return
)

echo Checking for existing Ollama installation...

if exist "%ProgramFiles%\Ollama\ollama.exe" (
    echo Found Ollama installation at "%ProgramFiles%\Ollama\ollama.exe".
    echo Creating a link to the system installation...
    
    if not exist "ollama\" (
        mkdir ollama
    )
    
    copy "%ProgramFiles%\Ollama\ollama.exe" "ollama\ollama.exe"
    if !errorlevel! equ 0 (
        echo Successfully linked to system Ollama installation.
    ) else (
        echo Failed to link system Ollama installation.
    )
) else (
    echo No system Ollama installation found.
    echo Downloading and installing Ollama...
    
    if not exist "ollama\" (
        mkdir ollama
    )
    
    echo Downloading Ollama installer...
    powershell -Command "Invoke-WebRequest -Uri 'https://ollama.com/download/ollama-windows-amd64.exe' -OutFile 'ollama\ollama_installer.exe'"
    
    if !errorlevel! equ 0 (
        echo Download successful. Installing Ollama...
        echo This will open the Ollama installer. Please complete the installation wizard.
        start /wait "ollama\ollama_installer.exe"
        echo.
        echo After installation, please run this fix tool again to link the installation.
    ) else (
        echo Failed to download Ollama installer.
        echo Please download and install manually from https://ollama.com/download
    )
)

goto menu_return

:clear_cache
echo.
echo ===================================
echo Clearing Next.js Build Cache
echo ===================================
echo.

echo Stopping any running Next.js server...
taskkill /F /IM node.exe > nul 2>&1

echo Removing build cache...
if exist ".next\" (
    rmdir /s /q .next
    echo Successfully removed Next.js build cache.
) else (
    echo No build cache found.
)

echo.
echo Next steps:
echo 1. Run 'npm run build' to rebuild the application
echo 2. Then start the application with start-portable.bat

goto menu_return

:kill_node
echo.
echo ===================================
echo Killing Node.js Processes
echo ===================================
echo.

echo Searching for Node.js processes...
tasklist | findstr node.exe

echo Attempting to kill all Node.js processes...
taskkill /F /IM node.exe > nul 2>&1

if !errorlevel! equ 0 (
    echo Successfully killed all Node.js processes.
) else (
    echo No Node.js processes found or could not kill processes.
    echo You may need administrator privileges.
)

goto menu_return

:reset_app
echo.
echo ===================================
echo Reset Application to Default State
echo ===================================
echo.
echo WARNING: This will remove your build cache and reset your environment settings.
echo Your data in Supabase will NOT be affected.
echo.
set /p confirm=Are you sure you want to continue? (Y/N): 

if /i not "%confirm%"=="Y" goto menu_return

echo Stopping any running processes...
taskkill /F /IM node.exe > nul 2>&1
taskkill /F /IM ollama.exe > nul 2>&1

echo Removing build cache...
if exist ".next\" (
    rmdir /s /q .next
    echo Removed Next.js build cache.
)

echo Backing up and resetting environment file...
if exist ".env" (
    copy .env .env.backup
    echo Backed up your .env file to .env.backup
    copy .env.portable.example .env
    echo Reset environment file to default.
)

echo.
echo Application has been reset to default state.
echo Your previous .env configuration was backed up to .env.backup.
echo.
echo Next steps:
echo 1. Run 'npm run build' to rebuild the application
echo 2. Then start the application with start-portable.bat

goto menu_return

:menu_return
echo.
echo Press any key to return to the menu...
pause > nul
cls
goto menu

:end
echo.
echo Thank you for using the Project Planner Issue Fixer tool.
echo. 