@echo off
setlocal
title ShamArchitectSys Environment Loader
color 0A
cls

echo ===================================================
echo   SHAM ARCHITECT SYS - ZERO-CONFIG LAUNCHER
echo ===================================================

:: 1. DEFINE LOCAL ENV PORTS
:: This sets the version of Node.js to download if the user doesn't have it.
set "NODE_VER=v18.16.0"
set "NODE_ZIP=node-%NODE_VER%-win-x64.zip"
set "NODE_DIR=node-%NODE_VER%-win-x64"
set "LOCAL_NODE=%~dp0%NODE_DIR%"

:: 2. CHECK FOR SYSTEM NODE
:: If the user already has Node installed globally, we use that to save time.
where node >nul 2>nul
if %errorlevel% equ 0 (
    echo [CHECK] System Node.js detected. Using system version.
    goto :INSTALL_DEPS
)

:: 3. CHECK FOR LOCAL PORTABLE NODE
:: If we already downloaded it previously, use the local version.
if exist "%LOCAL_NODE%\\node.exe" (
    echo [CHECK] Local portable Node.js detected.
    set "PATH=%LOCAL_NODE%;%PATH%"
    goto :INSTALL_DEPS
)

:: 4. AUTO-DOWNLOAD NODE.JS (If missing)
echo [INFO] Node.js not found on this computer.
echo [INFO] Initializing portable virtual environment...
echo [DOWNLOAD] Downloading Node.js (%NODE_VER%)... This may take a minute.

:: Use Windows built-in Curl to download standalone node
curl -o %NODE_ZIP% https://nodejs.org/dist/%NODE_VER%/%NODE_ZIP%

if not exist "%NODE_ZIP%" (
    echo [ERROR] Download failed. Please check internet connection.
    pause
    exit
)

echo [EXTRACT] Unzipping environment...
tar -xf %NODE_ZIP%

:: Cleanup Zip to save space
del %NODE_ZIP%

:: Set Path to use the new local node for this session only
set "PATH=%LOCAL_NODE%;%PATH%"
echo [SUCCESS] Virtual Environment created at %NODE_DIR%

:INSTALL_DEPS
echo.
echo [INFO] Checking dependencies...
if not exist "node_modules" (
    echo [INSTALL] First run detected. Installing project libraries...
    call npm install
) else (
    echo [CHECK] Dependencies ready.
)

echo.
echo [START] Launching Architect Engine...
echo [NOTE] If a browser doesn't open automatically, go to http://localhost:3000
echo.
npm start
pause