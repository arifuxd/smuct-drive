const express = require('express');
const cors = require('cors');
const session = require('express-session');
const multer = require('multer');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const open = require('open');
const archiver = require('archiver');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://smuct-drive.vercel.app',
    process.env.CORS_ORIGIN
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Trust the first proxy for secure cookies in production
app.set('trust proxy', 1); 

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 
  } // 24 hours
}));

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 2000 * 1024 * 1024 } // 2000MB limit
});

// Google Drive OAuth setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/auth/google/callback'
);

const drive = google.drive({ version: 'v3', auth: oauth2Client });

// Persistent token storage
const TOKENS_FILE = path.join(__dirname, 'tokens.json');

// Enhanced token loading for both production and development
let tokens = null;
const loadTokens = () => {
  try {
    // In production, try environment variables first
    if (process.env.NODE_ENV === 'production' && process.env.GOOGLE_TOKENS) {
      tokens = JSON.parse(process.env.GOOGLE_TOKENS);
      console.log('✅ Tokens loaded from environment variables');
      return;
    }
    
    // In development, load from file
    if (fs.existsSync(TOKENS_FILE)) {
      const data = fs.readFileSync(TOKENS_FILE, 'utf8');
      tokens = JSON.parse(data);
      console.log('✅ Tokens loaded from file');
    }
  } catch (error) {
    console.error('❌ Error loading tokens:', error);
    tokens = null;
  }
};

// Enhanced token saving for both production and development
const saveTokens = (newTokens) => {
  try {
    tokens = newTokens;
    
    if (process.env.NODE_ENV === 'production') {
      // In production, log tokens for manual addition to environment variables
      console.log('\n🔐 COPY THIS TO RENDER ENVIRONMENT VARIABLES:');
      console.log('Variable Name: GOOGLE_TOKENS');
      console.log('Variable Value:');
      console.log(JSON.stringify(newTokens));
      console.log('\nGo to Render Dashboard → Environment → Add above as GOOGLE_TOKENS');
      console.log('Then redeploy your service for the tokens to persist.\n');
    } else {
      // In development, save to file
      fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
      console.log('✅ Tokens saved to file');
    }
  } catch (error) {
    console.error('❌ Error saving tokens:', error);
  }
};

// Load tokens on startup
loadTokens();

// Function to check if we have valid tokens
const hasValidTokens = () => {
  return tokens && tokens.access_token;
};

// Function to refresh tokens if needed
const refreshTokensIfNeeded = async () => {
  if (!tokens || !tokens.refresh_token) {
    console.log('No refresh token available');
    return false;
  }
  
  try {
    console.log('Attempting to refresh tokens...');
    oauth2Client.setCredentials(tokens);
    const { credentials } = await oauth2Client.refreshAccessToken();
    saveTokens(credentials); // Save refreshed tokens
    oauth2Client.setCredentials(credentials);
    console.log('Tokens refreshed successfully');
    return true;
  } catch (error) {
    console.error('Error refreshing tokens:', error.message);
    // If refresh fails, clear tokens
    saveTokens(null);
    return false;
  }
};

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session.authenticated) {
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
};

// Google Drive authentication middleware
const requireGoogleAuth = async (req, res, next) => {
  console.log('Checking Google Drive authentication...');
  
  if (!hasValidTokens()) {
    console.log('No tokens found');
    return res.status(401).json({ 
      error: 'Google Drive not authenticated. Please authenticate first.',
      needsAuth: true 
    });
  }
  
  try {
    // Set credentials before checking
    oauth2Client.setCredentials(tokens);
    
    // Try to refresh tokens if needed
    const refreshed = await refreshTokensIfNeeded();
    if (refreshed) {
      console.log('Tokens refreshed successfully');
    }
    
    // Verify tokens are still valid by making a test call
    if (!hasValidTokens()) {
      console.log('Tokens invalid after refresh attempt');
      return res.status(401).json({ 
        error: 'Google Drive authentication expired. Please re-authenticate.',
        needsAuth: true 
      });
    }
    
    console.log('Google Drive authentication verified');
    next();
  } catch (error) {
    console.error('Error in Google Drive auth middleware:', error);
    return res.status(401).json({ 
      error: 'Google Drive authentication failed. Please re-authenticate.',
      needsAuth: true 
    });
  }
};

// Routes

// Login
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  const storedPassword = process.env.LOGIN_PASSWORD;
  
  if (!storedPassword) {
    return res.status(500).json({ error: 'Server configuration error' });
  }
  
  if (password === storedPassword) {
    req.session.authenticated = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Check authentication status
app.get('/api/auth/status', (req, res) => {
  const isAuthenticated = !!req.session.authenticated;
  const isGoogleDriveAuthenticated = hasValidTokens();
  
  console.log('Auth status check:', {
    sessionAuthenticated: isAuthenticated,
    googleDriveAuthenticated: isGoogleDriveAuthenticated,
    hasTokens: !!tokens
  });
  
  res.json({ 
    authenticated: isAuthenticated,
    googleDriveAuthenticated: isGoogleDriveAuthenticated
  });
});

// Google Drive OAuth routes
app.get('/auth/google', (req, res) => {
  console.log('Google OAuth route called');
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive'],
    prompt: 'consent'
  });
  
  console.log('Generated auth URL:', authUrl);
  res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
  try {
    console.log('OAuth callback received:', req.query);
    const { code } = req.query;
    
    if (!code) {
      console.log('No authorization code provided');
      return res.status(400).send('Authorization code not provided');
    }
    
    console.log('Exchanging code for tokens...');
    const { tokens: newTokens } = await oauth2Client.getToken(code);
    saveTokens(newTokens); // Save tokens persistently
    oauth2Client.setCredentials(newTokens);
    
    console.log('Tokens received and saved:', !!newTokens.access_token);
    
    // Different messages for production vs development
    const isProduction = process.env.NODE_ENV === 'production';
    const message = isProduction 
      ? `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
            <h2 style="color: #4CAF50;">Google Drive Authentication Successful!</h2>
            <p><strong>Important:</strong> To make this authentication permanent in production:</p>
            <ol>
              <li>Check your <strong>Render service logs</strong> for the GOOGLE_TOKENS environment variable</li>
              <li>Copy the entire token string from the logs</li>
              <li>Go to your <strong>Render Dashboard → Environment</strong></li>
              <li>Add a new environment variable named <strong>GOOGLE_TOKENS</strong></li>
              <li>Paste the token string as the value</li>
              <li><strong>Redeploy your service</strong></li>
            </ol>
            <p style="color: #ff6b6b;"><strong>Without this step, you'll need to re-authenticate after each deployment!</strong></p>
            <p>You can now close this window and return to the application.</p>
            <script>
              setTimeout(() => {
                window.close();
              }, 15000);
            </script>
          </body>
        </html>
      `
      : `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
            <h2 style="color: #4CAF50;">Google Drive Authentication Successful!</h2>
            <p>Your authentication has been saved locally. You can now close this window and return to the application.</p>
            <p><strong>You will never need to authenticate with Google again in development!</strong></p>
            <script>
              setTimeout(() => {
                window.close();
              }, 3000);
            </script>
          </body>
        </html>
      `;
    
    res.send(message);
  } catch (error) {
    console.error('Error during OAuth callback:', error);
    res.status(500).send('Authentication failed');
  }
});

// Check Google Drive authentication status
app.get('/api/google-drive/status', (req, res) => {
  res.json({ authenticated: hasValidTokens() });
});

// Clear Google Drive authentication (for testing or if tokens are corrupted)
app.post('/api/google-drive/clear', requireAuth, (req, res) => {
  try {
    saveTokens(null);
    console.log('Google Drive tokens cleared');
    res.json({ success: true, message: 'Google Drive authentication cleared' });
  } catch (error) {
    console.error('Error clearing tokens:', error);
    res.status(500).json({ error: 'Failed to clear authentication' });
  }
});

// Initialize Google Drive authentication on startup if tokens exist
const initializeGoogleAuth = async () => {
  if (hasValidTokens()) {
    try {
      oauth2Client.setCredentials(tokens);
      console.log('Google Drive authentication initialized successfully');
    } catch (error) {
      console.error('Error initializing Google Drive auth:', error);
      saveTokens(null);
    }
  } else {
    console.log('No Google Drive tokens found, authentication required');
  }
};

// List accessible folders (for debugging)
app.get('/api/folders/list', requireAuth, requireGoogleAuth, async (req, res) => {
  try {
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id,name,parents)',
      orderBy: 'name',
      pageSize: 50
    });
    
    const folders = response.data.files.map(folder => ({
      id: folder.id,
      name: folder.name,
      parents: folder.parents
    }));
    
    res.json(folders);
  } catch (error) {
    console.error('Error listing folders:', error);
    res.status(500).json({ error: 'Failed to list folders' });
  }
});

// Get files and folders
app.get('/api/files', requireAuth, requireGoogleAuth, async (req, res) => {
  try {
    const { folderId } = req.query;
    const targetFolderId = folderId && folderId.trim() !== '' ? folderId : process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    // Validate folder ID
    if (!targetFolderId || targetFolderId.trim() === '') {
      return res.status(400).json({ error: 'Google Drive folder ID not configured' });
    }
    
    const response = await drive.files.list({
      q: `'${targetFolderId}' in parents and trashed=false`,
      fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,parents)',
      orderBy: 'folder,name'
    });
    
    const files = response.data.files.map(file => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
      isFolder: file.mimeType === 'application/vnd.google-apps.folder',
      parents: file.parents
    }));
    
    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Initiate file upload and get resumable URL
// Proxied resumable upload
app.post('/api/upload/proxied', requireAuth, requireGoogleAuth, (req, res) => {
  try {
    const {
      'x-file-name': fileName,
      'x-file-type': fileType,
      'x-folder-id': folderId,
      'content-length': contentLength,
    } = req.headers;

    const targetFolderId = (folderId && typeof folderId === 'string' && folderId.trim() !== '') ? folderId : process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!fileName || !fileType || !contentLength) {
      return res.status(400).json({ error: 'File name, type, and content length are required in headers' });
    }

    if (!targetFolderId || targetFolderId.trim() === '') {
      return res.status(400).json({ error: 'Google Drive folder ID not configured' });
    }

    const fileMetadata = {
      name: Array.isArray(fileName) ? fileName[0] : fileName,
      parents: [targetFolderId],
    };

    const accessToken = oauth2Client.credentials.access_token;
    if (!accessToken) {
      return res.status(401).json({ error: 'Google Drive authentication is missing access token.' });
    }

    const https = require('https');

    // Step 1: Initiate Resumable Upload with Google Drive
    const initiateOptions = {
      method: 'POST',
      hostname: 'www.googleapis.com',
      path: '/upload/drive/v3/files?uploadType=resumable',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': fileType,
      },
    };

    const initiateRequest = https.request(initiateOptions, (initiateRes) => {
      if (initiateRes.statusCode === 200) {
        const uploadUrl = initiateRes.headers.location;
        if (uploadUrl) {
          // Step 2: Stream the file from the client to Google Drive
          const { host, pathname, search } = new URL(uploadUrl);
          const uploadOptions = {
            method: 'PUT',
            hostname: host,
            path: `${pathname}${search}`,
            headers: {
              'Content-Length': contentLength,
            },
          };

          const uploadRequest = https.request(uploadOptions, (uploadRes) => {
            let responseBody = '';
            uploadRes.on('data', (chunk) => {
              responseBody += chunk;
            });
            uploadRes.on('end', () => {
              if (uploadRes.statusCode === 200 || uploadRes.statusCode === 201) {
                try {
                  res.status(200).json(JSON.parse(responseBody));
                } catch (e) {
                  res.status(200).json({ success: true, data: responseBody });
                }
              } else {
                console.error(`Google Drive upload failed with status ${uploadRes.statusCode}:`, responseBody);
                res.status(uploadRes.statusCode).json({ error: 'Upload to Google Drive failed', details: responseBody });
              }
            });
          });

          uploadRequest.on('error', (error) => {
            console.error('Error streaming to Google Drive:', error);
            if (!res.headersSent) {
              res.status(500).json({ error: 'Failed to stream to Google Drive' });
            }
          });

          req.pipe(uploadRequest);

        } else {
          if (!res.headersSent) {
            res.status(500).json({ error: 'Could not get upload URL from Google' });
          }
        }
      } else {
        let errorData = '';
        initiateRes.on('data', (chunk) => {
          errorData += chunk;
        });
        initiateRes.on('end', () => {
          console.error(`Google Drive initiation failed with status ${initiateRes.statusCode}:`, errorData);
          if (!res.headersSent) {
            res.status(initiateRes.statusCode).json({ error: 'Failed to initiate upload with Google', details: errorData });
          }
        });
      }
    });

    initiateRequest.on('error', (error) => {
      console.error('Error making request to Google for upload initiation:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to make request to Google for upload initiation' });
      }
    });

    initiateRequest.write(JSON.stringify(fileMetadata));
    initiateRequest.end();

  } catch (error) {
    console.error('Error in proxied upload:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed in proxied upload' });
    }
  }
});

// Upload file
app.post('/api/upload', requireAuth, requireGoogleAuth, upload.single('file'), async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('File:', req.file ? req.file.originalname : 'No file');
    console.log('Body:', req.body);
    
    if (!req.file) {
      console.log('No file provided in request');
      return res.status(400).json({ error: 'No file provided' });
    }
    
    const { folderId } = req.body;
    const targetFolderId = folderId && folderId.trim() !== '' ? folderId : process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    console.log('Folder ID from request:', folderId);
    console.log('Environment folder ID:', process.env.GOOGLE_DRIVE_FOLDER_ID);
    console.log('Target folder ID:', targetFolderId);
    
    // Validate folder ID
    if (!targetFolderId || targetFolderId.trim() === '') {
      console.log('Folder ID validation failed');
      return res.status(400).json({ error: 'Google Drive folder ID not configured' });
    }
    
    // Test if folder exists
    try {
      console.log('Testing folder access for ID:', targetFolderId);
      const folderTest = await drive.files.get({
        fileId: targetFolderId,
        fields: 'id,name,mimeType'
      });
      console.log('Folder found:', folderTest.data);
    } catch (folderError) {
      console.error('Folder access error:', folderError.message);
      return res.status(400).json({ 
        error: `Folder not found or no access: ${folderError.message}. Please check your folder ID and permissions.` 
      });
    }
    
    const fileMetadata = {
      name: req.file.originalname,
      parents: [targetFolderId]
    };
    
    console.log('File metadata:', fileMetadata);
    console.log('File size:', req.file.size);
    console.log('File mimetype:', req.file.mimetype);
    
    // Convert buffer to stream for Google Drive API
    const { Readable } = require('stream');
    const stream = new Readable();
    stream.push(req.file.buffer);
    stream.push(null);
    
    const media = {
      mimeType: req.file.mimetype,
      body: stream
    };
    
    console.log('Uploading to Google Drive...');
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id,name,mimeType,size,createdTime'
    });
    
    console.log('Upload successful:', response.data);
    
    res.json({
      id: response.data.id,
      name: response.data.name,
      mimeType: response.data.mimeType,
      size: response.data.size,
      createdTime: response.data.createdTime
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Failed to upload file: ' + error.message });
  }
});

// Get shareable download link
app.get('/api/files/:fileId/share', requireAuth, requireGoogleAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Get file info
    const file = await drive.files.get({
      fileId: fileId,
      fields: 'name,mimeType,webViewLink,webContentLink'
    });
    
    // Generate a shareable link (you can customize this URL structure)
    const shareableLink = `${req.protocol}://${req.get('host')}/api/download/${fileId}`;
    
    res.json({
      id: fileId,
      name: file.data.name,
      mimeType: file.data.mimeType,
      shareableLink: shareableLink,
      webViewLink: file.data.webViewLink,
      webContentLink: file.data.webContentLink
    });
  } catch (error) {
    console.error('Error getting shareable link:', error);
    res.status(500).json({ error: 'Failed to get shareable link' });
  }
});

// Download folder as ZIP
app.get('/api/download/folder/:folderId', requireAuth, requireGoogleAuth, async (req, res) => {
  try {
    const { folderId } = req.params;
    
    // Get folder info
    const folder = await drive.files.get({
      fileId: folderId,
      fields: 'name,mimeType'
    });
    
    if (folder.data.mimeType !== 'application/vnd.google-apps.folder') {
      return res.status(400).json({ error: 'Not a folder' });
    }

    // Set headers for ZIP download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${folder.data.name}.zip"`);
    
    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    // Handle archive events
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      res.status(500).json({ error: 'Failed to create ZIP archive' });
    });
    
    // Pipe archive to response
    archive.pipe(res);
    
    // Recursively add files to archive
    const addFilesToArchive = async (folderId, folderPath = '') => {
      const response = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id,name,mimeType,parents)'
      });

      await Promise.all(response.data.files.map(async (file) => {
        const filePath = folderPath ? `${folderPath}/${file.name}` : file.name;
        if (file.mimeType === 'application/vnd.google-apps.folder') {
          await addFilesToArchive(file.id, filePath);
        } else {
          const fileResponse = await drive.files.get(
            { fileId: file.id, alt: 'media' },
            { responseType: 'stream' }
          );
          archive.append(fileResponse.data, { name: filePath });
        }
      }));
    };
    
    // Start adding files
    await addFilesToArchive(folderId);
    
    // Finalize the archive
    archive.finalize();
    
  } catch (error) {
    console.error('Error downloading folder:', error);
    res.status(500).json({ error: 'Failed to download folder' });
  }
});

// Download multiple files as a ZIP
app.get('/api/download/multiple', requireAuth, requireGoogleAuth, async (req, res) => {
  try {
    const { fileIds } = req.query;

    if (!fileIds) {
      return res.status(400).json({ error: 'File IDs are required' });
    }

    const fileIdsArray = fileIds.split(',');

    if (!Array.isArray(fileIdsArray) || fileIdsArray.length === 0) {
      return res.status(400).json({ error: 'File IDs are required' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="download.zip"');

    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(res);

    await Promise.all(fileIdsArray.map(async (fileId) => {
      const file = await drive.files.get({
        fileId: fileId,
        fields: 'name, mimeType'
      });

      if (file.data.mimeType !== 'application/vnd.google-apps.folder') {
        const fileStream = await drive.files.get(
          { fileId: fileId, alt: 'media' },
          { responseType: 'stream' }
        );
        archive.append(fileStream.data, { name: file.data.name });
      }
    }));

    archive.finalize();

  } catch (error) {
    console.error('Error downloading multiple files:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download files' });
    }
  }
});

// Get shareable download link for folder (ZIP)
app.get('/api/folders/:folderId/share', requireAuth, requireGoogleAuth, async (req, res) => {
  try {
    const { folderId } = req.params;
    
    // Get folder info
    const folder = await drive.files.get({
      fileId: folderId,
      fields: 'name,mimeType'
    });
    
    if (folder.data.mimeType !== 'application/vnd.google-apps.folder') {
      return res.status(400).json({ error: 'Not a folder' });
    }
    
    // Generate shareable ZIP download link
    const shareableLink = `${req.protocol}://${req.get('host')}/api/download/folder/${folderId}`;
    
    res.json({
      id: folderId,
      name: folder.data.name,
      mimeType: folder.data.mimeType,
      shareableLink: shareableLink,
      isFolder: true
    });
  } catch (error) {
    console.error('Error getting folder shareable link:', error);
    res.status(500).json({ error: 'Failed to get shareable link' });
  }
});

// Stream video file
// Stream video file with Range support
app.get('/api/stream/:fileId', requireAuth, requireGoogleAuth, async (req, res) => {
  try {
    const { fileId } = req.params;

    const fileMeta = await drive.files.get({
      fileId,
      fields: 'name,mimeType,size'
    });

    const mime = fileMeta.data.mimeType || 'application/octet-stream';
    const fileSize = parseInt(fileMeta.data.size || '0', 10);

    // Accept common video mime types
    const videoMimeTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv'];
    if (!videoMimeTypes.some(type => mime.includes(type))) {
      return res.status(400).json({ error: 'File is not a supported video' });
    }

    const rangeHeader = req.headers.range;
    if (!rangeHeader) {
      // No Range — return full file
      const response = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
      res.setHeader('Content-Type', mime);
      res.setHeader('Content-Length', fileSize);
      response.data.pipe(res);
      return;
    }

    // Parse range header: "bytes=start-end"
    const parts = rangeHeader.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + (1024 * 1024 * 10), fileSize - 1); // fallback chunk size 10MB

    if (isNaN(start) || start >= fileSize) {
      res.status(416).setHeader('Content-Range', `bytes */${fileSize}`);
      return res.end();
    }

    const finalEnd = Math.min(end, fileSize - 1);
    const chunkSize = (finalEnd - start) + 1;

    // Request partial content from Google Drive using Range header
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      {
        responseType: 'stream',
        headers: {
          Range: `bytes=${start}-${finalEnd}`
        }
      }
    );

    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${finalEnd}/${fileSize}`);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Length', chunkSize);
    res.setHeader('Content-Type', mime);

    response.data.pipe(res);
  } catch (error) {
    console.error('Error streaming video:', error);
    res.status(500).json({ error: 'Failed to stream video' });
  }
});


// View image file
app.get('/api/view/:fileId', requireAuth, requireGoogleAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const file = await drive.files.get({
      fileId: fileId,
      fields: 'name,mimeType'
    });
    
    // Check if it's an image file
    const imageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/svg+xml'];
    if (!imageMimeTypes.some(type => file.data.mimeType.includes(type))) {
      return res.status(400).json({ error: 'File is not an image' });
    }
    
    const response = await drive.files.get({
      fileId: fileId,
      alt: 'media'
    }, { responseType: 'stream' });
    
    res.setHeader('Content-Type', file.data.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    response.data.pipe(res);
  } catch (error) {
    console.error('Error viewing image:', error);
    res.status(500).json({ error: 'Failed to view image' });
  }
});

// Download file
app.get('/api/download/:fileId', requireAuth, requireGoogleAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const file = await drive.files.get({
      fileId: fileId,
      fields: 'name,mimeType,size'
    });
    
    const response = await drive.files.get({
      fileId: fileId,
      alt: 'media'
    }, { responseType: 'stream' });
    
    res.setHeader('Content-Disposition', `attachment; filename="${file.data.name}"`);
    res.setHeader('Content-Type', file.data.mimeType);
    res.setHeader('Content-Length', file.data.size);
    
    response.data.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Delete file/folder
app.delete('/api/files/:fileId', requireAuth, requireGoogleAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    await drive.files.delete({
      fileId: fileId
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Create folder
app.post('/api/folders', requireAuth, requireGoogleAuth, async (req, res) => {
  try {
    const { name, parentId } = req.body;
    const targetParentId = parentId && parentId.trim() !== '' ? parentId : process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    if (!name) {
      return res.status(400).json({ error: 'Folder name is required' });
    }
    
    // Validate parent folder ID
    if (!targetParentId || targetParentId.trim() === '') {
      return res.status(400).json({ error: 'Google Drive folder ID not configured' });
    }
    
    const fileMetadata = {
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [targetParentId]
    };
    
    const response = await drive.files.create({
      resource: fileMetadata,
      fields: 'id,name,mimeType,createdTime'
    });
    
    res.json({
      id: response.data.id,
      name: response.data.name,
      mimeType: response.data.mimeType,
      createdTime: response.data.createdTime,
      isFolder: true
    });
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Rename file/folder
app.patch('/api/files/:fileId/rename', requireAuth, requireGoogleAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { newName } = req.body;
    
    if (!newName || newName.trim() === '') {
      return res.status(400).json({ error: 'New name is required' });
    }
    
    // Rename file/folder
    await drive.files.update({
      fileId: fileId,
      resource: {
        name: newName.trim()
      },
      fields: 'id,name'
    });
    
    res.json({ success: true, newName: newName.trim() });
  } catch (error) {
    console.error('Error renaming file:', error);
    res.status(500).json({ error: 'Failed to rename file' });
  }
});

// Copy file/folder
app.post('/api/files/:fileId/copy', requireAuth, requireGoogleAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { destinationFolderId } = req.body;
    const targetFolderId = destinationFolderId && destinationFolderId.trim() !== '' ? destinationFolderId : process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    // Validate destination folder ID
    if (!targetFolderId || targetFolderId.trim() === '') {
      return res.status(400).json({ error: 'Destination folder ID not configured' });
    }
    
    // Get original file info
    const originalFile = await drive.files.get({
      fileId: fileId,
      fields: 'name,mimeType'
    });
    
    const originalName = originalFile.data.name;
    const lastDotIndex = originalName.lastIndexOf('.');
    let newName;
    if (lastDotIndex !== -1) {
      const name = originalName.substring(0, lastDotIndex);
      const extension = originalName.substring(lastDotIndex);
      newName = `${name} (Copy)${extension}`;
    } else {
      newName = `${originalName} (Copy)`;
    }

    // Copy file/folder
    const copyResponse = await drive.files.copy({
      fileId: fileId,
      resource: {
        name: newName,
        parents: [targetFolderId]
      },
      fields: 'id,name,mimeType,createdTime'
    });
    
    res.json({
      id: copyResponse.data.id,
      name: copyResponse.data.name,
      mimeType: copyResponse.data.mimeType,
      createdTime: copyResponse.data.createdTime,
      isFolder: copyResponse.data.mimeType === 'application/vnd.google-apps.folder'
    });
  } catch (error) {
    console.error('Error copying file:', error);
    res.status(500).json({ error: 'Failed to copy file' });
  }
});

// Move file/folder
app.patch('/api/files/:fileId/move', requireAuth, requireGoogleAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { newParentId } = req.body;
    
    if (!newParentId) {
      return res.status(400).json({ error: 'New parent ID is required' });
    }
    
    // Get current parents
    const file = await drive.files.get({
      fileId: fileId,
      fields: 'parents'
    });
    
    const previousParents = file.data.parents.join(',');
    
    // Move file
    await drive.files.update({
      fileId: fileId,
      addParents: newParentId,
      removeParents: previousParents,
      fields: 'id,parents'
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error moving file:', error);
    res.status(500).json({ error: 'Failed to move file' });
  }
});

// Get folder breadcrumb path
app.get('/api/folders/breadcrumb/:folderId', requireAuth, requireGoogleAuth, async (req, res) => {
  try {
    const { folderId } = req.params;
    const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    // Validate root folder ID
    if (!rootFolderId || rootFolderId.trim() === '') {
      return res.status(400).json({ error: 'Google Drive folder ID not configured' });
    }
    
    const breadcrumb = [];
    
    // If we're at root, return empty breadcrumb
    if (!folderId || folderId === rootFolderId) {
      return res.json([]);
    }
    
    // Build breadcrumb by traversing up the folder hierarchy
    let currentFolderId = folderId;
    const maxDepth = 10; // Prevent infinite loops
    let depth = 0;
    
    while (currentFolderId && currentFolderId !== rootFolderId && depth < maxDepth) {
      try {
        const folder = await drive.files.get({
          fileId: currentFolderId,
          fields: 'id,name,parents'
        });
        
        breadcrumb.unshift({
          id: folder.data.id,
          name: folder.data.name
        });
        
        // Move to parent folder
        currentFolderId = folder.data.parents && folder.data.parents[0];
        depth++;
      } catch (error) {
        console.error('Error getting folder info:', error);
        break;
      }
    }
    
    res.json(breadcrumb);
  } catch (error) {
    console.error('Error building breadcrumb:', error);
    res.status(500).json({ error: 'Failed to build breadcrumb' });
  }
});

// Get folder tree for navigation
app.get('/api/folders/tree', requireAuth, requireGoogleAuth, async (req, res) => {
  try {
    const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    // Validate root folder ID
    if (!rootFolderId || rootFolderId.trim() === '') {
      return res.status(400).json({ error: 'Google Drive folder ID not configured' });
    }
    
    const buildTree = async (folderId, depth = 0) => {
      if (depth > 5) return null; // Prevent infinite recursion
      
      const response = await drive.files.list({
        q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id,name,parents)',
        orderBy: 'name'
      });
      
      const folders = await Promise.all(
        response.data.files.map(async (folder) => ({
          id: folder.id,
          name: folder.name,
          children: await buildTree(folder.id, depth + 1)
        }))
      );
      
      return folders;
    };
    
    const tree = await buildTree(rootFolderId);
    res.json(tree);
  } catch (error) {
    console.error('Error building folder tree:', error);
    res.status(500).json({ error: 'Failed to build folder tree' });
  }
});

// Start server and initialize Google Drive authentication
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  await initializeGoogleAuth();
});