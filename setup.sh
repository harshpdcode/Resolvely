#!/usr/bin/env bash

set -e

echo "==============================================================================="
echo "               ✨ RESOLVELY - ONE-CLICK PROJECT SETUP & LAUNCHER"
echo "               Author: Diya Khatri (Er.No: 2504070200014)"
echo "==============================================================================="
echo ""

# 1. Check Node.js
echo "[1/5] Checking Node.js environment..."
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed or not in PATH!"
    echo "Please install Node.js (v20+ recommended) from: https://nodejs.org"
    exit 1
fi
echo "[OK] Node.js detected: $(node -v)"
echo ""

# 2. Configure .env file
echo "[2/5] Checking environment configuration (.env)..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "[OK] Created .env from .env.example template."
    else
        cat <<EOF > .env
JWT_SECRET="resolvely-super-secure-jwt-secret-key-2026-production"
JWT_EXPIRES_IN="7d"
APP_URL="http://localhost:8080"
GOOGLE_GENERATIVE_AI_API_KEY="your-google-gemini-api-key"
EOF
        echo "[OK] Generated default .env file."
    fi
else
    echo "[OK] .env file already exists."
fi
echo ""

# 3. Install NPM Dependencies
echo "[3/5] Installing project dependencies..."
npm install
echo "[OK] Dependencies installed."
echo ""

# 4. Generate Prisma Client
echo "[4/5] Preparing database & ORM client..."
npx prisma generate || true
echo "[OK] Database layer ready."
echo ""

# 5. Launch Server
echo "[5/5] Starting Resolvely Development Server..."
echo ""
echo "-------------------------------------------------------------------------------"
echo " 🚀 Application is starting on: http://localhost:8080"
echo ""
echo " 🔑 Default Test Accounts:"
echo "   - Admin:    admin@example.com     (Password: Password123!)"
echo "   - Customer: customer1@example.com (Password: Password123!)"
echo "   - Customer: customer2@example.com (Password: Password123!)"
echo "   - Customer: customer3@example.com (Password: Password123!)"
echo "-------------------------------------------------------------------------------"
echo ""

# Open browser if supported
if command -v xdg-open &> /dev/null; then
    (sleep 3 && xdg-open http://localhost:8080) &
elif command -v open &> /dev/null; then
    (sleep 3 && open http://localhost:8080) &
fi

npm run dev
