'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LoginForm from './components/LoginForm'
import FileManager from './components/FileManager'
import api from '../lib/api'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isGoogleDriveAuthenticated, setIsGoogleDriveAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authMessage, setAuthMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(api.getUrl('/api/auth/status'), {
        credentials: 'include'
      })
      const data = await response.json()
      setIsAuthenticated(data.authenticated)
      setIsGoogleDriveAuthenticated(data.googleDriveAuthenticated)
      
      if (data.authenticated && !data.googleDriveAuthenticated) {
        setAuthMessage('Google Drive authentication required. Redirecting...')
        // Small delay to show message before redirect
        setTimeout(() => {
          window.location.href = api.getUrl('/auth/google')
        }, 1500)
      } else if (data.authenticated && data.googleDriveAuthenticated) {
        setAuthMessage('')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setAuthMessage('Authentication check failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    setIsAuthenticated(true)
    setAuthMessage('Checking Google Drive authentication...')
    
    // Check Google Drive authentication after login
    try {
      const response = await fetch(api.getUrl('/api/auth/status'), {
        credentials: 'include'
      })
      const data = await response.json()
      
      setIsGoogleDriveAuthenticated(data.googleDriveAuthenticated)
      
      if (!data.googleDriveAuthenticated) {
        setAuthMessage('Google Drive authentication required. Redirecting...')
        setTimeout(() => {
          window.location.href = api.getUrl('/auth/google')
        }, 1500)
      } else {
        setAuthMessage('')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setAuthMessage('Authentication check failed. Please try again.')
    }
  }

  const handleLogout = async () => {
    try {
      await fetch(api.getUrl('/api/logout'), {
        method: 'POST',
        credentials: 'include'
      })
      setIsAuthenticated(false)
      setIsGoogleDriveAuthenticated(false)
      setAuthMessage('')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen">
      {authMessage && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-blue-700">{authMessage}</p>
            </div>
          </div>
        </div>
      )}
      
      {isAuthenticated && isGoogleDriveAuthenticated ? (
        <FileManager onLogout={handleLogout} />
      ) : (
        <LoginForm onLogin={handleLogin} />
      )}
    </main>
  )
}
