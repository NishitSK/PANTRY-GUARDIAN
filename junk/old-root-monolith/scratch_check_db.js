import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './lib/mongodb.js';
import { InventoryItem, User, Product } from './models/index.js';

async function checkDatabase() {
    try {
        await connectDB();
        console.log('Connected to database');

        const users = await User.find({});
        console.log(`Total users: ${users.length}`);
        for (const u of users) {
            const count = await InventoryItem.countDocuments({ userId: u._id.toString() });
            console.log(`- ${u.email} (${u._id}): ${count} items`);
        }

        const items = await InventoryItem.find({});
        console.log(`Total inventory items: ${items.length}`);

        const itemsWithMissingProduct = await InventoryItem.find({ 
            $or: [
                { productId: { $exists: false } },
                { productId: null },
                { productId: "" }
            ]
        });
        console.log(`Items with missing productId: ${itemsWithMissingProduct.length}`);

        // Check if referenced products exist
        let missingRefs = 0;
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                console.log(`Item ${item._id} references non-existent product ${item.productId}`);
                missingRefs++;
            }
        }
        console.log(`Items referencing non-existent products: ${missingRefs}`);

    } catch (error) {
        console.error('Error checking database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
}

checkDatabase();
