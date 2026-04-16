import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import * as fs from 'fs'
import * as path from 'path'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'

export async function GET() {
    try {
        await connectDB()

        // Fetch all products
        const products = await Product.find({}).lean()

        const exportData = products.map((p: any) => ({
            name: p.name,
            category: p.category,
            shelfLife: {
                pantry: p.roomTempShelfLifeDays || null,
                fridge: p.fridgeShelfLifeDays || null,
                freezer: p.freezerShelfLifeDays || null,
                base: p.baseShelfLifeDays
            },
            defaultStorage: p.defaultStorageMethodId
        }))

        return NextResponse.json(exportData)

    } catch (error: any) {
        console.error('Export failed:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
