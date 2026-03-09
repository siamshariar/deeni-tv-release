
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, History, Play, ArrowLeft, Volume2, Volume1, Volume, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { VideoProgram } from '@/types/schedule'
import { formatDuration } from '@/lib/schedule-utils'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useMediaQuery } from '@/hooks/use-media-query'
import Image from 'next/image'

interface PreviousVideosModalProps {
  isOpen: boolean
  onClose: () => void
  videos: VideoProgram[]
  onPlayVideo?: (video: VideoProgram) => void
  currentChannelId?: string
  onPauseMainPlayer?: () => void
  onResumeMainPlayer?: () => void
}

// Breaking News Style Ticker Component - Infinite 360-degree scroll
const BreakingNewsTicker = ({ 
  videos, 
  currentVideoId 
}: { 
  videos: VideoProgram[]
  currentVideoId?: string 
}) => {
  const isMobile = useMediaQuery('(max-width: 640px)')
  
  // Filter out current video and get remaining videos
  const remainingVideos = videos.filter(v => v.id !== currentVideoId)
  
  if (remainingVideos.length === 0) return null
  
  const items: React.ReactElement[] = []
  const repeatCount = 30 // High count for smooth infinite loop
  
  for (let i = 0; i < repeatCount; i++) {
    remainingVideos.forEach((video, videoIndex) => {
      // Only the FIRST video in the original list is "NEXT" - not all index 0s in repeats
      const isNextVideo = videoIndex === 0
      const duration = formatDuration(video.duration)
      
      items.push(
        <div 
          key={`ticker-${video.id}-${i}-${videoIndex}`} 
          className={`inline-flex items-center ${isMobile ? 'mx-4' : 'mx-8'}`}
        >
          {/* Badge - NEXT is very prominent, UP NEXT is subtle */}
          {isNextVideo ? (
            <span className={`
              rounded-full font-black mr-3 whitespace-nowrap uppercase tracking-wider
              bg-gradient-to-r from-yellow-400 to-yellow-500 text-black
              border-2 border-yellow-300 shadow-xl shadow-yellow-400/60
              ${isMobile ? 'px-3 py-1 text-[11px]' : 'px-4 py-1.5 text-sm'}
            `}>
              ▶ NEXT
            </span>
          ) : (
            <span className={`
              rounded-full font-medium mr-2 whitespace-nowrap uppercase tracking-wider
              bg-white/10 text-white/60 border border-white/20
              ${isMobile ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-0.5 text-[10px]'}
            `}>
              UP NEXT
            </span>
          )}
          
          {/* Title - Full text visible, no truncation */}
          <span className={`
            tracking-wide whitespace-nowrap
            ${isMobile ? 'text-sm' : 'text-base'}
            ${isNextVideo 
              ? 'text-yellow-200 font-black text-shadow-lg' 
              : 'text-white/80 font-semibold'
            }
          `}>
            {video.title}
          </span>
          
          {/* Duration */}
          <span className={`
            font-mono whitespace-nowrap
            ${isMobile ? 'ml-2 text-[11px]' : 'ml-3 text-sm'}
            ${isNextVideo ? 'text-yellow-300 font-bold' : 'text-white/50 font-medium'}
          `}>
            • {duration}
          </span>
        </div>
      )
    })
  }
  
  // Calculate animation distance based on content - much longer distance for continuous loop
  const totalVideos = remainingVideos.length * repeatCount
  const animationDistance = isMobile ? -(totalVideos * 400) : -(totalVideos * 500)
  const animationDuration = isMobile ? totalVideos * 6 : totalVideos * 5 // Consistent speed per video
  
  return (
    <div className={`
      absolute left-0 right-0 z-20 overflow-hidden
      bg-gradient-to-r from-black via-black/95 to-black
      border-t border-white/10
      ${isMobile ? 'bottom-16 h-12' : 'bottom-18 h-14'}
    `}>
      {/* Gradient Fades */}
      <div className={`absolute left-0 top-0 bottom-0 ${isMobile ? 'w-8' : 'w-16'} bg-gradient-to-r from-black to-transparent z-10 pointer-events-none`} />
      <div className={`absolute right-0 top-0 bottom-0 ${isMobile ? 'w-8' : 'w-16'} bg-gradient-to-l from-black to-transparent z-10 pointer-events-none`} />
      
      {/* Infinite Scrolling Content - 360-degree continuous loop */}
      <motion.div
        className="flex items-center h-full whitespace-nowrap"
        animate={{ x: [0, animationDistance] }}
        transition={{ 
          duration: animationDuration,
          repeat: Infinity, 
          ease: "linear"
        }}
        style={{ willChange: "transform" }}
      >
        {items}
      </motion.div>
    </div>
  )
}

// Fullscreen Video Player Modal — custom controls (seekbar + volume)
const VideoPlayerModal = ({ 
  video, 
  allVideos,
  isOpen, 
  onClose 
}: { 
  video: VideoProgram | null
  allVideos: VideoProgram[]
  isOpen: boolean
  onClose: () => void 
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const ytPlayerRef = useRef<any>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isSeekingRef = useRef(false)
  const volumeRef = useRef(75)
  const isMobile = useMediaQuery('(max-width: 640px)')
  const [volume, setVolume] = useState(75)
  const [isMuted, setIsMuted] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playerLoaded, setPlayerLoaded] = useState(false)
  const hideVolumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Format seconds → M:SS
const fmtTime = (sec: number): string => {
    if (!sec || isNaN(sec) || sec < 0) return '0:00'
    
    const hours = Math.floor(sec / 3600)
    const minutes = Math.floor((sec % 3600) / 60)
    const seconds = Math.floor(sec % 60)
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

  // Initialise YT Player API when modal opens
  useEffect(() => {
    if (!isOpen || !video) return
    let destroyed = false
    setCurrentTime(0)
    setDuration(0)

    const startPolling = () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = setInterval(() => {
        if (destroyed || !ytPlayerRef.current) return
        try {
          const t = ytPlayerRef.current.getCurrentTime?.() ?? 0
          const d = ytPlayerRef.current.getDuration?.() ?? 0
          if (!isSeekingRef.current && typeof t === 'number') setCurrentTime(t)
          if (typeof d === 'number' && d > 0) setDuration(d)
        } catch {}
      }, 250)
    }

    const createPlayer = () => {
      if (destroyed || !containerRef.current || !window.YT?.Player) return
      if (ytPlayerRef.current?.destroy) {
        try { ytPlayerRef.current.destroy() } catch {}
        ytPlayerRef.current = null
      }
      containerRef.current.innerHTML = ''
      const playerId = `watch-yt-${Date.now()}`
      const div = document.createElement('div')
      div.id = playerId
      containerRef.current.appendChild(div)

      ytPlayerRef.current = new window.YT.Player(playerId, {
        videoId: video.videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          disablekb: 1,
          enablejsapi: 1,
          origin: window.location.origin,
          playsinline: 1,
        },
        events: {
          onReady: (event: any) => {
            if (destroyed) return
            try {
              event.target.setVolume(volumeRef.current)
              event.target.unMute()
              event.target.playVideo()
              const d = event.target.getDuration()
              if (typeof d === 'number' && d > 0) setDuration(d)
              setPlayerLoaded(true)
            } catch {}
            startPolling()
          },
          onStateChange: (event: any) => {
            if (destroyed) return
            // Refresh duration once video starts playing / is cued
            if (event.data === 1 || event.data === 5) {
              try {
                const d = ytPlayerRef.current?.getDuration?.() ?? 0
                if (d > 0) setDuration(d)
              } catch {}
            }
          },
        },
      })

      // Patch iframe attributes for iOS Safari autoplay
      const patchIframe = (attempt = 0) => {
        if (destroyed) return
        const iframe = containerRef.current?.querySelector('iframe')
        if (iframe) {
          iframe.setAttribute('playsinline', 'true')
          iframe.setAttribute('webkit-playsinline', 'webkit-playsinline')
          iframe.setAttribute('allow', 'autoplay; encrypted-media; fullscreen')
          Object.assign(iframe.style, {
            border: 'none', pointerEvents: 'none',
            width: '100%', height: '100%',
            position: 'absolute', top: '0', left: '0',
          })
        } else if (attempt < 5) {
          setTimeout(() => patchIframe(attempt + 1), 300)
        }
      }
      setTimeout(() => patchIframe(), 100)
    }

    if (window.YT?.Player) {
      createPlayer()
    } else {
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(tag)
      }
      const prevCallback = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        prevCallback?.()
        createPlayer()
      }
    }

    return () => {
      destroyed = true
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      if (ytPlayerRef.current?.destroy) {
        try { ytPlayerRef.current.destroy() } catch {}
        ytPlayerRef.current = null
      }
    }
  }, [isOpen, video?.videoId])

  // Reset the auto-hide timer (both platforms)
  const resetHideTimer = useCallback(() => {
    if (hideVolumeTimerRef.current) clearTimeout(hideVolumeTimerRef.current)
    hideVolumeTimerRef.current = setTimeout(() => setShowVolumeSlider(false), 3000)
  }, [])

  const handleVolumeChange = useCallback((values: number[]) => {
    const v = values[0]
    volumeRef.current = v
    setVolume(v)
    setIsMuted(v === 0)
    try {
      ytPlayerRef.current?.setVolume(v)
      if (v === 0) ytPlayerRef.current?.mute()
      else ytPlayerRef.current?.unMute()
    } catch {}
    resetHideTimer()
  }, [resetHideTimer])

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev
      try {
        if (newMuted) {
          ytPlayerRef.current?.mute()
        } else {
          ytPlayerRef.current?.unMute()
          ytPlayerRef.current?.setVolume(volumeRef.current || 75)
        }
      } catch {}
      return newMuted
    })
  }, [])

  // Mobile: first tap shows slider; subsequent taps while visible toggle mute
  const handleVolumeIconClick = useCallback(() => {
    if (isMobile) {
      if (!showVolumeSlider) {
        setShowVolumeSlider(true)
        resetHideTimer()
      } else {
        toggleMute()
        resetHideTimer()
      }
    } else {
      toggleMute()
    }
  }, [isMobile, showVolumeSlider, toggleMute, resetHideTimer])

  const getVolumeIcon = (cls = 'h-4 w-4') => {
    if (isMuted || volume === 0) return <VolumeX className={cls} />
    if (volume < 30) return <Volume className={cls} />
    if (volume < 70) return <Volume1 className={cls} />
    return <Volume2 className={cls} />
  }

  if (!video) return null

  const iconCls = isMobile ? 'h-5 w-5' : 'h-4 w-4'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[80]"
          />

          {/* Fullscreen Player */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-black"
          >
            <div className={`relative w-full ${isMobile ? 'w-full' : 'md:w-[70vw] md:max-w-[1400px]'}`}>

              {/* Title bar */}
              <div className={`w-full bg-black/80 backdrop-blur-xl border border-white/10 border-b-0 rounded-t-2xl md:rounded-t-3xl ${isMobile ? 'px-3 py-2' : 'px-4 py-3'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                      className={`text-white hover:bg-white/20 rounded-full bg-white/10 backdrop-blur-sm flex-shrink-0 ${isMobile ? 'h-8 w-8' : 'h-9 w-9'}`}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-white font-bold truncate ${isMobile ? 'text-sm' : 'text-base'}`}>
                        {video.title}
                      </h3>
                      <p className="text-white/60 text-[10px] md:text-xs">
                        {formatDuration(video.duration)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className={`text-white hover:bg-white/20 rounded-full bg-white/10 backdrop-blur-sm flex-shrink-0 ${isMobile ? 'h-8 w-8' : 'h-9 w-9'}`}
                  >
                    <X className={isMobile ? 'h-4 w-4' : 'h-5 w-5'} />
                  </Button>
                </div>
              </div>

              {/* Video container (YT Player API injects iframe here) */}
              <div className="relative w-full aspect-video bg-black overflow-hidden border-x border-white/10 select-none">
                {!playerLoaded && video && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <Image
                      src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
                      alt={video.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Play className="h-16 w-16 text-white/80" />
                    </div>
                  </div>
                )}
                <div ref={containerRef} className={`absolute inset-0 w-full h-full ${playerLoaded ? 'opacity-100' : 'opacity-0'}`} />
              </div>

              {/* ─── Seek / Progress bar ─── */}
              <div className="w-full bg-black/80 border-x border-white/10 px-3 pt-3 pb-1.5">
                <div
                  onPointerDown={() => { isSeekingRef.current = true }}
                  className="w-full"
                >
                  <Slider
                    value={[currentTime]}
                    min={0}
                    max={duration > 0 ? duration : 100}
                    step={0.5}
                    disabled={duration === 0}
                    onValueChange={(v) => setCurrentTime(v[0])}
                    onValueCommit={(v) => {
                      isSeekingRef.current = false
                      try { ytPlayerRef.current?.seekTo(v[0], true) } catch {}
                    }}
                    className="w-full cursor-pointer"
                  />
                </div>
              </div>

              {/* ─── Bottom controls bar ─── */}
              <div className={`w-full bg-black/60 backdrop-blur-xl border border-white/10 border-t-0 rounded-b-2xl md:rounded-b-3xl ${isMobile ? 'px-3 py-2' : 'px-4 py-2'}`}>
                <div className="flex items-center gap-2">

                  {/* Volume icon + slider */}
                  <div
                    className="relative flex items-center gap-1"
                    onMouseEnter={() => {
                      if (!isMobile) {
                        setShowVolumeSlider(true)
                        resetHideTimer()
                      }
                    }}
                    onMouseLeave={() => {
                      if (!isMobile) resetHideTimer()
                    }}
                  >
                    <button
                      onClick={handleVolumeIconClick}
                      className={`text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors flex items-center justify-center flex-shrink-0 ${isMobile ? 'h-9 w-9' : 'h-8 w-8'}`}
                      aria-label={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {getVolumeIcon(iconCls)}
                    </button>

                    {/* Volume slider — desktop hover & mobile tap */}
                    <AnimatePresence>
                      {showVolumeSlider && (
                        <motion.div
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 96 }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-visible px-1"
                        >
                          <Slider
                            value={[isMuted ? 0 : volume]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={handleVolumeChange}
                            className="w-full"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Time display */}
                  <span className={`text-white/50 font-mono tabular-nums ${isMobile ? 'text-[11px]' : 'text-xs'}`}>
                    {fmtTime(currentTime)} / {fmtTime(duration)}
                  </span>

                  <div className="flex-1" />

                  {/* Branding */}
                  <img
                    src="/DeeniTV-V-2.png"
                    alt="Deeni.tv"
                    className={isMobile ? 'h-4' : 'h-5'}
                  />
                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function PreviousVideosModal({ 
  isOpen, 
  onClose, 
  videos, 
  onPlayVideo,
  currentChannelId,
  onPauseMainPlayer,
  onResumeMainPlayer
}: PreviousVideosModalProps) {
  const isMobile = useMediaQuery('(max-width: 640px)')
  const [mounted, setMounted] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<VideoProgram | null>(null)
  const [showVideoPlayer, setShowVideoPlayer] = useState(false)

  // Handle mounting for animations
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const handlePlayVideo = useCallback((video: VideoProgram) => {
    // Pause main TV player
    onPauseMainPlayer?.()
    
    // Open fullscreen video player modal
    setSelectedVideo(video)
    setShowVideoPlayer(true)
  }, [onPauseMainPlayer])

  const handleCloseVideoPlayer = useCallback(() => {
    setShowVideoPlayer(false)
    setSelectedVideo(null)
    // Resume/unmute main player
    onResumeMainPlayer?.()
    // Do NOT close this modal - keep Previously Watched modal open
    // User can continue browsing or close it manually
  }, [onResumeMainPlayer])

  if (!mounted) return null

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop - Not clickable */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
            />
            
            {/* Modal - Same style as Schedule Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-h-[80vh] bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 rounded-2xl shadow-2xl border border-white/10 z-[70] overflow-hidden ${isMobile ? 'max-w-sm' : 'max-w-2xl'}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/20 rounded-lg">
                    <History className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Previously Watched
                    </h2>
                    <p className="text-xs text-white/40">
                      {videos.length} {videos.length === 1 ? 'video' : 'videos'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className={`text-white/60 hover:text-white hover:bg-white/10 rounded-xl ${
                    isMobile ? 'h-12 w-12' : 'h-10 w-10'
                  }`}
                >
                  <X className={isMobile ? 'h-7 w-7' : 'h-5 w-5'} />
                </Button>
              </div>
              
              {/* Videos List - Simplified UI */}
              <div className="overflow-y-auto max-h-[calc(80vh-80px)] p-4">
                {videos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <History className="h-8 w-8 text-white/20 mb-4" />
                    <p className="text-white/60 text-sm mb-2">No previously watched videos</p>
                    {/* <p className="text-white/40 text-xs text-center">
                      Videos you watch will appear here
                    </p> */}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {videos.map((video, index) => (
                      <motion.button
                        key={`${video.id}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => handlePlayVideo(video)}
                        className="w-full p-4 rounded-xl border bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all group text-left"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors mt-0.5">
                            <Play className="h-2.5 w-2.5 text-primary fill-primary" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold text-sm leading-snug group-hover:text-primary transition-colors">
                              {video.title}
                            </h3>
                            <p className="text-white/40 text-xs mt-1.5 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(video.duration)}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Fullscreen Video Player */}
      <VideoPlayerModal
        video={selectedVideo}
        allVideos={videos}
        isOpen={showVideoPlayer}
        onClose={handleCloseVideoPlayer}
      />
    </>
  )
}
