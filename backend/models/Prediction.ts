import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IPrediction extends Document {
    inventoryItemId: string
    predictedExpiry: Date
    modelVersion: string
    confidence: number
    createdAt: Date
}

const PredictionSchema = new Schema<IPrediction>(
    {
        inventoryItemId: {
            type: String,
            required: true,
            ref: 'InventoryItem',
            index: true,
        },
        predictedExpiry: {
            type: Date,
            required: true,
        },
        modelVersion: {
            type: String,
            required: true,
        },
        confidence: {
            type: Number,
            required: true,
            min: 0,
            max: 1,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: false,
    }
)

const Prediction: Model<IPrediction> =
    mongoose.models.Prediction || mongoose.model<IPrediction>('Prediction', PredictionSchema)

export default Prediction
