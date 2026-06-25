@echo off
REM GEAMS Docker Production Startup Script for Windows

echo.
echo ========================================
echo GEAMS Docker Production Deployment
echo ========================================
echo.

REM Check Docker
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Docker is not installed.
    echo Please install Docker from https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

where docker-compose >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Docker Compose is not installed.
    echo It should come with Docker Desktop.
    pause
    exit /b 1
)

echo [OK] Docker version:
docker --version

echo [OK] Docker Compose version:
docker-compose --version

REM Check .env
if not exist ".env" (
    echo.
    echo Error: .env file not found.
    echo Please copy .env.example to .env and configure it.
    echo.
    copy .env.example .env
    echo [CREATED] .env file. Please edit it with your settings.
    pause
    exit /b 1
)

REM Build and start
echo.
echo Building Docker images...
call docker-compose build --no-cache
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker build failed
    pause
    exit /b 1
)

echo.
echo Starting containers...
call docker-compose up -d
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to start containers
    pause
    exit /b 1
)

echo.
timeout /t 5 /nobreak

REM Check if running
echo.
echo Checking container status...
call docker-compose ps

echo.
echo ========================================
echo GEAMS Production Deployment Complete!
echo ========================================
echo.
echo Frontend: http://localhost:3001
echo Backend API: http://localhost:3000
echo Health Check: http://localhost:3000/health
echo.
echo View logs: docker-compose logs -f
echo Stop services: docker-compose down
echo.
echo ========================================
echo.

pause
