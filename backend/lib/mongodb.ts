import mongoose from 'mongoose'

const DEFAULT_MONGODB_URI = 'mongodb://127.0.0.1:27017/pantry-guardian'
const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_MONGODB_URI

interface Cached {
    conn: typeof mongoose | null
    promise: Promise<typeof mongoose> | null
}

declare global {
    var mongoose: Cached
}

let cached: Cached = global.mongoose || { conn: null, promise: null }

if (!global.mongoose) {
    global.mongoose = cached
}

async function connectDB() {
    if (!MONGODB_URI) {
        throw new Error('Please define MONGODB_URI in .env (MongoDB connection string).')
    }

    if (!/^mongodb(\+srv)?:\/\//.test(MONGODB_URI)) {
        throw new Error('MONGODB_URI must be a valid MongoDB URI (mongodb:// or mongodb+srv://).')
    }

    if (cached.conn) {
        return cached.conn
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        }

        cached.promise = mongoose.connect(MONGODB_URI, opts)
    }

    try {
        cached.conn = await cached.promise
    } catch (e) {
        cached.promise = null
        throw e
    }

    return cached.conn
}

export default connectDB
