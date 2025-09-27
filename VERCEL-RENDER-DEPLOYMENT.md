# SMUCT Drive - Vercel + Render Deployment Guide

## 🚀 Complete Deployment Guide: Frontend on Vercel, Backend on Render

### 📋 Prerequisites
- GitHub account
- Vercel account (free tier available)
- Render account (free tier available)
- Google Cloud Console project with Drive API enabled

---

## Step 1: GitHub Repository Setup

### 1.1 Create GitHub Repository
1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Repository name: `smuct-drive`
5. Description: `SMUCT Drive - Google Drive File Manager`
6. Set to **Public** (required for free Vercel/Render)
7. **DO NOT** initialize with README, .gitignore, or license
8. Click "Create repository"

### 1.2 Initialize Local Git Repository
```bash
# In your project directory
git init
git add .
git commit -m "Initial commit: SMUCT Drive application"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/smuct-drive.git
git push -u origin main
```

### 1.3 Create .gitignore File
```bash
# Create .gitignore in project root
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
frontend/.next/
frontend/out/
frontend/build/
backend/dist/

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Logs
logs
*.log

# Google Drive tokens
backend/tokens.json

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo

# Production build
production/
EOF
```

---

## Step 2: Backend Deployment on Render

### 2.1 Prepare Backend for Render
Create a `render.yaml` file in the backend directory:

```yaml
# render.yaml
services:
  - type: web
    name: smuct-drive-backend
    env: node
    plan: free
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
```

### 2.2 Create Backend Package.json Scripts
Update `backend/package.json`:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon --ignore tokens.json server.js",
    "build": "echo 'No build step required'"
  }
}
```

### 2.3 Deploy Backend to Render
1. Go to [Render.com](https://render.com) and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select your `smuct-drive` repository
5. Configure the service:
   - **Name**: `smuct-drive-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 2.4 Set Environment Variables on Render
In Render dashboard, go to Environment tab and add:

```env
NODE_ENV=production
PORT=10000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://smuct-drive-backend.onrender.com/auth/google/callback
GOOGLE_DRIVE_FOLDER_ID=your_google_drive_folder_id
SESSION_SECRET=your_very_strong_session_secret_here
APP_PASSWORD=your_secure_app_password
CORS_ORIGIN=https://smuct-drive.vercel.app
```

**Important**: Replace `smuct-drive-backend.onrender.com` with your actual Render URL

### 2.5 Update Google OAuth Settings
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID
4. Add to **Authorized redirect URIs**:
   ```
   https://smuct-drive-backend.onrender.com/auth/google/callback
   ```

---

## Step 3: Frontend Deployment on Vercel

### 3.1 Prepare Frontend for Vercel
Create `vercel.json` in the project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "frontend/$1"
    }
  ],
  "env": {
    "NEXT_PUBLIC_API_URL": "https://smuct-drive-backend.onrender.com"
  }
}
```

### 3.2 Update Frontend API URLs
Update all API calls in frontend to use environment variable:

```typescript
// Create frontend/lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export const api = {
  baseURL: API_BASE_URL,
  // Add other API utilities here
}
```

### 3.3 Deploy Frontend to Vercel
1. Go to [Vercel.com](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 3.4 Set Environment Variables on Vercel
In Vercel dashboard, go to Settings → Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://smuct-drive-backend.onrender.com
```

---

## Step 4: Update Backend CORS Configuration

### 4.1 Update server.js CORS Settings
```javascript
// In backend/server.js, update CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://smuct-drive.vercel.app', // Your Vercel domain
    process.env.CORS_ORIGIN
  ],
  credentials: true,
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions))
```

---

## Step 5: Testing the Deployment

### 5.1 Test Backend
1. Visit your Render backend URL: `https://smuct-drive-backend.onrender.com`
2. You should see: "SMUCT Drive Backend is running"
3. Test health endpoint: `https://smuct-drive-backend.onrender.com/api/health`

### 5.2 Test Frontend
1. Visit your Vercel frontend URL: `https://smuct-drive.vercel.app`
2. Try logging in with Google
3. Test file upload functionality

---

## Step 6: Domain Configuration (Optional)

### 6.1 Custom Domain on Vercel
1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Update DNS records as instructed

### 6.2 Custom Domain on Render
1. In Render dashboard, go to your service
2. Click "Settings" → "Custom Domains"
3. Add your custom domain
4. Update DNS records as instructed

---

## Step 7: Monitoring and Maintenance

### 7.1 Render Monitoring
- Check Render dashboard for service status
- Monitor logs in Render dashboard
- Set up uptime monitoring

### 7.2 Vercel Monitoring
- Check Vercel dashboard for deployment status
- Monitor analytics in Vercel dashboard
- Set up error tracking

---

## 🔧 Troubleshooting

### Common Issues

#### Backend Issues
1. **Service not starting**: Check Render logs
2. **Environment variables**: Verify all are set correctly
3. **Google OAuth**: Ensure redirect URI matches exactly
4. **CORS errors**: Check CORS_ORIGIN setting

#### Frontend Issues
1. **API calls failing**: Check NEXT_PUBLIC_API_URL
2. **Build failures**: Check Vercel build logs
3. **Environment variables**: Ensure they start with NEXT_PUBLIC_

#### Google Drive Issues
1. **Authentication fails**: Check OAuth configuration
2. **File upload fails**: Verify Drive API quotas
3. **Folder access**: Ensure folder ID is correct

### Debug Commands
```bash
# Check backend logs on Render
# Go to Render dashboard → Your service → Logs

# Check frontend build logs on Vercel
# Go to Vercel dashboard → Your project → Functions → View Function Logs
```

---

## 📊 Cost Estimation

### Free Tier Limits
- **Vercel**: 100GB bandwidth, unlimited deployments
- **Render**: 750 hours/month, 512MB RAM
- **Google Drive API**: 1 billion requests/day (free)

### Paid Upgrades (if needed)
- **Render**: $7/month for always-on service
- **Vercel Pro**: $20/month for team features

---

## 🎉 Success Checklist

- [ ] GitHub repository created and code pushed
- [ ] Backend deployed on Render
- [ ] Frontend deployed on Vercel
- [ ] Environment variables configured
- [ ] Google OAuth redirect URI updated
- [ ] CORS configuration updated
- [ ] Both services are accessible
- [ ] Google login works
- [ ] File upload/download works
- [ ] All features tested

---

## 📞 Support

If you encounter issues:
1. Check the logs in both Render and Vercel dashboards
2. Verify all environment variables are set correctly
3. Test the backend API endpoints directly
4. Check Google Cloud Console for API quotas and errors

Your SMUCT Drive will be live at:
- **Frontend**: `https://smuct-drive.vercel.app`
- **Backend**: `https://smuct-drive-backend.onrender.com`
