#!/bin/bash

set -e

if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "Node.js version: $(node -v)"

if ! command -v psql &> /dev/null; then
    echo "PostgreSQL is not installed. See database/README.md for setup instructions."
else
    echo "PostgreSQL is installed"
fi

cd backend
npm install
cp .env.example .env
cd ..

cd frontend
npm install
cd ..

echo ""
echo "Setup complete."
echo "Update backend/.env with your database credentials, then run:"
echo "  createdb whatsmygrade"
echo "  psql whatsmygrade -f database/init.sql"
echo ""
echo "Start development:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm run dev"
