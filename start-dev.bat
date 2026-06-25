@echo off
REM GEAMS Development Startup Script for Windows

echo.
echo ========================================
echo GEAMS Development Environment Setup
echo ========================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed.
    echo Please install Node.js 18 or higher from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js version:
node --version

echo [OK] NPM version:
npm --version

REM Create directories
echo.
echo Creating directories...
if not exist "data" mkdir data
if not exist "recordings" mkdir recordings
echo [OK] Directories created

REM Install dependencies
if not exist "node_modules" (
    echo.
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] npm install failed
        pause
        exit /b 1
    )
) else (
    echo [OK] Dependencies already installed
)

REM Create .env if it doesn't exist
if not exist ".env" (
    echo.
    echo Creating .env file from .env.example...
    copy .env.example .env >nul
    echo [OK] .env created. Edit if needed.
) else (
    echo [OK] .env already exists
)

REM Start development servers
echo.
echo ========================================
echo Starting GEAMS Development Servers
echo ========================================
echo.
echo Frontend: http://localhost:3001
echo Backend: http://localhost:3000
echo Health: http://localhost:3000/health
echo.
echo Press Ctrl+C to stop
echo ========================================
echo.

call npm run dev

pause
