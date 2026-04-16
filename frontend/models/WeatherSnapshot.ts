import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IWeatherSnapshot extends Document {
    inventoryItemId: string
    capturedAt: Date
    tempC: number
    humidity: number
}

const WeatherSnapshotSchema = new Schema<IWeatherSnapshot>(
    {
        inventoryItemId: {
            type: String,
            required: true,
            ref: 'InventoryItem',
            index: true,
        },
        capturedAt: {
            type: Date,
            default: Date.now,
        },
        tempC: {
            type: Number,
            required: true,
        },
        humidity: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: false,
    }
)

const WeatherSnapshot: Model<IWeatherSnapshot> =
    mongoose.models.WeatherSnapshot || mongoose.model<IWeatherSnapshot>('WeatherSnapshot', WeatherSnapshotSchema)

export default WeatherSnapshot
