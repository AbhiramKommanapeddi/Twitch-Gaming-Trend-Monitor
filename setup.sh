#!/bin/bash

# Twitch Gaming Trend Monitor - Development Setup Script

echo "🎮 Setting up Twitch Gaming Trend Monitor..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi
echo "✅ Backend dependencies installed"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi
echo "✅ Frontend dependencies installed"

# Go back to root
cd ..

# Create .env file if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating .env file from template..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please update the .env file with your actual API keys and database credentials"
fi

echo ""
echo "🚀 Setup complete! Next steps:"
echo ""
echo "1. Update backend/.env with your credentials:"
echo "   - DATABASE_URL (PostgreSQL connection string)"
echo "   - REDIS_URL (Redis connection string)"
echo "   - TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET"
echo "   - JWT_SECRET"
echo "   - SESSION_SECRET"
echo ""
echo "2. Start the services:"
echo "   npm run dev:backend    # Start backend server"
echo "   npm run dev:frontend   # Start frontend development server"
echo ""
echo "3. Or start both with:"
echo "   npm run dev           # Start both backend and frontend"
echo ""
echo "📚 Check README.md for detailed setup instructions"
