import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './lib/mongodb.js';
import { InventoryItem, User, Product, StorageMethod, Prediction } from './models/index.js';

async function simulateApi() {
    try {
        await connectDB();
        const users = await User.find({});
        
        for (const user of users) {
            console.log(`\n--- Simulating API for user: ${user.email} ---`);
            const items = await InventoryItem.find({ userId: user._id.toString() })
                .populate('productId')
                .populate('storageMethodId')
                .sort({ createdAt: -1 })
                .lean();

            console.log(`Found ${items.length} items`);

            for (const item of items) {
                console.log(`Item: ${item._id}`);
                console.log(`  Product populated: ${item.productId && typeof item.productId === 'object' ? 'YES' : 'NO'}`);
                if (item.productId && typeof item.productId === 'object') {
                    console.log(`  Product name: ${item.productId.name}`);
                } else {
                    console.log(`  Product ID value: ${item.productId}`);
                }
                
                console.log(`  Storage populated: ${item.storageMethodId && typeof item.storageMethodId === 'object' ? 'YES' : 'NO'}`);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

simulateApi();
