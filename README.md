# SMUCT Drive

A simple full-stack file manager application with Google Drive integration, built with Node.js (Express) backend and Next.js frontend.

## Features

- **Simple Authentication**: Single password-based login
- **File Management**: Upload, download, delete, and organize files
- **Folder Operations**: Create folders and move files between folders
- **Google Drive Integration**: All files are stored in Google Drive using service account
- **Clean UI**: Modern interface built with Tailwind CSS
- **Real-time Updates**: File operations update the interface immediately

## Tech Stack

### Backend

- Node.js with Express
- Google Drive API v3
- Express Session for authentication
- Multer for file uploads

### Frontend

- Next.js 14 with App Router
- React 18
- Tailwind CSS for styling
- Lucide React for icons
- Axios for API calls

## Setup Instructions

### 1. Install Dependencies

```bash
# Install all dependencies (root, backend, and frontend)
npm run install:all
```

### 2. Google Drive API Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URI: `http://localhost:5000/auth/google/callback`
   - Download the JSON file or copy the Client ID and Client Secret
5. Create a folder in Google Drive where files will be stored
6. Get the folder ID from the URL (the long string after `/folders/`)

### 3. Environment Configuration

Create a `.env` file in the `backend` directory:

```env
PORT=5000
LOGIN_PASSWORD=your_plain_text_password_here
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_DRIVE_FOLDER_ID=your_folder_id_here
SESSION_SECRET=your_session_secret_here
```

**Important Notes:**

- Replace `your_plain_text_password_here` with your desired password
- Copy the Client ID and Client Secret from your OAuth 2.0 credentials
- Use the folder ID from your Google Drive folder
- Generate a random session secret for security

### 4. Set Your Password

Simply replace `your_plain_text_password_here` in the `.env` file with your desired password. The password is stored in plain text for simplicity.

### 5. Run the Application

```bash
# Start both backend and frontend in development mode
npm run dev
```

This will start:

- Backend server on http://localhost:5000
- Frontend application on http://localhost:3000

## Usage

1. Open http://localhost:3000 in your browser
2. Enter the password you set in the `.env` file
3. You'll be redirected to Google OAuth to authorize access to your Google Drive
4. After authorization, use the file manager to:
   - Upload files by clicking the "Upload" button
   - Create folders with the "New Folder" button
   - Navigate folders by clicking on them
   - Download files using the download icon
   - Move files using the move icon
   - Delete files using the trash icon
   - Search files using the search bar

## API Endpoints

### Authentication

- `POST /api/login` - Login with password
- `POST /api/logout` - Logout
- `GET /api/auth/status` - Check authentication status

### Files

- `GET /api/files` - List files and folders
- `POST /api/upload` - Upload file
- `GET /api/download/:fileId` - Download file
- `DELETE /api/files/:fileId` - Delete file/folder
- `PATCH /api/files/:fileId/move` - Move file/folder

### Folders

- `POST /api/folders` - Create folder
- `GET /api/folders/tree` - Get folder tree

## Project Structure

```
smuct-drive/
├── backend/
│   ├── server.js          # Express server
│   ├── package.json       # Backend dependencies
│   └── .env              # Environment variables
├── frontend/
│   ├── app/
│   │   ├── components/    # React components
│   │   ├── globals.css    # Global styles
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Main page
│   ├── package.json       # Frontend dependencies
│   └── tailwind.config.js # Tailwind configuration
├── package.json           # Root package.json
└── README.md             # This file
```

## Security Notes

- The application uses session-based authentication
- File uploads are limited to 100MB
- CORS is configured for localhost:3000 only
- Service account credentials should be kept secure

## Troubleshooting

### Common Issues

1. **Google Drive API errors**: Ensure the service account has access to the folder and the API is enabled
2. **File upload failures**: Check file size limits and network connectivity
3. **Authentication issues**: Verify the password in the `.env` file matches what you're entering
4. **CORS errors**: Make sure the frontend is running on localhost:3000

### Development Tips

- Use browser developer tools to check network requests
- Check the backend console for error messages
- Verify environment variables are loaded correctly
- Test Google Drive API access independently if needed

## License

This project is for educational purposes. Please ensure you comply with Google Drive API terms of service when using this application.
