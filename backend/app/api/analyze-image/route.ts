import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import connectDB from '@/lib/mongodb'
import { User } from '@/models'
import { prisma } from '@/lib/prisma'
import { lookupShelfLife, SHELF_LIFE_DB } from '@/lib/shelfLifeDb'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getOrCreateDbUser() {
  const { userId } = await auth()
  if (!userId) return null

  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress
  if (!email) return null

  await connectDB()

  let user = await User.findOne({ email })
  if (!user) {
    user = await User.create({
      email,
      name: clerkUser?.fullName || clerkUser?.firstName || undefined,
      image: clerkUser?.imageUrl,
    })
  }

  return user
}

function normalizeText(value: string) {
  return value.replace(/[|]/g, ' ').replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim()
}

type ParsedReceiptItem = {
  ocrName: string
  matchedName: string
  quantity: number
  unit: string
  suggestedStorage: 'room_temp' | 'refrigerator' | 'freezer'
}

const FOOD_HINT_WORDS = [
  'apple', 'apples', 'banana', 'broccoli', 'carrot', 'grape', 'lettuce', 'tomato', 'potato', 'milk', 'egg', 'bread', 'rice', 'onion',
  'cabbage', 'spinach', 'peas', 'atta', 'maida', 'suji', 'sooji', 'rava', 'poha', 'daliya', 'bajra', 'jowar', 'ragi',
  'basmati', 'sona masoori', 'dal', 'toor', 'arhar', 'moong', 'masoor', 'urad', 'chana', 'rajma', 'kabuli', 'lobia',
  'bhindi', 'okra', 'baingan', 'brinjal', 'karela', 'lauki', 'bottle gourd', 'methi', 'palak', 'coriander', 'dhania',
  'mint', 'pudina', 'cauliflower', 'capsicum', 'coconut', 'nariyal', 'chilli', 'chili', 'ginger', 'garlic', 'mango',
  'papaya', 'guava', 'pomegranate', 'chikoo', 'sapota', 'amla', 'jamun', 'anar', 'curd', 'dahi', 'paneer', 'ghee',
  'buttermilk', 'lassi', 'yogurt', 'butter', 'honey', 'haldi', 'turmeric', 'jeera', 'cumin', 'rai', 'mustard', 'hing', 'ajwain',
  'elaichi', 'cardamom', 'clove', 'dalchini', 'cinnamon', 'garam masala', 'chilli powder', 'mustard oil', 'groundnut oil',
  'sunflower oil', 'jaggery', 'gur', 'sugar', 'salt', 'pickle', 'achar', 'papad', 'vermicelli', 'sevai', 'idli rice',
]

const RECEIPT_NOISE_PATTERNS: RegExp[] = [
  /^subtotal\b/i,
  /^total\b/i,
  /^cash\b/i,
  /^change\b/i,
  /^discount\b/i,
  /^tax\b/i,
  /\bthank\s*you\b/i,
  /\bshopping\b/i,
  /\breceipt\b/i,
  /\binvoice\b/i,
  /\bphone\b/i,
  /\bmobile\b/i,
  /\broad\b/i,
  /\bstreet\b/i,
  /\bmarket\b/i,
]

const NOISE_TOKENS = new Set(['sse', 'f', 'a', 'ay', 'be', 'mrp', 'rs', 'inr', 'item', 'code'])

const BILINGUAL_ITEM_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bbhindi\b|\bokra\b/, label: 'bhindi / okra' },
  { pattern: /\bbaingan\b|\bbrinjal\b|\beggplant\b/, label: 'baingan / brinjal' },
  { pattern: /\bkarela\b|\bbitter\s+gourd\b/, label: 'karela / bitter gourd' },
  { pattern: /\blauki\b|\bbottle\s+gourd\b/, label: 'lauki / bottle gourd' },
  { pattern: /\bmethi\b|\bfenugreek\b/, label: 'methi / fenugreek' },
  { pattern: /\bpalak\b|\bspinach\b/, label: 'palak / spinach' },
  { pattern: /\bcoconut\b|\bnariyal\b/, label: 'nariyal / coconut' },
  { pattern: /\bdhania\b|\bcoriander\b/, label: 'dhania / coriander' },
  { pattern: /\bpudina\b|\bmint\b/, label: 'pudina / mint' },
  { pattern: /\bhaldi\b|\bturmeric\b/, label: 'haldi / turmeric' },
  { pattern: /\bjeera\b|\bcumin\b/, label: 'jeera / cumin' },
  { pattern: /\bdahi\b|\bcurd\b|\byogurt\b/, label: 'dahi / curd' },
  { pattern: /\bchikoo\b|\bsapota\b/, label: 'chikoo / sapota' },
  { pattern: /\banar\b|\bpomegranate\b/, label: 'anar / pomegranate' },
  { pattern: /\bsooji\b|\bsuji\b|\brava\b|\bsemolina\b/, label: 'suji / semolina' },
  { pattern: /\bpoha\b|\bflattened\s+rice\b/, label: 'poha / flattened rice' },
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

  // Try our realistic shelfLifeDb first
  const shelfMatch = lookupShelfLife(normalized)
  if (shelfMatch) return toBilingualDisplayName(normalized)

  const tokens = normalized.split(/\s+/).filter(Boolean)
  const candidates = new Set<string>()
  candidates.add(normalized)

  for (let i = 0; i < tokens.length; i += 1) {
    for (let j = i; j < tokens.length; j += 1) {
      const chunk = tokens.slice(i, j + 1).join(' ').trim()
      if (chunk.length >= 3) candidates.add(chunk)
    }
  }

  let bestHint = ''
  let bestScore = 0
  
  // Combine custom hints with DB keys for matching
  const allHints = Array.from(new Set([...FOOD_HINT_WORDS, ...Object.keys(SHELF_LIFE_DB)]))

  for (const candidate of Array.from(candidates)) {
    for (const hint of allHints) {
      const score = similarityScore(candidate, hint)
      if (score > bestScore) {
        bestScore = score
        bestHint = hint
      }
    }
  }

  if (!bestHint || bestScore < 0.67) return null
  return toBilingualDisplayName(bestHint)
}

function isNoiseReceiptLine(line: string) {
  return RECEIPT_NOISE_PATTERNS.some((pattern) => pattern.test(line))
}

function extractQuantityAndUnit(line: string) {
  const quantityUnitPattern =
    /(\d+(?:\.\d+)?)\s*(kg|g|gm|grams?|ml|l|ltr|litre|litres|pcs|pc|pack|pkt|dozen|dz|nos?|units?)\b/i
  const quantityOnlyPattern = /\bqty\s*[:x-]?\s*(\d+(?:\.\d+)?)\b/i

  const quantityUnitMatch = line.match(quantityUnitPattern)
  if (quantityUnitMatch) {
    const quantity = Number(quantityUnitMatch[1]) || 1
    const unitRaw = quantityUnitMatch[2].toLowerCase()

    if (unitRaw === 'kg') return { quantity, unit: 'kg' }
    if (unitRaw === 'g' || unitRaw === 'gm' || unitRaw.startsWith('gram')) return { quantity, unit: 'g' }
    if (unitRaw === 'ml') return { quantity, unit: 'mL' }
    if (unitRaw === 'l' || unitRaw === 'ltr' || unitRaw.startsWith('litr')) return { quantity, unit: 'L' }
    if (unitRaw === 'pack' || unitRaw === 'pkt') return { quantity, unit: 'packages' }
    if (unitRaw === 'dozen' || unitRaw === 'dz') return { quantity: quantity * 12, unit: 'pieces' }
    return { quantity, unit: 'pieces' }
  }

  const quantityOnlyMatch = line.match(quantityOnlyPattern)
  if (quantityOnlyMatch) {
    return { quantity: Number(quantityOnlyMatch[1]) || 1, unit: 'pieces' }
  }

  return { quantity: 1, unit: 'pieces' }
}

function extractDateFromText(text: string) {
  const patterns = [
    /\b(\d{4}[/-]\d{1,2}[/-]\d{1,2})\b/,
    /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/,
    /\b([A-Za-z]{3,9}\s+\d{1,2},?\s+\d{2,4})\b/,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return match[1]
  }

  return null
}

function isLikelyReceiptText(text: string) {
  const sample = text.toLowerCase()
  const receiptSignals = [
    'receipt',
    'subtotal',
    'total',
    'tax',
    'cash',
    'card',
    'change',
    'date',
    'time',
    'qty',
    'price',
    'amount',
  ]

  const signalCount = receiptSignals.filter((signal) => sample.includes(signal)).length
  const priceLikeTokens = (sample.match(/\b\d+[.,]\d{2}\b/g) || []).length
  const itemLikeLines = sample
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 1 && /[a-z]/i.test(line) && /\d/.test(line)).length

  return signalCount >= 2 || priceLikeTokens >= 2 || itemLikeLines >= 3
}

function parseSelectiveReceipt(rawText: string): ParsedReceiptItem[] {
  const lines = rawText
    .split(/\n+/)
    .map((line) => line.replace(/[|]/g, ' ').replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0)

  const items: ParsedReceiptItem[] = []

  for (const line of lines) {
    const lower = line.toLowerCase()
    if (isNoiseReceiptLine(lower) || lower.includes('loyalty') || lower.includes('special') || /^\*+$/.test(lower)) {
      continue
    }

    const cleanedName = line
      .replace(/\$?\d+\.\d{2}\s*$/g, '')
      .replace(/\b\d+(?:\.\d+)?\s*(kg|g|gm|grams?|ml|l|ltr|litre|litres|pcs|pc|pack|pkt|dozen|dz|nos?|units?)\b/gi, ' ')
      .replace(/[^a-zA-Z\s&/-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (cleanedName.length < 3 || !/[a-z]/i.test(cleanedName)) continue

    const inferredName = inferMatchedGroceryName(cleanedName)
    if (!inferredName) continue

    const { quantity, unit } = extractQuantityAndUnit(line)
    
    // Determine storage and category from our smart DB
    const shelfEntry = lookupShelfLife(inferredName)
    const storageId = shelfEntry?.defaultStorage || 'room'
    const suggestedStorage: ParsedReceiptItem['suggestedStorage'] = 
      storageId === 'freezer' ? 'freezer' : storageId === 'fridge' ? 'refrigerator' : 'room_temp'

    items.push({
      ocrName: cleanedName,
      matchedName: inferredName,
      quantity,
      unit,
      suggestedStorage,
    })
  }

  return items
}

function scoreProductMatch(line: string, productName: string) {
  const lineLower = line.toLowerCase()
  const productLower = productName.toLowerCase()

  if (!lineLower || !productLower) return 0
  if (lineLower === productLower) return 1
  if (lineLower.includes(productLower) || productLower.includes(lineLower)) return 0.9

  const productTokens = productLower.split(/\s+/).filter((token) => token.length > 2)
  if (productTokens.length === 0) return 0

  let matchedTokens = 0
  for (const token of productTokens) {
    if (lineLower.includes(token)) matchedTokens++
  }

  const tokenScore = matchedTokens / productTokens.length
  const lengthScore = Math.min(productLower.length, lineLower.length) / Math.max(productLower.length, lineLower.length)
  return tokenScore * 0.8 + lengthScore * 0.2
}

function mapParsedItemsToProducts(parsedItems: ParsedReceiptItem[], products: any[]) {
  const mappedItems: any[] = []

  for (const parsed of parsedItems) {
    let bestMatch: any = null
    let highestScore = 0

    for (const product of products) {
      const score = scoreProductMatch(parsed.matchedName, product.name)
      if (score > highestScore) {
        highestScore = score
        bestMatch = product
      }
    }

    if (bestMatch && highestScore >= 0.42) {
      mappedItems.push({
        ocrName: parsed.ocrName,
        name: bestMatch.name,
        category: bestMatch.category || 'Uncategorized',
        quantity: parsed.quantity,
        unit: parsed.unit,
        suggestedStorage: parsed.suggestedStorage,
        matchedProductId: bestMatch.id,
        matchedProductName: bestMatch.name,
      })
      continue
    }

    mappedItems.push({
      ocrName: parsed.ocrName,
      name: parsed.matchedName,
      category: 'Uncategorized',
      quantity: parsed.quantity,
      unit: parsed.unit,
      suggestedStorage: parsed.suggestedStorage,
      matchedProductId: null,
      matchedProductName: null,
    })
  }

  return mappedItems
}

function dedupeItems(items: any[]) {
  const seen = new Set<string>()
  const deduped: any[] = []

  for (const item of items) {
    const key = `${(item.ocrName || item.name || '').toLowerCase()}|${item.quantity}|${item.unit}`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(item)
  }

  return deduped
}

async function extractTextFromReceiptOcrApi(imageBuffer: Buffer, mimeType: string) {
  const apiBaseUrl = process.env.RECEIPT_OCR_API_URL?.trim()
  if (!apiBaseUrl) return null

  const ocrPath = process.env.RECEIPT_OCR_OCR_PATH?.trim() || '/ocr/'
  const endpoint = new URL(ocrPath, apiBaseUrl).toString()

  const form = new FormData()
  const fileBytes = Uint8Array.from(imageBuffer)
  form.append('file', new Blob([fileBytes], { type: mimeType || 'image/jpeg' }), 'receipt.jpg')

  const response = await fetch(endpoint, {
    method: 'POST',
    body: form,
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`receipt-ocr API failed with status ${response.status}`)
  }

  const payload = await response.json().catch(() => null)
  if (!payload || typeof payload !== 'object') return null

  // tesseract_ocr API response shape: { result: "..." }
  const rawResult = (payload as { result?: unknown }).result
  if (typeof rawResult === 'string') {
    return normalizeText(rawResult)
  }

  // Alternate shape support if service returns { ocrText: "..." }
  const altResult = (payload as { ocrText?: unknown }).ocrText
  if (typeof altResult === 'string') {
    return normalizeText(altResult)
  }

  return null
}

async function extractTextFromImage(imageBuffer: Buffer, mimeType: string) {
  const textFromService = await extractTextFromReceiptOcrApi(imageBuffer, mimeType)
  if (!textFromService) {
    throw new Error('Receipt OCR service unavailable. Configure RECEIPT_OCR_API_URL and ensure service is running.')
  }

  return { text: textFromService, provider: 'receipt-ocr' as const }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateDbUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const imageFile = formData.get('image') as File | null
    const extractedTextInput = String(formData.get('extractedText') || '').trim()

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
    if (!validTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { error: 'Invalid image type. Please upload a JPEG, PNG, or WebP image.' },
        { status: 400 }
      )
    }

    if (imageFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image too large. Please upload an image under 5MB.' },
        { status: 400 }
      )
    }

    await connectDB()
    const products = await prisma.product.findMany({
      select: { id: true, name: true, category: true },
    })

    const bytes = Buffer.from(await imageFile.arrayBuffer())
    const ocrResult = extractedTextInput
      ? { text: extractedTextInput, provider: 'pre-extracted' as const }
      : await extractTextFromImage(bytes, imageFile.type)
    const extractedText = ocrResult.text

    if (!extractedText) {
      return NextResponse.json(
        { error: 'Could not read text from image. Please try a clearer photo.' },
        { status: 422 }
      )
    }

    const receiptDetected = isLikelyReceiptText(extractedText)
    const purchaseDate = receiptDetected ? extractDateFromText(extractedText) : null
    const parsedItems = parseSelectiveReceipt(extractedText)
    const mappedItems = dedupeItems(mapParsedItemsToProducts(parsedItems, products))

    return NextResponse.json({
      success: true,
      isReceipt: receiptDetected,
      purchase_date: purchaseDate,
      items: mappedItems,
      summary: receiptDetected
        ? purchaseDate
          ? `Receipt parsed. Purchase date: ${purchaseDate}`
          : 'Receipt parsed. Purchase date unclear.'
        : 'Processed using simple OCR parsing.',
      ocrProvider: ocrResult.provider,
      totalItemsDetected: mappedItems.length,
      ocrText: extractedText,
    })
  } catch (error) {
    console.error('Image analysis error:', error)

    return NextResponse.json(
      { error: 'Failed to process image. Please try again with a clearer photo.' },
      { status: 500 }
    )
  }
}
