import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IInventoryItem extends Document {
    userId: string
    productId: string
    storageMethodId: string
    purchasedAt: Date
    openedAt?: Date
    quantity: number
    unit: string
    notes?: string
    createdAt: Date
    updatedAt: Date
}

const InventoryItemSchema = new Schema<IInventoryItem>(
    {
        userId: {
            type: String,
            required: true,
            ref: 'User',
            index: true,
        },
        productId: {
            type: String,
            required: true,
            ref: 'Product',
        },
        storageMethodId: {
            type: String,
            required: true,
            ref: 'StorageMethod',
        },
        purchasedAt: {
            type: Date,
            required: true,
        },
        openedAt: {
            type: Date,
        },
        quantity: {
            type: Number,
            required: true,
        },
        unit: {
            type: String,
            required: true,
        },
        notes: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
)

// Virtuals for population
InventoryItemSchema.virtual('product', {
    ref: 'Product',
    localField: 'productId',
    foreignField: '_id',
    justOne: true
})

InventoryItemSchema.virtual('storageMethod', {
    ref: 'StorageMethod',
    localField: 'storageMethodId',
    foreignField: '_id',
    justOne: true
})

// Ensure virtuals are included
InventoryItemSchema.set('toObject', { virtuals: true })
InventoryItemSchema.set('toJSON', { virtuals: true })

const InventoryItem: Model<IInventoryItem> =
    mongoose.models.InventoryItem || mongoose.model<IInventoryItem>('InventoryItem', InventoryItemSchema)

export default InventoryItem
