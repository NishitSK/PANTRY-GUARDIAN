import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IProduct extends Document {
    name: string
    category: string
    baseShelfLifeDays: number
    roomTempShelfLifeDays?: number
    fridgeShelfLifeDays?: number
    freezerShelfLifeDays?: number
    storageNotes?: string
    defaultStorageMethodId: string
    createdAt: Date
    updatedAt: Date
}

const ProductSchema = new Schema<IProduct>(
    {
        name: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        baseShelfLifeDays: {
            type: Number,
            required: true,
        },
        roomTempShelfLifeDays: {
            type: Number,
        },
        fridgeShelfLifeDays: {
            type: Number,
        },
        freezerShelfLifeDays: {
            type: Number,
        },
        storageNotes: {
            type: String,
        },
        defaultStorageMethodId: {
            type: String,
            required: true,
            ref: 'StorageMethod',
        },
    },
    {
        timestamps: true,
    }
)

const Product: Model<IProduct> =
    mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema)

export default Product
