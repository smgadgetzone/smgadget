@echo off
echo ==========================================
echo   Starting SM Gadgets Project
echo ==========================================
echo.
echo Checking for Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not running.
    echo Please install Docker Desktop and start it before running this file.
    pause
    exit /b
)

echo Starting Docker containers...
docker-compose up --build

echo.
echo ==========================================
echo   Project is running! 
echo   Frontend: http://localhost:8080
echo   Backend:  http://localhost:5000
echo ==========================================
pause
