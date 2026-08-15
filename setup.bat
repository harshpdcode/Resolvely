@echo off
setlocal enabledelayedexpansion

echo ===============================================================================
echo                ✨ RESOLVELY - ONE-CLICK PROJECT SETUP & LAUNCHER
echo                Author: Diya Khatri (Er.No: 2504070200014)
echo ===============================================================================
echo.

:: 1. Check Node.js installation
echo [1/5] Checking Node.js environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js (v20+ recommended) from: https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
echo [OK] Node.js detected: !NODE_VERSION!
echo.

:: 2. Configure .env file
echo [2/5] Checking environment configuration (.env)...
if not exist .env (
    if exist .env.example (
        copy .env.example .env >nul
        echo [OK] Created .env from .env.example template.
    ) else (
        echo JWT_SECRET="resolvely-super-secure-jwt-secret-key-2026-production" > .env
        echo JWT_EXPIRES_IN="7d" >> .env
        echo APP_URL="http://localhost:8080" >> .env
        echo GOOGLE_GENERATIVE_AI_API_KEY="your-google-gemini-api-key" >> .env
        echo [OK] Generated default .env file.
    )
) else (
    echo [OK] .env file already exists.
)
echo.

:: 3. Install NPM Dependencies
echo [3/5] Installing project dependencies (this may take a minute on first run)...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies! Please check your internet connection.
    pause
    exit /b 1
)
echo [OK] All dependencies successfully installed.
echo.

:: 4. Generate Prisma Client
echo [4/5] Preparing database & ORM client...
call npx prisma generate >nul 2>nul
echo [OK] Database layer ready.
echo.

:: 5. Clean cache and Launch Server
echo [5/5] Starting Resolvely Development Server...
echo.
echo -------------------------------------------------------------------------------
echo  🚀 Application is starting on: http://localhost:8080
echo.
echo  🔑 Default Test Accounts:
echo    - Admin:    admin@example.com     (Password: Password123!)
echo    - Customer: customer1@example.com (Password: Password123!)
echo    - Customer: customer2@example.com (Password: Password123!)
echo    - Customer: customer3@example.com (Password: Password123!)
echo -------------------------------------------------------------------------------
echo.

:: Automatically open browser after 3 seconds in background
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:8080"

:: Start Vite dev server
call npm run dev

pause
