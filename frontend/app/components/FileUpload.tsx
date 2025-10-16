'use client'

import { useState, useRef } from 'react'
import { Upload, X, File } from 'lucide-react'
import UploadProgress from './UploadProgress'
import api from '../../lib/api'
import axios from 'axios'

interface FileUploadProps {
  onClose: () => void
  onUpload: () => void
  currentFolder: string
}

interface UploadStatus {
  progress: number
  uploadedBytes: number
  totalBytes: number
  estimatedTimeRemaining: number
  uploadSpeed: number
  startTime: number
  lastUpdateTime: number
  lastUploadedBytes: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  errorMessage?: string
}

export default function FileUpload({ onClose, onUpload, currentFolder }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: UploadStatus }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get overall upload status
  const getOverallStatus = () => {
    const progressValues = Object.values(uploadProgress)
    if (progressValues.length === 0) return 'idle'
    
    const hasError = progressValues.some(p => p.status === 'error')
    const hasProcessing = progressValues.some(p => p.status === 'processing')
    const hasUploading = progressValues.some(p => p.status === 'uploading')
    const allCompleted = progressValues.every(p => p.status === 'completed')
    
    if (hasError) return 'error'
    if (hasProcessing) return 'processing'
    if (hasUploading) return 'uploading'
    if (allCompleted) return 'completed'
    return 'uploading'
  }

  const getButtonText = () => {
    const status = getOverallStatus()
    switch (status) {
      case 'uploading':
        return 'Uploading...'
      case 'processing':
        return 'Processing...'
      case 'completed':
        return 'Completed'
      case 'error':
        return 'Retry Upload'
      default:
        return 'Upload'
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles(prev => [...prev, ...selectedFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const retryUpload = () => {
    // Reset all error states to uploading
    const newProgress = { ...uploadProgress }
    Object.keys(newProgress).forEach(fileName => {
      if (newProgress[fileName].status === 'error') {
        newProgress[fileName] = {
          ...newProgress[fileName],
          status: 'uploading',
          progress: 0,
          uploadedBytes: 0,
          errorMessage: undefined
        }
      }
    })
    setUploadProgress(newProgress)
    handleUpload()
  }

// Replace the handleUpload function in FileUpload.tsx
const handleUpload = async () => {
  if (files.length === 0) return;

  setUploading(true);
  const newProgress = { ...uploadProgress };

  for (const file of files) {
    if (newProgress[file.name]?.status === 'completed') continue;

    const startTime = Date.now();
    newProgress[file.name] = {
      progress: 0,
      uploadedBytes: 0,
      totalBytes: file.size,
      estimatedTimeRemaining: 0,
      uploadSpeed: 0,
      startTime,
      lastUpdateTime: startTime,
      lastUploadedBytes: 0,
      status: 'uploading',
      errorMessage: undefined,
    };
  }
  setUploadProgress(newProgress);

  const uploadPromises = files.map(file => (
    new Promise<void>(async (resolve, reject) => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folderId', currentFolder);

        const response = await axios.post(api.getUrl('/api/upload'), formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
          timeout: 6000000, // 100 minitue timeout
          onUploadProgress: (progressEvent) => {
            const { loaded, total } = progressEvent;
            const progress = total ? (loaded / total) * 100 : 0;
            const currentTime = Date.now();
            const timeElapsed = (currentTime - newProgress[file.name].startTime) / 1000;
            const uploadSpeed = timeElapsed > 0 ? loaded / timeElapsed : 0;
            const remainingBytes = total ? total - loaded : 0;
            const estimatedTimeRemaining = uploadSpeed > 0 ? remainingBytes / uploadSpeed : 0;

            setUploadProgress(prev => ({
              ...prev,
              [file.name]: {
                ...prev[file.name],
                progress,
                uploadedBytes: loaded,
                totalBytes: total || file.size,
                uploadSpeed,
                estimatedTimeRemaining,
                status: progress === 100 ? 'processing' : 'uploading',
              },
            }));
          },
        });

        if (response.status === 200 || response.status === 201) {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { ...prev[file.name], status: 'completed', progress: 100 },
          }));
          resolve();
        } else {
          throw new Error(`Upload failed with status ${response.status}`);
        }
      } catch (error: any) {
        console.error(`Upload failed for ${file.name}:`, error);
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: {
            ...prev[file.name],
            status: 'error',
            errorMessage: error.response?.data?.error || error.message || 'Failed to upload',
          },
        }));
        reject(error);
      }
    })
  ));

  try {
    await Promise.all(uploadPromises);
    setTimeout(() => {
      onUpload();
      onClose();
    }, 2000);
  } catch (error) {
    console.error('One or more uploads failed');
  } finally {
    setUploading(false);
  }
};

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Upload Files</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600">
                Click to select files or drag and drop
              </p>
            </button>
          </div>

          {files.length > 0 && (
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">Selected Files:</h4>
                {uploading && (
                  <div className="text-xs text-gray-500">
                    {getOverallStatus() === 'uploading' && 'Uploading files...'}
                    {getOverallStatus() === 'processing' && 'Processing uploads...'}
                    {getOverallStatus() === 'completed' && 'Upload complete!'}
                    {getOverallStatus() === 'error' && 'Upload failed'}
                  </div>
                )}
              </div>
              {files.map((file, index) => {
                const progress = uploadProgress[file.name]
                return (
                  <div key={index}>
                    {uploading && progress ? (
                      <UploadProgress
                        fileName={file.name}
                        progress={progress.progress}
                        uploadedBytes={progress.uploadedBytes}
                        totalBytes={progress.totalBytes}
                        estimatedTimeRemaining={progress.estimatedTimeRemaining}
                        uploadSpeed={progress.uploadSpeed}
                        status={progress.status}
                        errorMessage={progress.errorMessage}
                      />
                    ) : (
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <File className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{file.name}</span>
                          <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-gray-400 hover:text-red-600"
                          disabled={uploading}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="btn-secondary"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              onClick={getOverallStatus() === 'error' ? retryUpload : handleUpload}
              disabled={files.length === 0 || (uploading && getOverallStatus() !== 'error')}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <div className="flex items-center space-x-2">
                  {getOverallStatus() === 'processing' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : getOverallStatus() === 'completed' ? (
                    <span className="text-green-200">✓</span>
                  ) : getOverallStatus() === 'error' ? (
                    <span className="text-red-200">✗</span>
                  ) : (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>{getButtonText()}</span>
                </div>
              ) : (
                'Upload'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
