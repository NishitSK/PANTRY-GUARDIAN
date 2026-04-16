import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IFeedback extends Document {
    inventoryItemId: string
    userReportedExpiry?: Date
    freshnessScore?: number
    notes?: string
    createdAt: Date
}

const FeedbackSchema = new Schema<IFeedback>(
    {
        inventoryItemId: {
            type: String,
            required: true,
            ref: 'InventoryItem',
            index: true,
        },
        userReportedExpiry: {
            type: Date,
        },
        freshnessScore: {
            type: Number,
            min: 1,
            max: 5,
        },
        notes: {
            type: String,
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

const Feedback: Model<IFeedback> =
    mongoose.models.Feedback || mongoose.model<IFeedback>('Feedback', FeedbackSchema)

export default Feedback
