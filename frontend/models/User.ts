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

// Drop stale username_1 index left from a previous schema version.
// This caused E11000 duplicate key errors for users without a username.
if (mongoose.connection.readyState === 1) {
    User.collection.dropIndex('username_1').catch(() => {
        // Index may not exist — that's fine, ignore the error
    })
}

export default User
