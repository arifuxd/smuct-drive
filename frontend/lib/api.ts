// API configuration for SMUCT Drive
// Handles environment-based API URLs

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = {
  baseURL: API_BASE_URL,

  // Helper function to get full API URL
  getUrl: (endpoint: string) => {
    return `${API_BASE_URL}${endpoint}`;
  },

  // Common API endpoints
  endpoints: {
    auth: {
      status: '/api/auth/status',
      login: '/auth/google',
      logout: '/api/auth/logout',
      callback: '/auth/google/callback'
    },
    files: {
      list: '/api/files',
      upload: '/api/upload',
      download: '/api/download',
      delete: '/api/files',
      rename: '/api/files',
      copy: '/api/files',
      share: '/api/files',
      move: '/api/files/move'
    },
    folders: {
      create: '/api/folders',
      breadcrumb: '/api/folders/breadcrumb',
      share: '/api/folders',
      download: '/api/download/folder'
    },
    stream: '/api/stream',
    view: '/api/view',
    health: '/api/health',
    storage: '/api/storage'
  }
};

export default api;
