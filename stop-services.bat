@echo off
REM GEAMS Docker Cleanup Script for Windows

echo.
echo Cleaning up GEAMS Docker environment...
echo.

call docker-compose down -v

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] Cleanup complete!
    echo.
    echo To remove Docker images as well, run:
    echo   docker-compose down -v --rmi all
) else (
    echo.
    echo [ERROR] Cleanup failed
)

echo.
pause
