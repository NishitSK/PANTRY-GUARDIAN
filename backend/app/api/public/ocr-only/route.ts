import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function normalizeText(value: string) {
  return value.replace(/[|]/g, ' ').replace(/\s+/g, ' ').trim()
}

class UpstreamOcrError extends Error {
  status: number
  details: string

  constructor(status: number, message: string, details = '') {
    super(message)
    this.name = 'UpstreamOcrError'
    this.status = status
    this.details = details
  }
}

async function extractTextFromReceiptOcrApi(imageBuffer: Buffer, mimeType: string) {
  const apiBaseUrl = process.env.RECEIPT_OCR_API_URL?.trim()
  if (!apiBaseUrl) {
    throw new Error('RECEIPT_OCR_API_URL is not configured')
  }

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
    const details = await response.text().catch(() => '')
    throw new UpstreamOcrError(
      response.status,
      `receipt-ocr API failed with status ${response.status}`,
      details.slice(0, 240)
    )
  }

  const payload = await response.json().catch(() => null)
  if (!payload || typeof payload !== 'object') {
    throw new Error('receipt-ocr API returned invalid JSON')
  }

  const rawResult = (payload as { result?: unknown }).result
  if (typeof rawResult === 'string') {
    return normalizeText(rawResult)
  }

  const altResult = (payload as { ocrText?: unknown }).ocrText
  if (typeof altResult === 'string') {
    return normalizeText(altResult)
  }

  throw new Error('receipt-ocr API returned no text')
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const imageFile = formData.get('image') as File | null

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

    const bytes = Buffer.from(await imageFile.arrayBuffer())
    const ocrText = await extractTextFromReceiptOcrApi(bytes, imageFile.type)

    return NextResponse.json({
      success: true,
      ocrProvider: 'receipt-ocr',
      ocrText,
      chars: ocrText.length,
      lines: ocrText.split(/\n+/).filter((line) => line.trim().length > 0).length,
    })
  } catch (error) {
    if (error instanceof UpstreamOcrError) {
      // Keep logs concise so client fallback remains the primary behavior.
      console.warn(`OCR-only upstream error ${error.status}: ${error.details || error.message}`)
      return NextResponse.json(
        {
          error: `OCR service blocked request (${error.status}). Falling back to browser OCR is recommended.`,
          upstreamStatus: error.status,
        },
        { status: error.status }
      )
    }

    console.warn('OCR-only test error:', (error as Error)?.message || 'unknown error')

    return NextResponse.json(
      { error: 'OCR test failed. Check receipt-ocr service and env settings.' },
      { status: 500 }
    )
  }
}
