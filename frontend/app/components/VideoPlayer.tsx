'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Play, Pause, Volume2, VolumeX, Maximize, FastForward, Rewind } from 'lucide-react'
import api from '../../lib/api'

interface VideoPlayerProps {
  isVisible: boolean
  fileId: string
  fileName: string
  onClose: () => void
}

export default function VideoPlayer({ isVisible, fileId, fileName, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null)
  const [buffered, setBuffered] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isVisible && videoRef.current) {
      videoRef.current.load()
    }
  }, [isVisible, fileId])

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
      setIsLoading(false)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1))
      }
    }

    const handleWaiting = () => {
      setIsLoading(true)
    }

    const handleCanPlay = () => {
      setIsLoading(false)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('progress', handleProgress)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('canplay', handleCanPlay)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('progress', handleProgress)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('canplay', handleCanPlay)
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

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    const progress = progressRef.current
    if (!video || !progress) return

    const rect = progress.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    const newTime = pos * duration
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
    const videoContainer = videoRef.current?.parentElement
    if (!videoContainer) return

    if (!document.fullscreenElement) {
      videoContainer.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const skipTime = (time: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime += time
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeout) {
      clearTimeout(controlsTimeout)
    }
    const timeout = setTimeout(() => {
      setShowControls(false)
    }, 3000)
    setControlsTimeout(timeout)
  }

  const handleMouseLeave = () => {
    if (controlsTimeout) {
      clearTimeout(controlsTimeout)
    }
    const timeout = setTimeout(() => {
      setShowControls(false)
    }, 1000)
    setControlsTimeout(timeout)
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <div className="relative w-full h-full max-w-6xl max-h-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-white hover:text-gray-300 transition-colors"
        >
          <X className="h-7 w-7" />
        </button>

        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          onClick={togglePlay}
          autoPlay
          playsInline
        >
          <source src={api.getUrl(`/api/stream/${fileId}`)} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}

        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
        >
          <div 
            ref={progressRef}
            className="w-full h-2.5 bg-gray-500/50 rounded-full cursor-pointer relative group"
            onClick={handleSeek}
          >
            <div 
              className="absolute top-0 left-0 h-full bg-gray-400/60 rounded-full"
              style={{ width: `${(buffered / duration) * 100}%` }}
            ></div>
            <div 
              className="absolute top-0 left-0 h-full bg-primary-600 rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            ></div>
            <div 
              className="absolute h-4 w-4 bg-primary-600 rounded-full -top-1 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-white mt-3">
            <div className="flex items-center space-x-4">
              <button
                onClick={togglePlay}
                className="hover:text-gray-300 transition-colors"
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </button>

              <div className="flex items-center space-x-2 group">
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
                  className="w-0 group-hover:w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider transition-all duration-300"
                />
              </div>
               <span className="text-xs">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center space-x-4">
                <button onClick={() => skipTime(-10)} className="hover:text-gray-300 transition-colors">
                    <Rewind className="h-5 w-5" />
                </button>
                <button onClick={() => skipTime(10)} className="hover:text-gray-300 transition-colors">
                    <FastForward className="h-5 w-5" />
                </button>
            </div>

            <div className="flex items-center space-x-4">
                <span className="text-sm font-medium truncate max-w-xs">{fileName}</span>
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