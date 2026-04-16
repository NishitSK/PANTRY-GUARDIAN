"use client"

import { useRef, useEffect, useState } from "react"
import { useScroll, useMotionValueEvent, useSpring, MotionValue } from "framer-motion"

interface ScrollImageSequenceProps {
  folderPath: string
  filePrefix: string
  fileSuffix: string
  frameCount: number
  className?: string
  scale?: number
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down"
  scrollProgress?: MotionValue<number>
}

export default function ScrollImageSequence({ 
    folderPath, 
    filePrefix, 
    fileSuffix, 
    frameCount, 
    className,
    scale = 1,
    objectFit = "contain",
    scrollProgress
}: ScrollImageSequenceProps) {
  const [currentFrame, setCurrentFrame] = useState(1)
  const [imagesPreloaded, setImagesPreloaded] = useState(false)

  // Track scroll progress (use provided or fallback to global)
  const { scrollYProgress: globalScroll } = useScroll()
  const activeProgress = scrollProgress || globalScroll
  
  // Smooth out the scroll progress
  const smoothProgress = useSpring(activeProgress, {  
    mass: 0.1,
    stiffness: 100, 
    damping: 20,
    restDelta: 0.001
  })

  // Preload images
  useEffect(() => {
    let loadedCount = 0
    const imageUrls = []
    
    for (let i = 1; i <= frameCount; i++) {
        // Pad with zeros (e.g. 001, 010, 100)
        const paddedIndex = i.toString().padStart(3, '0')
        const src = `${folderPath}/${filePrefix}${paddedIndex}${fileSuffix}`
        imageUrls.push(src)
        
        const img = new Image()
        img.src = src
        img.onload = () => {
            loadedCount++
            if (loadedCount === frameCount) {
                setImagesPreloaded(true)
            }
        }
    }
  }, [folderPath, filePrefix, fileSuffix, frameCount])

  // Sync frame with scroll
  useMotionValueEvent(smoothProgress, "change", (latest) => {
    // Map 0-1 to 1-frameCount
    const frameIndex = Math.min(
        Math.max(1, Math.round(latest * frameCount)), 
        frameCount
    )
    setCurrentFrame(frameIndex)
  })

  // Generate current image path
  const currentPaddedIndex = currentFrame.toString().padStart(3, '0')
  const currentImageSrc = `${folderPath}/${filePrefix}${currentPaddedIndex}${fileSuffix}`

  return (
    <div className={`relative ${className}`} style={{ overflow: 'hidden' }}>
        {/* Only show loading if we haven't even loaded the first few frames AND the image isn't visible yet */}
        {!imagesPreloaded && currentFrame === 1 && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-background/50 z-10 pointer-events-none opacity-0">
                <span className="animate-pulse text-sm">Loading...</span>
            </div>
        )}
        
        <img
            src={currentImageSrc}
            alt={`Frame ${currentFrame}`}
            className="w-full h-full"
            style={{ 
                objectFit: objectFit,
                transform: `scale(${scale})`,
                display: 'block'
            }}
        />
    </div>
  )
}
