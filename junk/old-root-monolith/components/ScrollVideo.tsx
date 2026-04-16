"use client"

import { useRef, useEffect, useState } from "react"
import { useScroll, useMotionValueEvent, useSpring } from "framer-motion"

interface ScrollVideoProps {
  src: string
  className?: string
  scale?: number
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down"
  speed?: number
  steps?: number
  scrollProgress?: any // Using any to avoid type complexity with Framer Motion versions, effectively MotionValue<number>
}

export default function ScrollVideo({ src, className, scale = 1, objectFit = "contain", speed = 1, steps, scrollProgress }: ScrollVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [duration, setDuration] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  // Track scroll progress
  const { scrollYProgress } = useScroll()
  
  // Smooth out the scroll progress using a spring physics simulation
  // mass: inertia, stiffness: rigidity of the spring, damping: friction
  const smoothProgress = useSpring(scrollYProgress, { 
    mass: 0.1,
    stiffness: 100, 
    damping: 20,
    restDelta: 0.001
  })

  // Handle video metadata loaded
  const onLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      setIsLoaded(true)
    }
  }

  // Sync video time with smooth scroll value
  useMotionValueEvent(smoothProgress, "change", (latest) => {
    if (videoRef.current && duration > 0) {
      // QUANTIZE PROGRESS: If steps is defined, snap 'latest' to nearest step 
      // (e.g. 24 steps = 0, 0.04, 0.08...)
      let processedProgress = latest
      if (steps) {
        processedProgress = Math.round(latest * steps) / steps
      }

      // Calculate time based on processed progress multiplied by speed factor.
      // We use modulo (%) to loop the video if the calculated time exceeds duration.
      const totalTime = processedProgress * duration * speed
      const targetTime = totalTime % duration
      
      // Check for finite duration (avoid Infinity issues)
      if (Number.isFinite(targetTime)) {
         videoRef.current.currentTime = targetTime
      }
    }
  })

  return (
    <div ref={containerRef} className={`relative ${className}`}>
        {/* Loading State */}
        {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <span className="animate-pulse">Loading Video...</span>
            </div>
        )}
        
        <video
            ref={videoRef}
            src={src}
            className="w-full h-full"
            muted
            playsInline
            preload="auto"
            onLoadedMetadata={onLoadedMetadata}
            // Hide standard controls
            style={{ 
                display: isLoaded ? 'block' : 'none',
                objectFit: objectFit,
                transform: `scale(${scale})`
            }}
        />
    </div>
  )
}
