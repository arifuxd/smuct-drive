'use client'

import React from 'react'
import CircularProgress from './CircularProgress'
import { File, Check, X, Loader } from 'lucide-react'

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
    if (seconds === Infinity || isNaN(seconds) || seconds < 0) return '...'
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  const formatSpeed = (bytesPerSecond: number) => {
    return `${formatBytes(bytesPerSecond)}/s`
  }

  const getStatusInfo = () => {
    switch (status) {
      case 'uploading':
        return { color: '#3B82F6', icon: <div className="text-sm font-semibold">{Math.round(progress)}%</div>, text: 'Uploading...' };
      case 'processing':
        return { color: '#F59E0B', icon: <Loader className="animate-spin" />, text: 'Processing...' };
      case 'completed':
        return { color: '#10B981', icon: <Check />, text: 'Completed' };
      case 'error':
        return { color: '#EF4444', icon: <X />, text: 'Error' };
      default:
        return { color: '#6B7280', icon: null, text: '' };
    }
  }

  const { color, icon, text } = getStatusInfo();

  return (
    <div className={`p-4 rounded-lg border flex items-center gap-4 transition-all duration-300 ${
      status === 'error' ? 'bg-red-50 border-red-200' : 
      status === 'completed' ? 'bg-green-50 border-green-200' :
      'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex-shrink-0">
        <CircularProgress
          progress={status === 'processing' || status === 'completed' ? 100 : progress}
          size={60}
          strokeWidth={5}
          color={color}
          backgroundColor="#E5E7EB"
        >
          {icon}
        </CircularProgress>
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-800 truncate">{fileName}</div>
        
        {status === 'error' ? (
          <div className="text-sm text-red-600 truncate">{errorMessage}</div>
        ) : (
          <div className="text-sm text-gray-500">
            {status === 'completed' ? 
              `${formatBytes(totalBytes)} - Upload successful` :
              `${formatBytes(uploadedBytes)} / ${formatBytes(totalBytes)}`
            }
          </div>
        )}
      </div>

      <div className="flex-shrink-0 text-right">
        <div className="text-sm font-medium text-gray-800">{text}</div>
        {status === 'uploading' && (
          <div className="text-xs text-gray-500">
            {formatSpeed(uploadSpeed)} | {formatTime(estimatedTimeRemaining)} left
          </div>
        )}
      </div>
    </div>
  )
}