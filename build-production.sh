#!/bin/bash

# SMUCT Drive Production Build Script
# This script prepares the application for production deployment

echo "🚀 Building SMUCT Drive for Production..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm install
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi
cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install --production
if [ $? -ne 0 ]; then
    echo "❌ Backend dependency installation failed"
    exit 1
fi
cd ..

# Create production directory
echo "📁 Creating production directory..."
mkdir -p production
cp -r backend/* production/
cp -r frontend/out production/frontend 2>/dev/null || cp -r frontend/.next production/frontend

# Copy environment files
if [ -f "backend/.env" ]; then
    cp backend/.env production/
    echo "✅ Environment file copied"
else
    echo "⚠️  Warning: No .env file found. Please create one from env.production.example"
fi

# Create production package.json
cat > production/package.json << EOF
{
  "name": "smuct-drive-production",
  "version": "1.0.0",
  "description": "SMUCT Drive Production Build",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "pm2": "pm2 start ecosystem.config.js"
  },
  "dependencies": {
    "archiver": "^6.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-session": "^1.17.3",
    "googleapis": "^128.0.0",
    "multer": "^1.4.5-lts.1",
    "open": "^10.0.2"
  }
}
EOF

# Create PM2 ecosystem file
cat > production/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'smuct-drive',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
}
EOF

echo "✅ Production build complete!"
echo "📁 Production files are in the 'production' directory"
echo "🚀 To start the production server:"
echo "   cd production && npm start"
echo "   or"
echo "   cd production && npm run pm2"
