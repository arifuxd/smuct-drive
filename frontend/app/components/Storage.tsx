'use client'

import { useState, useEffect } from 'react'
import api from '../../lib/api'

interface StorageQuota {
  limit: number
  usage: number
  usageInDrive: number
  usageInDriveTrash: number
}

export default function Storage() {
  const [storage, setStorage] = useState<StorageQuota | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStorage = async () => {
      try {
        setLoading(true)
        const response = await fetch(api.getUrl('/api/storage'), {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          setStorage(data)
        }
      } catch (error) {
        console.error('Error fetching storage:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStorage()
  }, [])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-gray-200 rounded-full h-4 w-full"></div>
      </div>
    )
  }

  if (!storage) {
    return null
  }

  const { limit, usage } = storage
  const percentage = limit > 0 ? (usage / limit) * 100 : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="text-sm">
        {formatBytes(usage)} of {formatBytes(limit)} used
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div 
          className="bg-blue-600 h-2.5 rounded-full" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  )
}
