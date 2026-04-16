import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import OpenAI from 'openai'
import connectDB from '@/lib/mongodb'
import { Product } from '@/models'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
    ]

    const signalCount = receiptSignals.filter((signal) => sample.includes(signal)).length
    const priceLikeTokens = (sample.match(/\b\d+[.,]\d{2}\b/g) || []).length

    return signalCount >= 2 || priceLikeTokens >= 2
}

function mapReceiptItemsToProducts(receiptItems: Array<{ name: string }>, products: any[]) {
    return receiptItems.map((item) => {
        const itemName = item.name.trim().toLowerCase()
        const matchedProduct = products.find((p) => {
            const productName = p.name.toLowerCase()
            return (
                productName === itemName ||
                productName.includes(itemName) ||
                itemName.includes(productName)
            )
        })

        return {
            name: item.name,
            category: matchedProduct?.category || 'Uncategorized',
            quantity: 1,
            unit: 'pieces',
            suggestedStorage: 'room_temp',
            matchedProductId: matchedProduct?._id?.toString() || null,
            matchedProductName: matchedProduct?.name || null,
        }
    })
}

function createOpenAIClient() {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
        return null
    }

    return new OpenAI({
        apiKey,
    })
}

export async function POST(req: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Parse form data with the image
        const formData = await req.formData()
        const imageFile = formData.get('image') as File | null
        const extractedText = formData.get('extractedText') as string | null

        if (!imageFile) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 })
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
        if (!validTypes.includes(imageFile.type)) {
            return NextResponse.json(
                { error: 'Invalid image type. Please upload a JPEG, PNG, or WebP image.' },
                { status: 400 }
            )
        }

        // Validate file size (max 5MB)
        if (imageFile.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'Image too large. Please upload an image under 5MB.' },
                { status: 400 }
            )
        }

        await connectDB()

        // Get existing products from database to help with matching
        const products = await Product.find().select('_id name category baseShelfLifeDays').lean()

        // ---------------------------------------------------------
        // OpenAI Logic
        // ---------------------------------------------------------

        let itemsInfo: any[] = []
        let summaryInfo = ""
        let aiSuccess = false
        const openai = createOpenAIClient()
        const useReceiptMode = !!extractedText && extractedText.trim().length > 8 && isLikelyReceiptText(extractedText)

        if (openai) {
            try {
                console.log("Attempting OpenAI analysis...")

                // Convert file to base64
                const bytes = await imageFile.arrayBuffer()
                const base64Image = Buffer.from(bytes).toString('base64')
                const dataUrl = `data:${imageFile.type};base64,${base64Image}`

                let promptText = `You are a food identification expert. Analyze this image and identify all food items.
            Respond ONLY with a valid JSON object: { "items": [{ "name": "string", "category": "string", "quantity": number, "unit": "string", "suggestedStorage": "string" }], "summary": "string" }`;

                if (useReceiptMode && extractedText) {
                                        promptText = `You are a receipt processing agent for a food expiry prediction system.

Input:
Raw OCR text extracted from a receipt. The text may contain errors, noise, broken words, or irrelevant information.

Your task:
1. Extract the purchase date from the receipt.
2. Identify ONLY food-related items.
3. Clean and normalize item names (e.g., "MLK" -> "milk", "BRD" -> "bread" if obvious).
4. Ignore non-food items such as toiletries, cleaning products, etc.
5. Ignore unreadable or uncertain words.

OCR text:
"""${extractedText}"""

Output:
Return ONLY valid JSON in the following format:
{
    "purchase_date": "",
    "items": [
        {"name": ""}
    ]
}

Rules:
- Do not include explanations or extra text.
- Do not hallucinate items.
- If purchase date is not found, return null.
- Keep item names simple and lowercase.
- Be robust to OCR errors and partial words.

Goal:
Provide accurate and minimal structured data for expiry prediction.`
                } else if (extractedText && extractedText.length > 5) {
                    promptText = `Analyze this image. I have also extracted this text from the image using OCR: """${extractedText}""". 
                
                IMPORTANT INSTRUCTIONS:
                1. If the image is a RECEIPT or LIST, rely heavily on the extracted text to identify items.
                2. If the image is of REAL FOOD ITEMS (like fruit, veg, packaging), prioritize what you SEE in the image. The text might be noise or irrelevant (e.g. barcodes, brand text).
                3. Ignore nonsense OCR text like "p=|", "l|", etc.
                4. Respond with the same JSON format as above.`;
                }

                const response = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: promptText },
                                {
                                    type: "image_url",
                                    image_url: {
                                        url: dataUrl,
                                    },
                                },
                            ],
                        },
                    ],
                    max_tokens: 1000,
                    response_format: { type: "json_object" },
                })

                const content = response.choices[0].message.content;
                if (content) {
                    const analysisResult = JSON.parse(content);
                    if (useReceiptMode) {
                        const receiptItems = Array.isArray(analysisResult.items)
                            ? analysisResult.items
                                  .filter((item: any) => typeof item?.name === 'string' && item.name.trim().length > 1)
                                  .map((item: any) => ({ name: item.name.trim() }))
                            : []

                        itemsInfo = mapReceiptItemsToProducts(receiptItems, products)
                        const purchaseDate = analysisResult.purchase_date ?? null
                        summaryInfo = purchaseDate
                            ? `Receipt parsed. Purchase date: ${purchaseDate}`
                            : 'Receipt parsed. Purchase date unclear.'
                    } else {
                        itemsInfo = analysisResult.items || [];
                        summaryInfo = analysisResult.summary || "AI Analysis Complete";
                    }
                    aiSuccess = true;
                }

            } catch (aiError) {
                console.warn("OpenAI Analysis Failed (Falling back to local):", aiError)
                // Fallthrough to local parsing
            }
        }

        // 2. If AI failed, use Local Parsing (Same as before)
        if (!aiSuccess) {
            console.log('Using local text parsing fallback.')

            if (!extractedText || extractedText.trim().length < 3) {
                // If we also don't have text, then we really failed
                if (!aiSuccess && (!extractedText || extractedText.length < 3)) {
                    return NextResponse.json({
                        success: false,
                        items: [],
                        summary: "Could not identify items. Please try a clearer photo or manually add items.",
                        totalItemsDetected: 0
                    })
                }
            } else {
                // Local Parsing Logic (Regex/Heuristic)
                const lines = extractedText.split(/\n+/).map(l => l.trim()).filter(l => l.length > 2);

                for (const line of lines) {
                    // Skip common receipt junk
                    if (line.match(/total|subtotal|tax|change|cash|card|date|time|tel|fax|receipt/i)) continue;
                    if (line.match(/^\d+$/)) continue;

                    // Try to match against database
                    let bestMatch: any = null;
                    let highestScore = 0;

                    for (const p of products) {
                        const pName = p.name.toLowerCase();
                        const lName = line.toLowerCase();

                        // Strategy 1: Exact substring match (Original)
                        if (lName.includes(pName)) {
                            const score = pName.length / lName.length;
                            if (score > highestScore) {
                                highestScore = score;
                                bestMatch = p;
                            }
                        }

                        // Strategy 2: Token-based overlap (Smart Matching)
                        const pTokens = pName.split(/\s+/).filter(t => t.length > 2);

                        if (pTokens.length > 0) {
                            let matchedTokens = 0;
                            for (const token of pTokens) {
                                if (lName.includes(token)) {
                                    matchedTokens++;
                                }
                            }

                            // Calculate score: What % of the PRODUCT words are in the RECEIPT line?
                            const tokenScore = matchedTokens / pTokens.length;

                            // We require a high overlap (e.g., most of the product words must be there)
                            if (tokenScore >= 0.8) {
                                // Check length ratio to filter out very long lines matching short words (e.g. "coconut oil" matching "oil")
                                // unless the token match is perfect.
                                const lengthRatio = pName.length / lName.length;

                                // Weighted score: 80% based on tokens, 20% based on length similarity
                                const weightedScore = (tokenScore * 0.8) + (lengthRatio * 0.2);

                                if (weightedScore > highestScore) {
                                    highestScore = weightedScore;
                                    bestMatch = p;
                                }
                            }
                        }
                    }

                    if (bestMatch && highestScore > 0.4) {
                        itemsInfo.push({
                            name: bestMatch.name,
                            category: bestMatch.category,
                            quantity: 1,
                            unit: 'pieces',
                            suggestedStorage: 'room_temp',
                            matchedProductId: bestMatch._id.toString(),
                            matchedProductName: bestMatch.name
                        });
                    } else {
                        const cleanName = line.replace(/\d+(\.\d{2})?/g, '').trim();
                        if (cleanName.length > 3) {
                            itemsInfo.push({
                                name: cleanName,
                                category: 'Uncategorized',
                                quantity: 1,
                                unit: 'pieces',
                                suggestedStorage: 'room_temp',
                                matchedProductId: null
                            });
                        }
                    }
                }
                summaryInfo = "Processed using offline text recognition."
            }
        }

        // Final response assembly
        return NextResponse.json({
            success: true,
            items: itemsInfo,
            summary: summaryInfo,
            totalItemsDetected: itemsInfo.length
        })

    } catch (error: any) {
        console.error('Analysis error:', error)
        return NextResponse.json(
            { error: 'Failed to process image.' },
            { status: 500 }
        )
    }
}
