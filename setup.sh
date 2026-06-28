#!/bin/bash
# ── TaskFlow Setup Script (MySQL version) ──────────────────────────────────
set -e
echo ""
echo "⚡ TaskFlow Setup"
echo "──────────────────"

# Backend
echo ""
echo "📦 Installing backend dependencies..."
cd "$(dirname "$0")/backend"
npm install

if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created backend/.env  →  Edit DB_USER, DB_PASSWORD, JWT_SECRET"
else
  echo "ℹ️  backend/.env already exists"
fi

# Frontend
echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

echo ""
echo "──────────────────────────────────────────────"
echo "✅  Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Create MySQL DB:  CREATE DATABASE taskflow;"
echo "  2. Edit backend/.env with your DB credentials"
echo "  3. Test connection:  node backend/src/config/testConnection.js"
echo ""
echo "Start dev servers:"
echo "  Terminal 1:  cd backend  && npm run dev"
echo "  Terminal 2:  cd frontend && npm start"
echo ""
echo "Open http://localhost:3000"
echo "──────────────────────────────────────────────"
