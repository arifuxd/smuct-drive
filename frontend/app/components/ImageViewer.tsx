'use client'

import { useState, useRef, useEffect } from 'react'
import { X, ZoomIn, ZoomOut, RotateCw, Download, Maximize } from 'lucide-react'
import api from '../../lib/api'

interface ImageViewerProps {
  isVisible: boolean
  fileId: string
  fileName: string
  onClose: () => void
}

export default function ImageViewer({ isVisible, fileId, fileName, onClose }: ImageViewerProps) {
  const imageRef = useRef<HTMLImageElement>(null)
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (isVisible) {
      setScale(1)
      setRotation(0)
      setPosition({ x: 0, y: 0 })
    }
  }, [isVisible])

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 5))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.1))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleReset = () => {
    setScale(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }

  const handleDownload = () => {
    const link = document.createElement('a')
link.href = api.getUrl(`/api/download/${fileId}`)
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      handleZoomIn()
    } else {
      handleZoomOut()
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose()
        break
      case '+':
      case '=':
        handleZoomIn()
        break
      case '-':
        handleZoomOut()
        break
      case 'r':
      case 'R':
        handleRotate()
        break
      case '0':
        handleReset()
        break
    }
  }

  useEffect(() => {
    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors"
      >
        <X className="h-8 w-8" />
      </button>

      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex space-x-2">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70 transition-colors"
          title="Zoom In (+)"
        >
          <ZoomIn className="h-5 w-5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70 transition-colors"
          title="Zoom Out (-)"
        >
          <ZoomOut className="h-5 w-5" />
        </button>
        <button
          onClick={handleRotate}
          className="p-2 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70 transition-colors"
          title="Rotate (R)"
        >
          <RotateCw className="h-5 w-5" />
        </button>
        <button
          onClick={handleReset}
          className="p-2 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70 transition-colors"
          title="Reset (0)"
        >
          <Maximize className="h-5 w-5" />
        </button>
        <button
          onClick={handleDownload}
          className="p-2 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70 transition-colors"
          title="Download"
        >
          <Download className="h-5 w-5" />
        </button>
      </div>

      {/* Image container */}
      <div
        className="flex items-center justify-center w-full h-full overflow-hidden cursor-grab"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <img
          ref={imageRef}
src={api.getUrl(`/api/view/${fileId}`)}
          alt={fileName}
          className="max-w-full max-h-full object-contain select-none"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
          draggable={false}
        />
      </div>

      {/* Info overlay */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="bg-black bg-opacity-50 text-white p-3 rounded">
          <div className="flex justify-between items-center">
            <span className="font-medium">{fileName}</span>
            <span className="text-sm">
              {Math.round(scale * 100)}% • {rotation}°
            </span>
          </div>
          <div className="text-xs text-gray-300 mt-1">
            Use mouse wheel to zoom • Drag to pan • Press R to rotate • Press 0 to reset
          </div>
        </div>
      </div>
    </div>
  )
}
