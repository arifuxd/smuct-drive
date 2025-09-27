# SMUCT Drive - Production Deployment Guide

## 🚀 Production Readiness Checklist

### ✅ Completed Tasks

- [x] Removed development console.log statements
- [x] Added proper error handling
- [x] Created production configuration
- [x] Added environment configuration examples
- [x] Created build script
- [x] Added PM2 configuration for process management

### 📋 Pre-Deployment Checklist

#### 1. Environment Configuration

- [ ] Copy `backend/env.production.example` to `backend/.env`
- [ ] Update all placeholder values with actual production values
- [ ] Set strong `SESSION_SECRET` (use a random string generator)
- [ ] Update `CORS_ORIGIN` to your production domain
- [ ] Set `NODE_ENV=production`

#### 2. Google Drive API Setup

- [ ] Verify Google Drive API credentials
- [ ] Update redirect URI for production domain
- [ ] Test Google Drive folder access
- [ ] Ensure proper permissions are set

#### 3. Security Considerations

- [ ] Use HTTPS in production
- [ ] Set up proper CORS configuration
- [ ] Use strong session secrets
- [ ] Consider rate limiting for uploads
- [ ] Set up proper file size limits

#### 4. Server Configuration

- [ ] Set up reverse proxy (nginx/Apache)
- [ ] Configure SSL certificates
- [ ] Set up process management (PM2)
- [ ] Configure logging
- [ ] Set up monitoring

## 🛠️ Deployment Steps

### Option 1: Manual Deployment

1. **Build the application:**

   ```bash
   chmod +x build-production.sh
   ./build-production.sh
   ```

2. **Deploy to server:**

   ```bash
   # Copy production folder to your server
   scp -r production/ user@your-server:/path/to/app/

   # On the server
   cd /path/to/app/production
   npm install
   npm start
   ```

### Option 2: PM2 Process Management

1. **Install PM2 globally:**

   ```bash
   npm install -g pm2
   ```

2. **Start with PM2:**

   ```bash
   cd production
   npm run pm2
   ```

3. **PM2 Commands:**
   ```bash
   pm2 list              # List running processes
   pm2 restart smuct-drive  # Restart the app
   pm2 stop smuct-drive     # Stop the app
   pm2 logs smuct-drive     # View logs
   ```

## 🔧 Production Configuration

### Environment Variables

```env
NODE_ENV=production
PORT=5000
GOOGLE_CLIENT_ID=your_actual_client_id
GOOGLE_CLIENT_SECRET=your_actual_client_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback
GOOGLE_DRIVE_FOLDER_ID=your_folder_id
SESSION_SECRET=your_very_strong_secret
APP_PASSWORD=your_secure_password
CORS_ORIGIN=https://yourdomain.com
```

### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 Monitoring & Maintenance

### Log Management

- Application logs are stored in PM2 logs
- Use `pm2 logs` to view real-time logs
- Consider setting up log rotation

### Performance Monitoring

- Monitor memory usage with PM2
- Set up alerts for high CPU/memory usage
- Monitor Google Drive API quotas

### Backup Strategy

- Regular backup of `tokens.json` file
- Backup of Google Drive folder structure
- Database backup if using external storage

## 🚨 Troubleshooting

### Common Issues

1. **Google Drive Authentication Fails**

   - Check API credentials
   - Verify redirect URI
   - Check folder permissions

2. **File Upload Issues**

   - Check file size limits
   - Verify Google Drive storage quota
   - Check network connectivity

3. **Session Issues**
   - Verify SESSION_SECRET is set
   - Check CORS configuration
   - Ensure cookies are working

### Health Check Endpoint

The application includes a health check at `/api/health` that returns:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "googleDriveAuthenticated": true
}
```

## 📞 Support

For production issues:

1. Check application logs: `pm2 logs smuct-drive`
2. Verify environment configuration
3. Test Google Drive API connectivity
4. Check server resources (CPU, memory, disk)

## 🔄 Updates

To update the application:

1. Stop the current process: `pm2 stop smuct-drive`
2. Deploy new version
3. Install dependencies: `npm install`
4. Start the process: `pm2 start smuct-drive`

---

**Note:** This application is now production-ready with proper error handling, logging, and deployment configurations.
