'use client'

import { useEffect, useMemo, useState } from 'react'

type ParsedItem = {
  ocrName: string
  name: string
  quantity: string
}

type ParsedReceipt = {
  items: ParsedItem[]
  cleanedData: Array<{
    rawLine: string
    cleanedName: string
    quantity: string
    accepted: boolean
  }>
  matchedData: Array<{
    name: string
    quantity: string
    matchedHints: string[]
  }>
}

type StorageTechnique = 'room_temp' | 'fridge' | 'freezer'

type ReviewItem = {
  id: string
  ocrName: string
  matchedName: string
  quantity: string
  storage: StorageTechnique
}

const FOOD_HINT_WORDS = [
  // Common global items
  'apple',
  'apples',
  'banana',
  'broccoli',
  'brussel',
  'sprout',
  'carrot',
  'grape',
  'lettuce',
  'tomato',
  'potato',
  'zucchini',
  'milk',
  'egg',
  'bread',
  'rice',
  'onion',
  'pepper',
  'cabbage',
  'spinach',
  'peas',

  // Indian grains and flours
  'atta',
  'maida',
  'suji',
  'sooji',
  'rava',
  'poha',
  'daliya',
  'millet',
  'bajra',
  'jowar',
  'ragi',
  'basmati',
  'sona masoori',

  // Indian dals and legumes
  'dal',
  'dhal',
  'toor',
  'arhar',
  'moong',
  'masoor',
  'urad',
  'chana',
  'rajma',
  'kabuli',
  'lobia',
  'black gram',
  'green gram',

  // Indian vegetables and greens
  'bhindi',
  'okra',
  'baingan',
  'brinjal',
  'karela',
  'bitter gourd',
  'lauki',
  'bottle gourd',
  'tinda',
  'parwal',
  'pointed gourd',
  'methi',
  'palak',
  'coriander',
  'dhania',
  'mint',
  'pudina',
  'drumstick',
  'moringa',
  'cauliflower',
  'capsicum',
  'coconut',
  'nariyal',
  'chilli',
  'chili',
  'chillies',
  'chilies',
  'green chilli',
  'green chilies',
  'green chillies',
  'ginger',
  'garlic',

  // Indian fruits
  'mango',
  'papaya',
  'guava',
  'pomegranate',
  'muskmelon',
  'watermelon',
  'litchi',
  'chikoo',
  'sapota',
  'custard apple',
  'amla',
  'jamun',
  'nashpati',
  'anar',

  // Dairy and fats
  'curd',
  'dahi',
  'paneer',
  'ghee',
  'buttermilk',
  'lassi',
  'yogurt',
  'butter',
  'honey',

  // Spices and seasonings
  'haldi',
  'turmeric',
  'jeera',
  'cumin',
  'rai',
  'mustard',
  'hing',
  'asafoetida',
  'ajwain',
  'elaichi',
  'cardamom',
  'clove',
  'dalchini',
  'cinnamon',
  'black pepper',
  'garam masala',
  'sambar powder',
  'rasam powder',
  'coriander powder',
  'chilli powder',

  // Oils, sweeteners, pantry staples
  'mustard oil',
  'groundnut oil',
  'sesame oil',
  'sunflower oil',
  'jaggery',
  'gur',
  'sugar',
  'salt',
  'rock salt',
  'pickle',
  'achar',
  'papad',
  'appalam',
  'vermicelli',
  'sevai',
  'idli rice',
  'idli rava',
]

const WEEKDAY_TOKENS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

const RECEIPT_NOISE_PATTERNS: RegExp[] = [
  /^subtotal\b/i,
  /^total\b/i,
  /^cash\b/i,
  /^change\b/i,
  /^discount\b/i,
  /^tax\b/i,
  /^thank\s*you\b/i,
  /\bthank\s*you\b/i,
  /\bshopping\b/i,
  /\breceipt\b/i,
  /\binvoice\b/i,
  /\bphone\b/i,
  /\bmobile\b/i,
  /\broad\b/i,
  /\bstreet\b/i,
  /\bshop\b/i,
  /\bstore\b/i,
  /\bmarket\b/i,
  /\bmumbai\b/i,
]

const NOISE_TOKENS = new Set([
  'sse',
  'f',
  'a',
  'ay',
  'be',
  'mrp',
  'rs',
  'inr',
  'item',
  'code',
])

const BILINGUAL_ITEM_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bbhindi\b|\bokra\b/, label: 'bhindi / okra' },
  { pattern: /\bbaingan\b|\bbrinjal\b|\beggplant\b/, label: 'baingan / brinjal' },
  { pattern: /\bkarela\b|\bbitter\s+gourd\b/, label: 'karela / bitter gourd' },
  { pattern: /\blauki\b|\bbottle\s+gourd\b/, label: 'lauki / bottle gourd' },
  { pattern: /\bparwal\b|\bpointed\s+gourd\b/, label: 'parwal / pointed gourd' },
  { pattern: /\bmethi\b|\bfenugreek\b/, label: 'methi / fenugreek' },
  { pattern: /\bpalak\b|\bspinach\b/, label: 'palak / spinach' },
  { pattern: /\bcoconut\b|\bnariyal\b/, label: 'nariyal / coconut' },
  { pattern: /\bdhania\b|\bcoriander\b/, label: 'dhania / coriander' },
  { pattern: /\bpudina\b|\bmint\b/, label: 'pudina / mint' },
  { pattern: /\bgreen\s*chil+l(?:i|ies|is|e?s?)\b|\bgreen\s*chili(?:es)?\b/, label: 'hari mirch / green chilli' },
  { pattern: /\bhaldi\b|\bturmeric\b/, label: 'haldi / turmeric' },
  { pattern: /\bjeera\b|\bcumin\b/, label: 'jeera / cumin' },
  { pattern: /\brai\b|\bmustard\b/, label: 'rai / mustard' },
  { pattern: /\bhing\b|\basafoetida\b/, label: 'hing / asafoetida' },
  { pattern: /\bajwain\b|\bcarom\b/, label: 'ajwain / carom seeds' },
  { pattern: /\belaichi\b|\bcardamom\b/, label: 'elaichi / cardamom' },
  { pattern: /\bdalchini\b|\bcinnamon\b/, label: 'dalchini / cinnamon' },
  { pattern: /\bgur\b|\bjaggery\b/, label: 'gur / jaggery' },
  { pattern: /\bdahi\b|\bcurd\b|\byogurt\b/, label: 'dahi / curd' },
  { pattern: /\bchikoo\b|\bsapota\b/, label: 'chikoo / sapota' },
  { pattern: /\banar\b|\bpomegranate\b/, label: 'anar / pomegranate' },
  { pattern: /\bamla\b|\bindian\s+gooseberry\b/, label: 'amla / indian gooseberry' },
  { pattern: /\bjamun\b|\bjava\s+plum\b/, label: 'jamun / java plum' },
  { pattern: /\bsooji\b|\bsuji\b|\brava\b|\bsemolina\b/, label: 'suji / semolina' },
  { pattern: /\bpoha\b|\bflattened\s+rice\b/, label: 'poha / flattened rice' },
  { pattern: /\btoor\b|\barhar\b|\bpigeon\s+pea\b/, label: 'toor dal / pigeon pea' },
  { pattern: /\bmoong\b|\bgreen\s+gram\b/, label: 'moong dal / green gram' },
  { pattern: /\bmasoor\b|\bred\s+lentil\b/, label: 'masoor dal / red lentil' },
  { pattern: /\burad\b|\bblack\s+gram\b/, label: 'urad dal / black gram' },
  { pattern: /\bchana\b|\bchickpea\b/, label: 'chana / chickpea' },
  { pattern: /\brajma\b|\bkidney\s+bean\b/, label: 'rajma / kidney beans' },
  { pattern: /\batta\b|\bwheat\s+flour\b/, label: 'atta / wheat flour' },
  { pattern: /\bmaida\b|\ball\s+purpose\s+flour\b/, label: 'maida / all-purpose flour' },
]

function toBilingualDisplayName(name: string) {
  const lower = name.toLowerCase()
  for (const entry of BILINGUAL_ITEM_PATTERNS) {
    if (entry.pattern.test(lower)) return entry.label
  }
  return name
}

function normalizeForHintMatch(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z\s-]/g, ' ')
    .replace(/chilies/g, 'chilli')
    .replace(/chillies/g, 'chilli')
    .replace(/chili/g, 'chilli')
    .replace(/basmathi/g, 'basmati')
    .replace(/tamato/g, 'tomato')
    .replace(/panear/g, 'paneer')
    .replace(/tomatos/g, 'tomato')
    .replace(/tomatoes/g, 'tomato')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a: string, b: string) {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 0; i <= m; i += 1) dp[i][0] = i
  for (let j = 0; j <= n; j += 1) dp[0][j] = j

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }

  return dp[m][n]
}

function similarityScore(a: string, b: string) {
  const aa = normalizeForHintMatch(a)
  const bb = normalizeForHintMatch(b)
  if (!aa || !bb) return 0
  if (aa === bb) return 1

  if (aa.includes(bb) || bb.includes(aa)) {
    return Math.min(0.96, Math.max(aa.length, bb.length) / (aa.length + bb.length))
  }

  const dist = levenshtein(aa, bb)
  const maxLen = Math.max(aa.length, bb.length)
  return 1 - dist / maxLen
}

function normalizeOcrCandidateName(name: string) {
  const words = normalizeForHintMatch(name)
    .split(/\s+/)
    .filter(Boolean)

  const trimmed = words.filter((w, index) => {
    const edge = index === 0 || index === words.length - 1
    if (!edge) return true
    if (w.length <= 1) return false
    if (NOISE_TOKENS.has(w)) return false
    return true
  })

  return trimmed.join(' ').trim()
}

function inferMatchedGroceryName(name: string) {
  const normalized = normalizeOcrCandidateName(name)
  if (!normalized) return null

  const compact = normalized.replace(/\s+/g, '')
  if (compact.length < 5) return null

  const tokens = normalized.split(/\s+/).filter(Boolean)
  const candidates = new Set<string>()
  candidates.add(normalized)

  // Try sliding windows to isolate product words from noisy brand/prefix text.
  for (let i = 0; i < tokens.length; i += 1) {
    for (let j = i; j < tokens.length; j += 1) {
      const chunk = tokens.slice(i, j + 1).join(' ').trim()
      if (chunk.length >= 3) candidates.add(chunk)
    }
  }

  let bestHint = ''
  let bestScore = 0

  for (const candidate of Array.from(candidates)) {
    for (const hint of FOOD_HINT_WORDS) {
      const score = similarityScore(candidate, hint)
      if (score > bestScore) {
        bestScore = score
        bestHint = hint
      }
    }
  }

  if (!bestHint) return null

  const minScore = compact.length < 7 ? 0.86 : compact.length < 11 ? 0.78 : 0.7
  if (bestScore < minScore) return null

  return toBilingualDisplayName(bestHint)
}

function findMatchedHints(name: string) {
  const normalizedName = normalizeForHintMatch(name)
  return FOOD_HINT_WORDS.filter((hint) => normalizedName.includes(normalizeForHintMatch(hint)))
}

function looksLikeValidFoodName(name: string) {
  const lower = name.toLowerCase().trim()
  if (!lower) return false

  if (WEEKDAY_TOKENS.some((day) => lower.includes(day))) return false

  const compact = lower.replace(/\s+/g, '')
  if (compact.length < 3) return false

  // Reject heavy repeated-character artifacts from OCR noise.
  if (/(.)\1\1/.test(compact)) return false

  const tokens = lower.split(/\s+/).filter(Boolean)
  if (tokens.length === 0 || tokens.length > 6) return false

  const vowelTokenCount = tokens.filter((t) => /[aeiou]/.test(t)).length
  const noVowelRatio = 1 - vowelTokenCount / tokens.length
  if (noVowelRatio > 0.4) return false

  const shortTokenCount = tokens.filter((t) => t.length <= 2).length
  if (shortTokenCount / tokens.length > 0.5) return false

  const frequency = new Map<string, number>()
  for (const token of tokens) {
    frequency.set(token, (frequency.get(token) || 0) + 1)
  }
  const maxRepeat = Math.max(...Array.from(frequency.values()))
  if (maxRepeat >= 3 && maxRepeat / tokens.length >= 0.34) return false

  return FOOD_HINT_WORDS.some((hint) => lower.includes(hint))
}

function isNoiseReceiptLine(line: string) {
  return RECEIPT_NOISE_PATTERNS.some((pattern) => pattern.test(line))
}

function isAllowedGroceryName(name: string) {
  const inferred = inferMatchedGroceryName(name)
  if (inferred) return true
  const displayName = toBilingualDisplayName(name)
  return findMatchedHints(displayName).length > 0
}

function extractQuantity(line: string) {
  const quantityUnitPattern =
    /(\d+(?:\.\d+)?)\s*(kg|g|gm|grams?|ml|l|ltr|litre|litres|pcs|pc|pack|pkt|dozen|dz|nos?|units?)\b/i
  const quantityOnlyPattern = /\bqty\s*[:x-]?\s*(\d+(?:\.\d+)?)\b/i

  const quantityUnitMatch = line.match(quantityUnitPattern)
  if (quantityUnitMatch) {
    const value = quantityUnitMatch[1]
    const unit = quantityUnitMatch[2].toLowerCase()
    return `${value} ${unit}`
  }

  const quantityOnlyMatch = line.match(quantityOnlyPattern)
  if (quantityOnlyMatch) {
    return `${quantityOnlyMatch[1]} unit`
  }

  return '1 unit'
}

function parseSelectiveReceipt(rawText: string): ParsedReceipt {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.replace(/[|]/g, ' ').replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0)

  const items: ParsedItem[] = []
  const cleanedData: ParsedReceipt['cleanedData'] = []
  const matchedData: ParsedReceipt['matchedData'] = []

  for (const line of lines) {
    const lower = line.toLowerCase()

    if (isNoiseReceiptLine(lower) || lower.includes('loyalty') || lower.includes('special') || lower.includes(' net ') || /^\*+$/.test(lower)) {
      continue
    }

    const cleanedName = line
      .replace(/\$?\d+\.\d{2}\s*$/g, '')
      .replace(/\b\d+(?:\.\d+)?\s*(kg|g|gm|grams?|ml|l|ltr|litre|litres|pcs|pc|pack|pkt|dozen|dz|nos?|units?)\b/gi, ' ')
      .replace(/\$?\d+\.\d{2}\s*$/g, '')
      .replace(/[^a-zA-Z\s&/-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const quantity = extractQuantity(line)

    let accepted = true
    if (cleanedName.length < 3) accepted = false
    if (!/[a-z]/i.test(cleanedName)) accepted = false
    if (!looksLikeValidFoodName(cleanedName)) accepted = false
    if (!isAllowedGroceryName(cleanedName)) accepted = false

    cleanedData.push({
      rawLine: line,
      cleanedName,
      quantity,
      accepted,
    })

    if (!accepted) continue

    const inferredName = inferMatchedGroceryName(cleanedName)
    if (!inferredName) {
      cleanedData[cleanedData.length - 1].accepted = false
      continue
    }

    const displayName = inferredName
    const matchedHints = findMatchedHints(displayName)

    items.push({
      ocrName: cleanedName,
      name: displayName,
      quantity,
    })

    matchedData.push({
      name: displayName,
      quantity,
      matchedHints,
    })
  }

  return {
    items,
    cleanedData,
    matchedData,
  }
}

export default function OcrTestPage() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [ocrText, setOcrText] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [ocrMode, setOcrMode] = useState<'server' | 'browser' | ''>('')
  const [showReview, setShowReview] = useState(false)
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([])
  const [confirmedItems, setConfirmedItems] = useState<ReviewItem[]>([])
  const [reviewError, setReviewError] = useState('')

  const parsed = useMemo(() => {
    if (!ocrText.trim()) return null
    return parseSelectiveReceipt(ocrText)
  }, [ocrText])

  useEffect(() => {
    if (!parsed || parsed.items.length === 0) return

    const initialReviewItems = parsed.items.map((item, index) => ({
      id: `scan-${index}-${item.name}`,
      ocrName: item.ocrName,
      matchedName: item.name,
      quantity: item.quantity,
      storage: 'room_temp' as StorageTechnique,
    }))

    setReviewItems(initialReviewItems)
    setShowReview(true)
  }, [parsed])

  const fileInfo = useMemo(() => {
    if (!file) return ''
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2)
    return `${file.name} (${sizeMb} MB)`
  }, [file])

  const onPickFile = (nextFile: File | null) => {
    setFile(nextFile)
    setOcrText('')
    setError('')

    if (!nextFile) {
      setPreviewUrl('')
      return
    }

    const objectUrl = URL.createObjectURL(nextFile)
    setPreviewUrl(objectUrl)
  }

  const runOcr = async () => {
    if (!file) {
      setError('Please choose an image first.')
      return
    }

    setIsLoading(true)
    setError('')
    setOcrText('')
    setShowReview(false)
    setReviewItems([])
    setReviewError('')

    try {
      const form = new FormData()
      form.append('image', file)

      const res = await fetch('/api/public/ocr-only', {
        method: 'POST',
        body: form,
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || 'OCR failed')
      }

      setOcrText(String(data?.ocrText || ''))
      setOcrMode('server')
    } catch (e: any) {
      // Fallback to in-browser OCR when external service is unavailable.
      try {
        const { recognize } = await import('tesseract.js')
        const result = await recognize(file, 'eng')
        const text = String(result?.data?.text || '').trim()

        if (!text) {
          throw new Error('No text detected from image')
        }

        setOcrText(text)
        setOcrMode('browser')
      } catch (fallbackError: any) {
        setError(fallbackError?.message || e?.message || 'OCR request failed')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const updateReviewItem = (id: string, patch: Partial<ReviewItem>) => {
    setReviewItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const removeReviewItem = (id: string) => {
    setReviewItems((prev) => prev.filter((item) => item.id !== id))
  }

  const addReviewItem = () => {
    setReviewItems((prev) => [
      ...prev,
      {
        id: `manual-${Date.now()}-${prev.length}`,
        ocrName: 'manual item',
        matchedName: '',
        quantity: '1 unit',
        storage: 'room_temp',
      },
    ])
  }

  const confirmReview = () => {
    setReviewError('')

    const cleaned = reviewItems
      .map((item) => ({
        ...item,
        matchedName: item.matchedName.trim(),
        quantity: item.quantity.trim() || '1 unit',
      }))
      .filter((item) => item.matchedName.length > 0)

    const invalidItems = cleaned.filter((item) => !isAllowedGroceryName(item.matchedName))
    if (invalidItems.length > 0) {
      setReviewError(
        `Only valid groceries are allowed. Please fix or remove: ${invalidItems
          .map((i) => `${i.ocrName} -> ${i.matchedName}`)
          .join(', ')}`
      )
      return
    }

    setConfirmedItems(cleaned)
    setShowReview(false)
  }

  const storageButtonClass = (active: boolean) =>
    `border-2 border-black px-2 py-1 font-ibm-mono text-[10px] uppercase tracking-[0.14em] ${
      active ? 'bg-[#93E1A8] text-black' : 'bg-white text-textMain'
    }`

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl rounded-none border-2 border-black bg-white p-6 shadow-[10px_10px_0_0_rgba(0,0,0,1)]">
        <h1 className="font-anton text-4xl uppercase leading-none">OCR Test Only</h1>
        <p className="mt-3 font-ibm-mono text-xs uppercase tracking-[0.2em] text-textMuted">
          Upload a receipt image and run OCR plus selective parsing.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="space-y-4">
            <label className="block border-2 border-black bg-[#F6F1E7] p-4">
              <span className="block font-ibm-mono text-[10px] uppercase tracking-[0.24em] text-textMuted">
                Receipt Image
              </span>
              <input
                className="mt-3 block w-full font-ibm-mono text-sm"
                type="file"
                accept="image/*"
                onChange={(e) => onPickFile(e.target.files?.[0] || null)}
              />
            </label>

            {fileInfo ? (
              <p className="font-ibm-mono text-xs uppercase tracking-[0.12em] text-textMuted">{fileInfo}</p>
            ) : null}

            <button
              type="button"
              onClick={runOcr}
              disabled={isLoading}
              className="min-h-11 border-2 border-black bg-[#FFE66D] px-4 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.24em] text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-50"
            >
              {isLoading ? 'Running OCR...' : 'Run OCR'}
            </button>

            {previewUrl ? (
              <img src={previewUrl} alt="Receipt preview" className="max-h-[420px] w-full border-2 border-black object-contain" />
            ) : null}
          </section>

          <section className="space-y-3">
            <p className="font-ibm-mono text-[10px] uppercase tracking-[0.24em] text-textMuted">OCR Output</p>
            {ocrMode ? (
              <p className="font-ibm-mono text-[10px] uppercase tracking-[0.2em] text-textMuted">
                Mode: {ocrMode === 'server' ? 'Server OCR' : 'Browser OCR (No Docker)'}
              </p>
            ) : null}
            <textarea
              className="h-[520px] w-full resize-none border-2 border-black bg-[#FCFCF9] p-3 font-mono text-sm"
              value={ocrText}
              readOnly
              placeholder="OCR text will appear here..."
            />

            {error ? (
              <p className="border-2 border-black bg-[#FFDDD6] p-3 font-ibm-mono text-xs uppercase tracking-[0.12em] text-[#93000A]">
                {error}
              </p>
            ) : null}
          </section>
        </div>

        <section className="mt-6 space-y-3">
          <p className="font-ibm-mono text-[10px] uppercase tracking-[0.24em] text-textMuted">Selective Parsed Output</p>
          <textarea
            className="h-[220px] w-full resize-none border-2 border-black bg-[#F5F9FF] p-3 font-mono text-sm"
            value={parsed ? JSON.stringify(parsed.items, null, 2) : ''}
            readOnly
            placeholder="Only name + quantity will appear here..."
          />
        </section>

        <section className="mt-6 space-y-3">
          <p className="font-ibm-mono text-[10px] uppercase tracking-[0.24em] text-textMuted">Cleaned Output</p>
          <textarea
            className="h-[220px] w-full resize-none border-2 border-black bg-[#F4FFF4] p-3 font-mono text-sm"
            value={parsed ? JSON.stringify(parsed.cleanedData, null, 2) : ''}
            readOnly
            placeholder="Cleaned candidate data will appear here..."
          />
        </section>

        <section className="mt-6 space-y-3">
          <p className="font-ibm-mono text-[10px] uppercase tracking-[0.24em] text-textMuted">Matched List Output</p>
          <textarea
            className="h-[220px] w-full resize-none border-2 border-black bg-[#FFF8F0] p-3 font-mono text-sm"
            value={parsed ? JSON.stringify(parsed.matchedData, null, 2) : ''}
            readOnly
            placeholder="Data matching item hint list will appear here..."
          />
        </section>

        <section className="mt-6 space-y-3">
          <p className="font-ibm-mono text-[10px] uppercase tracking-[0.24em] text-textMuted">Confirmed Output</p>
          <textarea
            className="h-[220px] w-full resize-none border-2 border-black bg-[#F3F7FF] p-3 font-mono text-sm"
            value={confirmedItems.length > 0 ? JSON.stringify(confirmedItems, null, 2) : ''}
            readOnly
            placeholder="After review, confirmed items will appear here..."
          />
        </section>
      </div>

      {showReview ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-auto border-2 border-black bg-white p-5 shadow-[10px_10px_0_0_rgba(0,0,0,1)]">
            <p className="font-anton text-3xl uppercase leading-none">Review Scanned Items</p>
            <p className="mt-2 font-ibm-mono text-[10px] uppercase tracking-[0.2em] text-textMuted">
              Compare OCR name with matched grocery name, edit matched name if needed, then choose refrigeration technique.
            </p>
            {reviewError ? (
              <p className="mt-3 border-2 border-black bg-[#FFDDD6] p-3 font-ibm-mono text-xs uppercase tracking-[0.12em] text-[#93000A]">
                {reviewError}
              </p>
            ) : null}

            <div className="mt-5 space-y-3">
              {reviewItems.map((item) => (
                <div key={item.id} className="border-2 border-black bg-[#FCFCF9] p-3">
                  <div className="grid gap-3 md:grid-cols-[1fr_1fr_0.7fr_auto]">
                    <input
                      value={item.ocrName}
                      readOnly
                      className="border-2 border-black bg-[#EFEFEF] px-3 py-2 font-mono text-sm"
                      placeholder="OCR name"
                      title="Detected from OCR"
                    />
                    <input
                      value={item.matchedName}
                      onChange={(e) => updateReviewItem(item.id, { matchedName: e.target.value })}
                      className="border-2 border-black bg-white px-3 py-2 font-mono text-sm"
                      placeholder="Matched grocery name"
                      title="Supposed matched item"
                    />
                    <input
                      value={item.quantity}
                      onChange={(e) => updateReviewItem(item.id, { quantity: e.target.value })}
                      className="border-2 border-black bg-white px-3 py-2 font-mono text-sm"
                      placeholder="Quantity"
                    />
                    <button
                      type="button"
                      onClick={() => removeReviewItem(item.id)}
                      className="border-2 border-black bg-[#FFD7D7] px-3 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.16em]"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-2 grid gap-2 text-[10px] font-ibm-mono uppercase tracking-[0.14em] text-textMuted md:grid-cols-2">
                    <p>OCR Name (Detected)</p>
                    <p>Matched Item (Editable)</p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => updateReviewItem(item.id, { storage: 'room_temp' })}
                      className={storageButtonClass(item.storage === 'room_temp')}
                    >
                      Room Temp
                    </button>
                    <button
                      type="button"
                      onClick={() => updateReviewItem(item.id, { storage: 'fridge' })}
                      className={storageButtonClass(item.storage === 'fridge')}
                    >
                      Fridge
                    </button>
                    <button
                      type="button"
                      onClick={() => updateReviewItem(item.id, { storage: 'freezer' })}
                      className={storageButtonClass(item.storage === 'freezer')}
                    >
                      Freezer
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={addReviewItem}
                className="border-2 border-black bg-[#DDE8FF] px-4 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.16em]"
              >
                Add Item
              </button>
              <button
                type="button"
                onClick={confirmReview}
                className="border-2 border-black bg-[#93E1A8] px-4 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.16em]"
              >
                Confirm and Save
              </button>
              <button
                type="button"
                onClick={() => setShowReview(false)}
                className="border-2 border-black bg-[#FFE66D] px-4 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.16em]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
