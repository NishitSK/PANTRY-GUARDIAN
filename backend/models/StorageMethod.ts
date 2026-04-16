import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IStorageMethod extends Document {
    name: string
    tempRangeMinC: number
    tempRangeMaxC: number
    humidityPreferred: number
}

const StorageMethodSchema = new Schema<IStorageMethod>(
    {
        _id: String,
        name: {
            type: String,
            required: true,
        },
        tempRangeMinC: {
            type: Number,
            required: true,
        },
        tempRangeMaxC: {
            type: Number,
            required: true,
        },
        humidityPreferred: {
            type: Number,
            required: true,
        },
    },
    {
        _id: false, // We provide our own _id
    }
)

const StorageMethod: Model<IStorageMethod> =
    mongoose.models.StorageMethod || mongoose.model<IStorageMethod>('StorageMethod', StorageMethodSchema)

export default StorageMethod
