'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X, Upload, Camera, Loader2, CheckCircle, AlertTriangle, ArrowRight, RotateCcw } from 'lucide-react'
import { getApiBaseUrl } from '@/lib/api'

interface ScannedItem {
  ocrName: string
  name: string
  category: string
  quantity: number
  unit: string
  suggestedStorage: string
  matchedProductId: string | null
}

interface ScanResult {
  success: boolean
  isReceipt: boolean
  purchase_date: string | null
  items: ScannedItem[]
  summary: string
  totalItemsDetected: number
}

type Step = 'choose' | 'uploading' | 'reviewing' | 'done' | 'error'

interface ReceiptScanModalProps {
  onClose: () => void
}

export default function ReceiptScanModal({ onClose }: ReceiptScanModalProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('choose')
  const [preview, setPreview] = useState<string | null>(null)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())

  const handleFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Please choose an image under 5 MB.')
      setStep('error')
      return
    }
    setCapturedFile(file)
    setPreview(URL.createObjectURL(file))
    uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    const baseUrl = getApiBaseUrl()
    setStep('uploading')
    setError(null)

    try {
      // First try direct server OCR
      const formData = new FormData()
      formData.append('image', file)

      const res = await fetch(`${baseUrl}/api/analyze-image`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Server error' }))
        // If OCR service isn't configured, fall back to in-browser OCR
        if (res.status === 500 && body?.error?.includes('OCR service unavailable')) {
          await runBrowserOcrFallback(file)
          return
        }
        throw new Error(body?.error || `Analysis failed (${res.status})`)
      }

      const data: ScanResult = await res.json()
      setScanResult(data)
      setSelectedItems(new Set(data.items.map((_, i) => i)))
      setStep('reviewing')
    } catch (err: any) {
      // Try browser-side OCR as final fallback
      try {
        await runBrowserOcrFallback(file)
      } catch {
        setError(err?.message || 'Failed to analyse image. Try a clearer photo.')
        setStep('error')
      }
    }
  }

  const runBrowserOcrFallback = async (file: File) => {
    const { recognize } = await import('tesseract.js')
    const result = await recognize(file, 'eng')
    const text = String(result?.data?.text || '').trim()
    if (!text) throw new Error('Could not detect text in this image.')

    const formData = new FormData()
    formData.append('image', file)
    formData.append('extractedText', text)

    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/api/analyze-image`, { method: 'POST', body: formData })
    if (!res.ok) throw new Error('Analysis failed even with browser OCR.')

    const data: ScanResult = await res.json()
    setScanResult(data)
    setSelectedItems(new Set(data.items.map((_, i) => i)))
    setStep('reviewing')
  }

  const toggleItem = (idx: number) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const handleAddToInventory = () => {
    if (!scanResult) return
    const items = scanResult.items.filter((_, i) => selectedItems.has(i))
    if (items.length === 0) return
    // Pass first item as query param to pre-fill /add; all items can be reviewed there
    const first = items[0]
    const params = new URLSearchParams({
      name: first.name,
      quantity: String(first.quantity),
      unit: first.unit,
      category: first.category,
      storage: first.suggestedStorage,
      ...(scanResult.purchase_date ? { purchasedAt: scanResult.purchase_date } : {}),
      scannedCount: String(items.length),
    })
    onClose()
    router.push(`/add?${params.toString()}`)
  }

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setCapturedFile(null)
    setScanResult(null)
    setError(null)
    setSelectedItems(new Set())
    setStep('choose')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-[#F6F1E7] border-4 border-black shadow-[12px_12px_0_#000] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-black bg-[#FFE66D] px-6 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/60">Quick Action</p>
            <h2 className="font-noto-serif text-2xl font-bold text-black">Scan Grocery Receipt</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="border-2 border-black bg-white p-2 hover:bg-black hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* STEP: choose */}
          {step === 'choose' && (
            <div className="space-y-4">
              <p className="font-manrope text-sm text-black/70 leading-relaxed">
                Upload a receipt image or take a photo. Items will be extracted and you can review them before saving.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-3 border-4 border-black bg-white p-6 hover:bg-[#93E1A8] transition-colors shadow-[4px_4px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                >
                  <Upload className="h-8 w-8" />
                  <span className="text-[11px] font-black uppercase tracking-[0.18em]">Upload Image</span>
                  <span className="text-[10px] text-black/60 font-manrope text-center">JPG, PNG, WebP · max 5 MB</span>
                </button>

                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center gap-3 border-4 border-black bg-white p-6 hover:bg-[#93E1A8] transition-colors shadow-[4px_4px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                >
                  <Camera className="h-8 w-8" />
                  <span className="text-[11px] font-black uppercase tracking-[0.18em]">Use Camera</span>
                  <span className="text-[10px] text-black/60 font-manrope text-center">Take a photo directly</span>
                </button>
              </div>

              <div className="border-2 border-black bg-white/60 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/50 mb-1">How it works</p>
                <p className="text-[11px] font-manrope text-black/70 leading-relaxed">
                  OCR reads the receipt text → food items are matched against your pantry database → you confirm and save.
                  Requires a clear, well-lit photo for best results.
                </p>
              </div>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
            </div>
          )}

          {/* STEP: uploading */}
          {step === 'uploading' && (
            <div className="flex flex-col items-center gap-6 py-8">
              {preview && (
                <img src={preview} alt="Receipt preview" className="max-h-40 border-2 border-black object-contain" />
              )}
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-black" />
                <p className="font-manrope text-sm text-black/70">Analysing receipt…</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">OCR is running, please wait</p>
              </div>
            </div>
          )}

          {/* STEP: reviewing */}
          {step === 'reviewing' && scanResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-2 border-black bg-[#93E1A8] px-4 py-3">
                <CheckCircle className="h-5 w-5 text-black shrink-0" />
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em]">{scanResult.summary}</p>
                  <p className="text-[10px] text-black/60 font-manrope">{scanResult.totalItemsDetected} item(s) detected</p>
                </div>
              </div>

              {scanResult.items.length === 0 ? (
                <div className="border-2 border-black bg-[#FFD2CC] px-4 py-3">
                  <p className="text-sm font-manrope text-black">
                    No food items were detected. Try a clearer photo or check that the receipt shows item names.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/60">
                    Select items to add ({selectedItems.size} of {scanResult.items.length} selected)
                  </p>
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {scanResult.items.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => toggleItem(i)}
                        className={`w-full flex items-center justify-between border-2 border-black px-4 py-3 text-left transition-colors ${
                          selectedItems.has(i) ? 'bg-[#FFE66D]' : 'bg-white hover:bg-black/5'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-black text-black">{item.name}</p>
                          <p className="text-[10px] font-manrope text-black/60">
                            {item.quantity} {item.unit} · {item.category} · {item.suggestedStorage.replace('_', ' ')}
                          </p>
                          {item.ocrName.toLowerCase() !== item.name.toLowerCase() && (
                            <p className="text-[9px] text-black/40 font-manrope">OCR: &quot;{item.ocrName}&quot;</p>
                          )}
                        </div>
                        <div className={`h-5 w-5 border-2 border-black flex items-center justify-center transition-colors ${
                          selectedItems.has(i) ? 'bg-black' : 'bg-white'
                        }`}>
                          {selectedItems.has(i) && <div className="h-2.5 w-2.5 bg-white" />}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={reset}
                      className="flex items-center gap-2 border-2 border-black bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-colors"
                    >
                      <RotateCcw className="h-4 w-4" /> Rescan
                    </button>
                    <button
                      onClick={handleAddToInventory}
                      disabled={selectedItems.size === 0}
                      className="flex-1 flex items-center justify-center gap-2 border-2 border-black bg-[#FFE66D] px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-colors disabled:opacity-40 disabled:pointer-events-none shadow-[4px_4px_0_#000]"
                    >
                      Add {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} to pantry <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP: error */}
          {step === 'error' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 border-2 border-black bg-[#FFD2CC] px-4 py-3">
                <AlertTriangle className="h-5 w-5 text-black shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] mb-1">Scan failed</p>
                  <p className="text-sm font-manrope text-black/80">{error}</p>
                </div>
              </div>

              <div className="border-2 border-black bg-white/60 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/60 mb-1">Tips for a better scan</p>
                <ul className="text-[11px] font-manrope text-black/70 space-y-1 list-disc list-inside">
                  <li>Use good lighting — no glare or shadows</li>
                  <li>Keep the receipt flat and straight</li>
                  <li>Make sure item names are fully visible</li>
                  <li>File must be under 5 MB</li>
                </ul>
              </div>

              <button
                onClick={reset}
                className="w-full flex items-center justify-center gap-2 border-2 border-black bg-[#FFE66D] px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0_#000]"
              >
                <RotateCcw className="h-4 w-4" /> Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
