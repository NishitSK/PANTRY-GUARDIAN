import mongoose from 'mongoose';
import connectDB from './frontend/lib/mongodb';
import { User, InventoryItem } from './frontend/models';

async function diagnose() {
    try {
        console.log('Connecting to database...');
        await connectDB();
        console.log('Connected.');

        const users = await User.find({}).lean();
        console.log(`Found ${users.length} users.`);
        users.forEach(u => console.log(`- User: ${u.email} (ID: ${u._id})`));

        const items = await InventoryItem.find({}).lean();
        console.log(`Found ${items.length} total inventory items.`);
        
        items.forEach(i => {
            console.log(`- Item: ${i.productId} for User ID: ${i.userId}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('Diagnosis failed:', err);
        process.exit(1);
    }
}

diagnose();
