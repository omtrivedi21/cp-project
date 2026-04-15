const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();
const Product = require('../models/Product');

async function fixImages() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/grosync');
        
        const auditData = JSON.parse(fs.readFileSync('./image_audit_results.json', 'utf8'));
        const fixable = auditData.broken.filter(b => b.suggestion);
        
        console.log(`Starting bulk fix for ${fixable.length} products...`);
        
        let successCount = 0;
        let failCount = 0;

        for (const item of fixable) {
            try {
                const result = await Product.updateMany(
                    { name: item.name, image: item.currentPath },
                    { $set: { image: item.suggestion } }
                );
                
                if (result.modifiedCount > 0) {
                    successCount += result.modifiedCount;
                } else {
                    failCount++;
                }
            } catch (err) {
                console.error(`Failed to update ${item.name}:`, err.message);
                failCount++;
            }
        }

        console.log(`\nBulk Fix Completed:`);
        console.log(`- Total matches updated: ${successCount}`);
        console.log(`- Mismatches or errors: ${failCount}`);

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await mongoose.connection.close();
    }
}

fixImages();
