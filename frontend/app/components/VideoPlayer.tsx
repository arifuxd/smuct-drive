'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react'

interface VideoPlayerProps {
  isVisible: boolean
  fileId: string
  fileName: string
  onClose: () => void
}

export default function VideoPlayer({ isVisible, fileId, fileName, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isVisible && videoRef.current) {
      videoRef.current.load()
    }
  }, [isVisible, fileId])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout)
      }
    }
  }, [controlsTimeout])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }
    
    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }
    
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)
    
    const handleCanPlay = () => {
      setDuration(video.duration)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
    }
  }, [isVisible, fileId])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return

    const newTime = parseFloat(e.target.value)
    video.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return

    const newVolume = parseFloat(e.target.value)
    video.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    if (isMuted) {
      video.volume = volume
      setIsMuted(false)
    } else {
      video.volume = 0
      setIsMuted(true)
    }
  }

  const toggleFullscreen = () => {
    const video = videoRef.current
    if (!video) return

    if (!isFullscreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  const resetVideo = () => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = 0
    setCurrentTime(0)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="relative w-full h-full max-w-6xl max-h-full">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors"
        >
          <X className="h-8 w-8" />
        </button>

        {/* Video element */}
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          onMouseMove={() => {
            setShowControls(true)
            if (controlsTimeout) {
              clearTimeout(controlsTimeout)
            }
            const timeout = setTimeout(() => {
              setShowControls(false)
            }, 3000)
            setControlsTimeout(timeout)
          }}
          onMouseLeave={() => {
            if (controlsTimeout) {
              clearTimeout(controlsTimeout)
            }
            const timeout = setTimeout(() => {
              setShowControls(false)
            }, 1000)
            setControlsTimeout(timeout)
          }}
          onClick={togglePlay}
        >
          <source src={`http://localhost:5000/api/stream/${fileId}`} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Controls overlay */}
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
          onMouseMove={() => {
            setShowControls(true)
            if (controlsTimeout) {
              clearTimeout(controlsTimeout)
            }
            const timeout = setTimeout(() => {
              setShowControls(false)
            }, 3000)
            setControlsTimeout(timeout)
          }}
          onMouseLeave={() => {
            if (controlsTimeout) {
              clearTimeout(controlsTimeout)
            }
            const timeout = setTimeout(() => {
              setShowControls(false)
            }, 1000)
            setControlsTimeout(timeout)
          }}
        >
          {/* Progress bar */}
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-4">
              <button
                onClick={togglePlay}
                className="hover:text-gray-300 transition-colors"
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </button>

              <button
                onClick={resetVideo}
                className="hover:text-gray-300 transition-colors"
              >
                <RotateCcw className="h-5 w-5" />
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="hover:text-gray-300 transition-colors"
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              <span className="text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">{fileName}</span>
              <button
                onClick={toggleFullscreen}
                className="hover:text-gray-300 transition-colors"
              >
                <Maximize className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
