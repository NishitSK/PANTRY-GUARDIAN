'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Camera, Image as ImageIcon, X, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { getApiBaseUrl } from '@/lib/api'

interface ImageCaptureProps {
  onImageCaptured?: (file: File) => void
  onAnalysisComplete?: (data: any) => void
}

export default function ImageCapture({ onImageCaptured, onAnalysisComplete }: ImageCaptureProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [ocrMsgIndex, setOcrMsgIndex] = useState(0)
  const [ocrMsgVisible, setOcrMsgVisible] = useState(true)

  const OCR_MESSAGES = [
    'Reading the receipt',
    'Scanning item names',
    'Checking the letters',
    'Looking at the list',
    'Matching grocery items',
    'Identifying products',
    'Cross-referencing pantry',
    'Parsing quantities',
    'Verifying item names',
    'Almost there',
  ]

  useEffect(() => {
    if (!analyzing) return
    setOcrMsgIndex(0)
    setOcrMsgVisible(true)
    const interval = setInterval(() => {
      setOcrMsgVisible(false)
      setTimeout(() => {
        setOcrMsgIndex(prev => (prev + 1) % OCR_MESSAGES.length)
        setOcrMsgVisible(true)
      }, 300)
    }, 2200)
    return () => clearInterval(interval)
  }, [analyzing])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size too large. Please select an image under 5MB.')
        return
      }
      
      setCapturedFile(file)
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)
      if (onImageCaptured) {
        onImageCaptured(file)
      }
    }
  }

  const handleClear = () => {
    if (preview) {
      URL.revokeObjectURL(preview)
    }
    setPreview(null)
    setCapturedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAnalyze = async () => {
    if (!capturedFile) return
    
    setAnalyzing(true)
    
    try {
      const analyzeWithServer = async (extractedText?: string) => {
        const baseUrl = getApiBaseUrl()
        const formData = new FormData()
        formData.append('image', capturedFile)
        if (extractedText) {
          formData.append('extractedText', extractedText)
        }

        const res = await fetch(`${baseUrl}/api/analyze-image`, {
          method: 'POST',
          body: formData,
        })

        const contentType = res.headers.get('content-type') || ''
        const rawBody = await res.text()

        let data: any = null
        if (contentType.includes('application/json')) {
          data = rawBody ? JSON.parse(rawBody) : null
        } else {
          data = {
            error: rawBody.includes('<!DOCTYPE')
              ? 'The image analysis server returned an HTML error page. Check the server logs and reload.'
              : rawBody || 'Analysis failed',
          }
        }

        if (!res.ok) {
          throw new Error(data?.error || 'Analysis failed')
        }

        return data
      }

      let data: any

      try {
        data = await analyzeWithServer()
      } catch (serverError: any) {
        // Fallback: run OCR in browser and send extracted text to the same API route.
        const { recognize } = await import('tesseract.js')
        const result = await recognize(capturedFile, 'eng')
        const fallbackText = String(result?.data?.text || '').trim()

        if (!fallbackText) {
          throw new Error(serverError?.message || 'Could not detect text from image')
        }

        data = await analyzeWithServer(fallbackText)
      }

      if (onAnalysisComplete) {
        onAnalysisComplete(data)
      }
    } catch (error: any) {
      console.error('Analysis error:', error)
      alert(error?.message || 'Failed to analyze image')
    } finally {
      setAnalyzing(false)
    }
  }

  const triggerCamera = () => {
    fileInputRef.current?.click()
  }

  return (
    <>
      {/* OCR Analyzing Overlay */}
      {analyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-6 border-4 border-black bg-[#F6F1E7] p-10 shadow-[12px_12px_0_#000] min-w-[300px]">
            {/* Brutalist spinner */}
            <div className="h-10 w-10 animate-spin border-4 border-black border-t-transparent" />

            {/* Rotating message */}
            <div className="flex flex-col items-center gap-2 min-h-[3.5rem] text-center">
              <p
                className="font-anton text-2xl uppercase leading-none text-black transition-opacity duration-300"
                style={{ opacity: ocrMsgVisible ? 1 : 0 }}
              >
                {OCR_MESSAGES[ocrMsgIndex]}
              </p>
              <p className="font-ibm-mono text-[10px] uppercase tracking-[0.24em] text-black/50">
                AI scan in progress
              </p>
            </div>

            {/* Progress dots */}
            <div className="flex gap-2">
              {OCR_MESSAGES.slice(0, 5).map((_, i) => (
                <div
                  key={i}
                  className="h-2 w-2 border-2 border-black transition-colors duration-300"
                  style={{ background: i === ocrMsgIndex % 5 ? '#000' : 'transparent' }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm transition-all">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Sparkles className="h-4 w-4 text-purple-500" />
          AI Smart Scan
        </h3>
        <span className="text-xs font-medium px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded-full">
          Beta
        </span>
      </div>

      <div className="p-4">
        {!preview ? (
          <div 
            onClick={triggerCamera}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors gap-3"
          >
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <Camera className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Take a photo or upload
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Scan your grocery receipt or items
              </p>
            </div>
          </div>
        ) : (
          <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-black/5">
            <div className="aspect-video relative w-full">
               {/* Using regular img for preview to avoid dealing with next/image complexity for blobs */}
               <img 
                 src={preview} 
                 alt="Preview" 
                 className="w-full h-full object-contain"
               />
            </div>
            
            <div className="absolute top-2 right-2">
              <button 
                onClick={handleClear}
                className="p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClear}
              >
                Retake
              </Button>
              <Button 
                size="sm" 
                className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                onClick={handleAnalyze}
                disabled={analyzing}
              >
                {analyzing ? (
                  <>Scanning</>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Analyze with AI
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
        
        {/* Hidden input for camera/file */}
        <input 
          type="file" 
          accept="image/*" 
          capture="environment"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
      </div>
    </>
  )
}
