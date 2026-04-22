import mongoose from 'mongoose';
import connectDB from './frontend/lib/mongodb';
import { User, InventoryItem, Product, StorageMethod } from './frontend/models';

async function diagnose() {
    try {
        console.log('Connecting to database...');
        await connectDB();
        
        const totalItems = await InventoryItem.countDocuments({});
        console.log(`Total items in DB: ${totalItems}`);

        const items = await InventoryItem.find({}).populate('productId').populate('storageMethodId').lean();
        
        items.forEach((i, index) => {
            console.log(`Item ${index + 1}:`);
            console.log(`- UserID: ${i.userId}`);
            console.log(`- Product: ${i.productId ? (i.productId as any).name : 'MISSING REFERENCE'}`);
            console.log(`- Storage: ${i.storageMethodId ? (i.storageMethodId as any).name : 'MISSING REFERENCE'}`);
        });

        const productsCount = await Product.countDocuments({});
        const storageCount = await StorageMethod.countDocuments({});
        console.log(`\nGlobal Context:`);
        console.log(`- Total Products in DB: ${productsCount}`);
        console.log(`- Total Storage Methods in DB: ${storageCount}`);

        process.exit(0);
    } catch (err) {
        console.error('Diagnosis failed:', err);
        process.exit(1);
    }
}

diagnose();
