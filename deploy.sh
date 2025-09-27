#!/bin/bash

# SMUCT Drive Deployment Script
# This script helps you deploy to Vercel (frontend) and Render (backend)

echo "🚀 SMUCT Drive Deployment Script"
echo "================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not initialized. Please run:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    exit 1
fi

# Check if remote origin is set
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ No remote origin set. Please run:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/smuct-drive.git"
    exit 1
fi

echo "✅ Git repository ready"

# Push to GitHub
echo "📤 Pushing to GitHub..."
git add .
git commit -m "Prepare for deployment" || echo "No changes to commit"
git push origin main

echo "✅ Code pushed to GitHub"
echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. BACKEND DEPLOYMENT (Render):"
echo "   - Go to https://render.com"
echo "   - Sign up/Login with GitHub"
echo "   - Click 'New +' → 'Web Service'"
echo "   - Connect your repository"
echo "   - Configure:"
echo "     • Name: smuct-drive-backend"
echo "     • Root Directory: backend"
echo "     • Environment: Node"
echo "     • Build Command: npm install"
echo "     • Start Command: npm start"
echo "   - Set environment variables (see backend/env.production.example)"
echo ""
echo "2. FRONTEND DEPLOYMENT (Vercel):"
echo "   - Go to https://vercel.com"
echo "   - Sign up/Login with GitHub"
echo "   - Click 'New Project'"
echo "   - Import your repository"
echo "   - Configure:"
echo "     • Framework: Next.js"
echo "     • Root Directory: frontend"
echo "   - Set environment variable:"
echo "     • NEXT_PUBLIC_API_URL: https://YOUR_RENDER_URL.onrender.com"
echo ""
echo "3. UPDATE GOOGLE OAUTH:"
echo "   - Go to Google Cloud Console"
echo "   - Update redirect URI to: https://YOUR_RENDER_URL.onrender.com/auth/google/callback"
echo ""
echo "4. TEST DEPLOYMENT:"
echo "   - Visit your Vercel URL"
echo "   - Test Google login"
echo "   - Test file upload/download"
echo ""
echo "📚 For detailed instructions, see VERCEL-RENDER-DEPLOYMENT.md"
