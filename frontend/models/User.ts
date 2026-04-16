import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUser extends Document {
    email: string
    passwordHash?: string
    name?: string
    image?: string
    city?: string
    createdAt: Date
    updatedAt: Date
}

const UserSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        passwordHash: {
            type: String,
            required: false,
        },
        name: {
            type: String,
            trim: true,
        },
        image: {
            type: String,
        },
        city: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
)

// Prevent model recompilation in development
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User
