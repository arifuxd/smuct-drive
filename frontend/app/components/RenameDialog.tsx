'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Edit3 } from 'lucide-react'

interface RenameDialogProps {
  isVisible: boolean
  currentName: string
  fileId: string
  onClose: () => void
  onRename: (fileId: string, newName: string) => void
}

export default function RenameDialog({
  isVisible,
  currentName,
  fileId,
  onClose,
  onRename
}: RenameDialogProps) {
  const [name, setName] = useState('');
  const [extension, setExtension] = useState('');
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const lastDotIndex = currentName.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      setName(currentName.substring(0, lastDotIndex));
      setExtension(currentName.substring(lastDotIndex));
    } else {
      setName(currentName);
      setExtension('');
    }
  }, [currentName]);

  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus()
      // Select only the name part without the extension
      const nameWithoutExtension = currentName.lastIndexOf('.') !== -1 
        ? currentName.substring(0, currentName.lastIndexOf('.'))
        : currentName;
      inputRef.current.setSelectionRange(0, nameWithoutExtension.length);
    }
  }, [isVisible, currentName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newFullName = name.trim() + extension;
    if (name.trim() === '' || newFullName === currentName) {
      onClose()
      return
    }

    setLoading(true)
    try {
      await onRename(fileId, newFullName)
      onClose()
    } catch (error) {
      console.error('Rename failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Edit3 className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">Rename</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="newName" className="block text-sm font-medium text-gray-700 mb-2">
              New name
            </label>
            <div className="flex items-center">
              <input
                ref={inputRef}
                id="newName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter new name"
                disabled={loading}
              />
              {extension && (
                <span className="px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 rounded-r-lg">
                  {extension}
                </span>
              )}
            </div>
          </div>

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
              disabled={loading || name.trim() === '' || (name.trim() + extension) === currentName}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Renaming...' : 'Rename'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}