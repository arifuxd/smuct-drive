'use client'

import { useState, useEffect } from 'react'
import { 
  Upload, 
  FolderPlus, 
  LogOut, 
  File, 
  Folder, 
  Download, 
  Trash2, 
  Move,
  RefreshCw,
  Search,
  ArrowLeft,
  Copy,
  Home,
} from 'lucide-react'
import FileUpload from './FileUpload'
import CreateFolder from './CreateFolder'
import MoveFile from './MoveFile'
import CopyFile from './CopyFile'
import ContextMenu from './ContextMenu'
import RenameDialog from './RenameDialog'
import VideoPlayer from './VideoPlayer'
import ImageViewer from './ImageViewer'
import api from '../../lib/api'



interface FileItem {
  id: string
  name: string
  mimeType: string
  size?: string
  createdTime: string
  modifiedTime: string
  isFolder: boolean
  parents: string[]
}

interface BreadcrumbItem {
  id: string
  name: string
}

interface FileManagerProps {
  onLogout: () => void
}

export default function FileManager({ onLogout }: FileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentFolder, setCurrentFolder] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [showUpload, setShowUpload] = useState(false)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showMoveFile, setShowMoveFile] = useState(false)
  const [showCopyFile, setShowCopyFile] = useState(false)

  const [authError, setAuthError] = useState<string>('')
  const [needsReauth, setNeedsReauth] = useState(false)
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([])
  const [folderHistory, setFolderHistory] = useState<string[]>([])
  const [contextMenu, setContextMenu] = useState<{
    isVisible: boolean
    position: { x: number; y: number }
    file: { id: string; name: string; isFolder: boolean } | null
  }>({
    isVisible: false,
    position: { x: 0, y: 0 },
    file: null
  })
  const [renameDialog, setRenameDialog] = useState<{
    isVisible: boolean
    fileId: string
    currentName: string
  }>({
    isVisible: false,
    fileId: '',
    currentName: ''
  })
  const [videoPlayer, setVideoPlayer] = useState<{
    isVisible: boolean
    fileId: string
    fileName: string
  }>({
    isVisible: false,
    fileId: '',
    fileName: ''
  })
  const [imageViewer, setImageViewer] = useState<{
    isVisible: boolean
    fileId: string
    fileName: string
  }>({
    isVisible: false,
    fileId: '',
    fileName: ''
  })

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const folderParam = urlParams.get('folder')
    if (folderParam !== null) {
      setCurrentFolder(folderParam)
    }
  }, [])

  useEffect(() => {
    fetchFiles()
    fetchBreadcrumb()
  }, [currentFolder])

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.folderId !== undefined) {
        setCurrentFolder(event.state.folderId)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const fetchFiles = async () => {
    try {
      setLoading(true)
      setAuthError('')
      setNeedsReauth(false)
      
      const response = await fetch(`${api.getUrl('/api/files')}?folderId=${currentFolder}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setFiles(data)
      } else {
        const errorData = await response.json()
        console.error('Failed to fetch files:', errorData)
        
        if (errorData.needsAuth) {
          setAuthError(errorData.error)
          setNeedsReauth(true)
        } else {
          setAuthError('Failed to fetch files. Please try again.')
        }
      }
    } catch (error) {
      console.error('Error fetching files:', error)
      setAuthError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const fetchBreadcrumb = async () => {
    try {
      if (!currentFolder) {
        setBreadcrumb([])
        return
      }
      
      const response = await fetch(`${api.getUrl('/api/folders/breadcrumb')}/${currentFolder}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setBreadcrumb(data)
      }
    } catch (error) {
      console.error('Error fetching breadcrumb:', error)
    }
  }

  const handleReauth = () => {
    window.location.href = api.getUrl('/auth/google')
  }

  const handleFileUpload = () => {
    fetchFiles()
    setShowUpload(false)
  }

  const handleCreateFolder = () => {
    fetchFiles()
    setShowCreateFolder(false)
  }

  const handleMoveFile = () => {
    fetchFiles()
    setShowMoveFile(false)
    setSelectedFiles([])
  }

  const handleCopyFile = () => {
    fetchFiles()
    setShowCopyFile(false)
    setSelectedFiles([])
  }

  const handleDownload = (fileId: string, fileName: string) => {
    const url = `${api.getUrl('/api/download')}/${fileId}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const response = await fetch(`${api.getUrl('/api/files')}/${fileId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        fetchFiles()
      } else {
        console.error('Delete failed')
      }
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  const handleCopyLink = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(`${api.getUrl('/api/files')}/${fileId}/share`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        await navigator.clipboard.writeText(data.shareableLink)
        alert(`Download link copied to clipboard!\n\nFile: ${fileName}\nLink: ${data.shareableLink}`)
      } else {
        const errorData = await response.json()
        alert(`Failed to get shareable link: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error copying link:', error)
      alert('Failed to copy link. Please try again.')
    }
  }

  const navigateToFolder = (folderId: string) => {
    if (currentFolder !== folderId) {
      setFolderHistory(prev => [...prev, currentFolder])
      window.history.pushState({ folderId }, '', `?folder=${folderId}`)
      setCurrentFolder(folderId)
    }
  }

  const goBack = () => {
    if (folderHistory.length > 0) {
      const previousFolder = folderHistory[folderHistory.length - 1]
      setFolderHistory(prev => prev.slice(0, -1))
      window.history.pushState({ folderId: previousFolder }, '', `?folder=${previousFolder}`)
      setCurrentFolder(previousFolder)
    }
  }

  const goToRoot = () => {
    setFolderHistory([])
    window.history.pushState({ folderId: '' }, '', '?folder=')
    setCurrentFolder('')
  }

  const handleContextMenu = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault()
    e.stopPropagation()
    
    setContextMenu({
      isVisible: true,
      position: { x: e.clientX, y: e.clientY },
      file: {
        id: file.id,
        name: file.name,
        isFolder: file.isFolder
      }
    })
  }

  const closeContextMenu = () => {
    setContextMenu({
      isVisible: false,
      position: { x: 0, y: 0 },
      file: null
    })
  }

  const handleRename = async (fileId: string, newName: string) => {
    try {
      const response = await fetch(`${api.getUrl('/api/files')}/${fileId}/rename`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ newName }),
      })

      if (response.ok) {
        fetchFiles()
      } else {
        const errorData = await response.json()
        alert(`Failed to rename: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Rename error:', error)
      alert('Failed to rename file. Please try again.')
    }
  }

  const handleCopy = (fileId: string) => {
    setSelectedFiles([fileId]);
    setShowCopyFile(true);
  }

  const handleDownloadFolder = (fileId: string, fileName: string) => {
    const url = `${api.getUrl('/api/download/folder')}/${fileId}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyFolderLink = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(`${api.getUrl('/api/folders')}/${fileId}/share`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        await navigator.clipboard.writeText(data.shareableLink)
        alert(`ZIP download link copied to clipboard!\n\nFolder: ${fileName}\nLink: ${data.shareableLink}`)
      } else {
        const errorData = await response.json()
        alert(`Failed to get shareable link: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error copying folder link:', error)
      alert('Failed to copy link. Please try again.')
    }
  }

  const handleStreamVideo = (fileId: string, fileName: string) => {
    setVideoPlayer({ isVisible: true, fileId, fileName })
  }

  const handleViewImage = (fileId: string, fileName: string) => {
    setImageViewer({ isVisible: true, fileId, fileName })
  }

  const handleDoubleClick = (file: FileItem) => {
    if (file.isFolder) {
      navigateToFolder(file.id)
    } else {
      const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv']
      const isVideo = videoExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
      
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg']
      const isImage = imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
      
      if (isVideo) {
        handleStreamVideo(file.id, file.name)
      } else if (isImage) {
        handleViewImage(file.id, file.name)
      } else {
        handleDownload(file.id, file.name)
      }
    }
  }

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return 'N/A'
    const size = parseInt(bytes)
    if (size === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(size) / Math.log(k))
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();

    const isToday = date.getDate() === today.getDate() &&
                  date.getMonth() === today.getMonth() &&
                  date.getFullYear() === today.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedFiles(filteredFiles.map(f => f.id));
    } else {
      setSelectedFiles([]);
    }
  };

  const handleToggleSelect = (fileId: string) => {
    if (selectedFiles.includes(fileId)) {
      setSelectedFiles(selectedFiles.filter(id => id !== fileId));
    } else {
      setSelectedFiles([...selectedFiles, fileId]);
    }
  };

  const handleDeleteMultiple = async () => {
    if (confirm(`Are you sure you want to delete ${selectedFiles.length} selected files?`)) {
      await Promise.all(selectedFiles.map(fileId =>
        fetch(`${api.getUrl('/api/files')}/${fileId}`, {
          method: 'DELETE',
          credentials: 'include'
        })
      ));
      fetchFiles();
      setSelectedFiles([]);
    }
  };

  const handleCopyMultiple = () => {
    if (selectedFiles.length > 0) {
      setShowCopyFile(true);
    }
  };

  const handleMoveMultiple = () => {
    if (selectedFiles.length > 0) {
      setShowMoveFile(true);
    }
  };

  const handleDownloadMultiple = () => {
    const fileIds = selectedFiles.join(',');
    const url = `${api.getUrl('/api/download/multiple')}?fileIds=${fileIds}`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'download.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setSelectedFiles([]);
  };

  return (
    <div 
      className="min-h-screen bg-gray-50"
      onClick={closeContextMenu}
    >
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">SMUCT Drive</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchFiles}
                className="p-2 text-gray-400 hover:text-gray-600"
                title="Refresh"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {authError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{authError}</p>
              {needsReauth && (
                <button
                  onClick={handleReauth}
                  className="mt-2 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Re-authenticate with Google Drive
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={goToRoot}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
            >
              <Home className="h-4 w-4" />
              <span className="text-sm">Root</span>
            </button>
            
            {breadcrumb.map((item, index) => (
              <div key={item.id} className="flex items-center space-x-2">
                <span className="text-gray-400">/</span>
                <button
                  onClick={() => navigateToFolder(item.id)}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {item.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <button
                onClick={goBack}
                disabled={folderHistory.length === 0}
                className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Go back to previous folder"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              
              <button
                onClick={() => setShowUpload(true)}
                className="btn-primary flex items-center space-x-2"
                disabled={needsReauth}
              >
                <Upload className="h-4 w-4" />
                <span>Upload</span>
              </button>
              
              <button
                onClick={() => setShowCreateFolder(true)}
                className="btn-secondary flex items-center space-x-2"
                disabled={needsReauth}
              >
                <FolderPlus className="h-4 w-4" />
                <span>New Folder</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
        {selectedFiles.length > 0 && (
          <div className="bg-gray-100 border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={handleMoveMultiple} className="btn-secondary text-xs px-2 py-1">Move</button>
                  <button onClick={handleCopyMultiple} className="btn-secondary text-xs px-2 py-1">Copy</button>
                  <button onClick={handleDownloadMultiple} className="btn-secondary text-xs px-2 py-1">Download</button>
                  <button onClick={handleDeleteMultiple} className="btn-danger text-xs px-2 py-1">Delete</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <File className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No files</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'No files match your search.' : 'Get started by uploading a file.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 w-4">
                      <input
                        type="checkbox"
                        onChange={handleToggleSelectAll}
                        checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modified
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFiles.map((file) => (
                    <tr 
                      key={file.id} 
                      className={`hover:bg-gray-50 cursor-pointer ${selectedFiles.includes(file.id) ? 'bg-blue-50' : ''}`}
                      onContextMenu={(e) => handleContextMenu(e, file)}
                      onDoubleClick={() => handleDoubleClick(file)}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file.id)}
                          onChange={() => handleToggleSelect(file.id)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {file.isFolder ? (
                            <Folder className="h-5 w-5 text-blue-500 mr-3" />
                          ) : (
                            <File className="h-5 w-5 text-gray-400 mr-3" />
                          )}
                          <button
                            onClick={() => file.isFolder && navigateToFolder(file.id)}
                            className={`text-sm font-medium ${file.isFolder 
                                ? 'text-blue-600 hover:text-blue-800 cursor-pointer' 
                                : 'text-gray-900'}`}
                          >
                            {file.name}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {file.isFolder ? '—' : formatFileSize(file.size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(file.modifiedTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {!file.isFolder && (
                            <>
                              <button
                                onClick={() => handleDownload(file.id, file.name)}
                                className="text-gray-400 hover:text-gray-600"
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              
                              <button
                                onClick={() => handleCopyLink(file.id, file.name)}
                                className="text-gray-400 hover:text-blue-600"
                                title="Copy download link"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          
                          <button
                            onClick={() => {
                              setSelectedFiles([file.id]);
                              setShowMoveFile(true);
                            }}
                            className="text-gray-400 hover:text-gray-600"
                            title="Move"
                          >
                            <Move className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDelete(file.id)}
                            className="text-gray-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showUpload && (
        <FileUpload
          onClose={() => setShowUpload(false)}
          onUpload={handleFileUpload}
          currentFolder={currentFolder}
        />
      )}
      
      {showCreateFolder && (
        <CreateFolder
          onClose={() => setShowCreateFolder(false)}
          onCreate={handleCreateFolder}
          currentFolder={currentFolder}
        />
      )}

      {showMoveFile && (
        <MoveFile
          onClose={() => setShowMoveFile(false)}
          onMove={handleMoveFile}
          fileIds={selectedFiles}
        />
      )}

      {showCopyFile && (
        <CopyFile
          onClose={() => setShowCopyFile(false)}
          onCopy={handleCopyFile}
          fileIds={selectedFiles}
        />
      )}

      {/* Context Menu */}
      <ContextMenu
        isVisible={contextMenu.isVisible}
        position={contextMenu.position}
        file={contextMenu.file}
        onClose={closeContextMenu}
        onRename={(fileId, currentName) => {
          setRenameDialog({
            isVisible: true,
            fileId,
            currentName
          })
        }}
        onMove={(fileId) => {
          setSelectedFiles([fileId]);
          setShowMoveFile(true);
        }}
        onCopy={handleCopy}
        onDownload={handleDownload}
        onCopyLink={handleCopyLink}
        onDownloadFolder={handleDownloadFolder}
        onCopyFolderLink={handleCopyFolderLink}
        onStreamVideo={handleStreamVideo}
        onViewImage={handleViewImage}
      />

      <RenameDialog
        isVisible={renameDialog.isVisible}
        currentName={renameDialog.currentName}
        fileId={renameDialog.fileId}
        onClose={() => setRenameDialog({ isVisible: false, fileId: '', currentName: '' })}
        onRename={handleRename}
      />

      <VideoPlayer
        isVisible={videoPlayer.isVisible}
        fileId={videoPlayer.fileId}
        fileName={videoPlayer.fileName}
        onClose={() => setVideoPlayer({ isVisible: false, fileId: '', fileName: '' })}
      />

      <ImageViewer
        isVisible={imageViewer.isVisible}
        fileId={imageViewer.fileId}
        fileName={imageViewer.fileName}
        onClose={() => setImageViewer({ isVisible: false, fileId: '', fileName: '' })}
      />
    </div>
  )
}
