'use client'

import React from 'react'
import CircularProgress from './CircularProgress'

interface UploadProgressProps {
  fileName: string
  progress: number
  uploadedBytes: number
  totalBytes: number
  estimatedTimeRemaining: number
  uploadSpeed: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  errorMessage?: string
}

export default function UploadProgress({
  fileName,
  progress,
  uploadedBytes,
  totalBytes,
  estimatedTimeRemaining,
  uploadSpeed,
  status,
  errorMessage
}: UploadProgressProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatTime = (seconds: number) => {
    if (seconds === Infinity || isNaN(seconds)) return 'Calculating...'
    
    if (seconds < 60) {
      return `${Math.round(seconds)}s`
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = Math.round(seconds % 60)
      return `${minutes}m ${remainingSeconds}s`
    } else {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      return `${hours}h ${minutes}m`
    }
  }

  const formatSpeed = (bytesPerSecond: number) => {
    return `${formatBytes(bytesPerSecond)}/s`
  }

  const getStatusColor = () => {
    switch (status) {
      case 'uploading':
        return '#10B981' // Green
      case 'processing':
        return '#F59E0B' // Amber
      case 'completed':
        return '#10B981' // Green
      case 'error':
        return '#EF4444' // Red
      default:
        return '#10B981'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return 'Uploading...'
      case 'processing':
        return 'Processing...'
      case 'completed':
        return 'Completed'
      case 'error':
        return 'Error'
      default:
        return 'Uploading...'
    }
  }

  const getProgressBarColor = () => {
    switch (status) {
      case 'uploading':
        return 'bg-green-500'
      case 'processing':
        return 'bg-amber-500'
      case 'completed':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-green-500'
    }
  }

  return (
    <div className={`flex items-center space-x-4 p-4 rounded-lg border ${
      status === 'error' ? 'bg-red-50 border-red-200' : 
      status === 'completed' ? 'bg-green-50 border-green-200' :
      status === 'processing' ? 'bg-amber-50 border-amber-200' :
      'bg-gray-50 border-gray-200'
    }`}>
      {/* Circular Progress */}
      <div className="flex-shrink-0">
        <CircularProgress
          progress={status === 'processing' ? 100 : progress}
          size={80}
          strokeWidth={6}
          color={getStatusColor()}
          backgroundColor="#E5E7EB"
          showPercentage={false}
        >
          <div className="text-center">
            {status === 'processing' ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500 mx-auto"></div>
            ) : status === 'completed' ? (
              <div className="text-green-600 text-lg">✓</div>
            ) : status === 'error' ? (
              <div className="text-red-600 text-lg">✗</div>
            ) : (
              <div className="text-sm font-semibold text-gray-700">
                {Math.round(progress)}%
              </div>
            )}
          </div>
        </CircularProgress>
      </div>

      {/* Upload Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {fileName}
          </h4>
          <span className="text-sm text-gray-500">
            {status === 'processing' ? 'Processing...' : 
             status === 'completed' ? 'Complete' :
             status === 'error' ? 'Failed' :
             `${formatBytes(uploadedBytes)} / ${formatBytes(totalBytes)}`}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ease-out ${getProgressBarColor()}`}
            style={{ width: `${status === 'processing' ? 100 : progress}%` }}
          ></div>
        </div>

        {/* Upload Stats */}
        {status === 'error' ? (
          <div className="text-xs text-red-600">
            {errorMessage || 'Upload failed'}
          </div>
        ) : status === 'processing' ? (
          <div className="text-xs text-amber-600">
            Uploading to Google Drive...
          </div>
        ) : status === 'completed' ? (
          <div className="text-xs text-green-600">
            Successfully uploaded
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Speed: {formatSpeed(uploadSpeed)}</span>
            <span>ETA: {formatTime(estimatedTimeRemaining)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
