'use client'

import { useState } from 'react'
import { FolderPlus, X } from 'lucide-react'

interface CreateFolderProps {
  onClose: () => void
  onCreate: () => void
  currentFolder: string
}

export default function CreateFolder({ onClose, onCreate, currentFolder }: CreateFolderProps) {
  const [folderName, setFolderName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!folderName.trim()) {
      setError('Folder name is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:5000/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: folderName.trim(),
          parentId: currentFolder
        }),
      })

      if (response.ok) {
        onCreate()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create folder')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Create New Folder</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="folderName" className="block text-sm font-medium text-gray-700 mb-2">
              Folder Name
            </label>
            <div className="relative">
              <FolderPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="folderName"
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="pl-10 input-field"
                placeholder="Enter folder name"
                autoFocus
              />
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
              disabled={loading || !folderName.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
