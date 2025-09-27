'use client'

import { useState, useEffect } from 'react'
import { Move, X, Folder, ChevronRight } from 'lucide-react'

interface FolderItem {
  id: string
  name: string
  children?: FolderItem[]
}

interface MoveFileProps {
  onClose: () => void
  onMove: () => void
  fileId: string
}

export default function MoveFile({ onClose, onMove, fileId }: MoveFileProps) {
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchFolderTree()
  }, [])

  const fetchFolderTree = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/folders/tree', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setFolders(data)
      }
    } catch (error) {
      console.error('Failed to fetch folder tree:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFolder) {
      setError('Please select a destination folder')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`http://localhost:5000/api/files/${fileId}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          newParentId: selectedFolder
        }),
      })

      if (response.ok) {
        onMove()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to move file')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }

  const renderFolderTree = (folders: FolderItem[], level = 0) => {
    return folders.map((folder) => (
      <div key={folder.id}>
        <div
          className={`flex items-center py-2 px-3 cursor-pointer hover:bg-gray-50 rounded ${
            selectedFolder === folder.id ? 'bg-primary-50 text-primary-600' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => setSelectedFolder(folder.id)}
        >
          {folder.children && folder.children.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFolder(folder.id)
              }}
              className="mr-2 p-1 hover:bg-gray-200 rounded"
            >
              <ChevronRight
                className={`h-4 w-4 transition-transform ${
                  expandedFolders.has(folder.id) ? 'rotate-90' : ''
                }`}
              />
            </button>
          )}
          <Folder className="h-4 w-4 mr-2 text-blue-500" />
          <span className="text-sm">{folder.name}</span>
        </div>
        {folder.children && expandedFolders.has(folder.id) && (
          <div>
            {renderFolderTree(folder.children, level + 1)}
          </div>
        )}
      </div>
    ))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Move File</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Destination Folder
            </label>
            <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
              {folders.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No folders available
                </div>
              ) : (
                renderFolderTree(folders)
              )}
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedFolder}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Moving...' : 'Move File'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
