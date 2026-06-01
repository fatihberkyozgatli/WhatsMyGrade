#!/bin/bash

# WhatsMyGrade Setup Script
# This script sets up the entire project

set -e

echo "🚀 Setting up WhatsMyGrade..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL is not installed. You'll need to set it up manually."
    echo "   See database/README.md for instructions."
else
    echo "✅ PostgreSQL is installed"
fi

# Backend setup
echo ""
echo "📦 Setting up backend..."
cd backend
npm install
cp .env.example .env
echo "   Backend dependencies installed"
echo "   ⚠️  Update backend/.env with your database credentials"
cd ..

# Frontend setup
echo ""
echo "📦 Setting up frontend..."
cd frontend
npm install
echo "   Frontend dependencies installed"
cd ..

# Database setup
echo ""
echo "📦 Setting up database..."
echo "   Run the following commands to set up PostgreSQL:"
echo "   createdb whatsmygrade"
echo "   psql whatsmygrade -f database/init.sql"
echo ""
echo "   Then update .env with:"
echo "   DATABASE_URL=postgresql://user:password@localhost:5432/whatsmygrade"

echo ""
echo "✅ Setup complete!"
echo ""
echo "🏃 To start development:"
echo "   Terminal 1: cd backend && npm run dev"
echo "   Terminal 2: cd frontend && npm run dev"
echo ""
echo "Or use Docker:"
echo "   docker-compose up"
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:5001"
