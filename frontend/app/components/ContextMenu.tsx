'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Edit3, 
  Move, 
  Copy, 
  Download, 
  Link,
  Folder,
  File,
  Archive,
  Play,
  Eye
} from 'lucide-react'

interface ContextMenuProps {
  isVisible: boolean
  position: { x: number; y: number }
  file: {
    id: string
    name: string
    isFolder: boolean
  } | null
  onClose: () => void
  onRename: (fileId: string, currentName: string) => void
  onMove: (fileId: string) => void
  onCopy: (fileId: string) => void
  onDownload: (fileId: string, fileName: string) => void
  onCopyLink: (fileId: string, fileName: string) => void
  onDownloadFolder: (fileId: string, fileName: string) => void
  onCopyFolderLink: (fileId: string, fileName: string) => void
  onStreamVideo: (fileId: string, fileName: string) => void
  onViewImage: (fileId: string, fileName: string) => void
}

export default function ContextMenu({
  isVisible,
  position,
  file,
  onClose,
  onRename,
  onMove,
  onCopy,
  onDownload,
  onCopyLink,
  onDownloadFolder,
  onCopyFolderLink,
  onStreamVideo,
  onViewImage
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isVisible, onClose])

  if (!isVisible || !file) return null

  const isVideoFile = (fileName: string) => {
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv']
    return videoExtensions.some(ext => fileName.toLowerCase().endsWith(ext))
  }

  const isImageFile = (fileName: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg']
    return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext))
  }

  const menuItems = [
    {
      id: 'rename',
      icon: Edit3,
      label: 'Rename',
      action: () => onRename(file.id, file.name),
      show: true
    },
    {
      id: 'move',
      icon: Move,
      label: 'Move',
      action: () => onMove(file.id),
      show: true
    },
    {
      id: 'copy',
      icon: Copy,
      label: 'Copy',
      action: () => onCopy(file.id),
      show: true
    },
    {
      id: 'download',
      icon: Download,
      label: 'Download',
      action: () => onDownload(file.id, file.name),
      show: !file.isFolder
    },
    {
      id: 'downloadFolder',
      icon: Archive,
      label: 'Download as ZIP',
      action: () => onDownloadFolder(file.id, file.name),
      show: file.isFolder
    },
    {
      id: 'copyLink',
      icon: Link,
      label: 'Copy Link',
      action: () => onCopyLink(file.id, file.name),
      show: !file.isFolder
    },
    {
      id: 'copyFolderLink',
      icon: Link,
      label: 'Copy ZIP Link',
      action: () => onCopyFolderLink(file.id, file.name),
      show: file.isFolder
    },
    {
      id: 'streamVideo',
      icon: Play,
      label: 'Stream Video',
      action: () => onStreamVideo(file.id, file.name),
      show: !file.isFolder && isVideoFile(file.name)
    },
    {
      id: 'viewImage',
      icon: Eye,
      label: 'View Image',
      action: () => onViewImage(file.id, file.name),
      show: !file.isFolder && isImageFile(file.name)
    }
  ].filter(item => item.show)

  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[160px]"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -10px)'
      }}
    >
      <div className="px-3 py-2 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          {file.isFolder ? (
            <Folder className="h-4 w-4 text-blue-500" />
          ) : (
            <File className="h-4 w-4 text-gray-400" />
          )}
          <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
            {file.name}
          </span>
        </div>
      </div>
      
      <div className="py-1">
        {menuItems.map((item) => {
          const IconComponent = item.icon
          return (
            <button
              key={item.id}
              onClick={() => {
                item.action()
                onClose()
              }}
              className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <IconComponent className="h-4 w-4 text-gray-500" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
