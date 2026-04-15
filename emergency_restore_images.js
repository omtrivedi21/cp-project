const mongoose = require('mongoose');
const fs = require('fs');
const readline = require('readline');
const Product = require('./models/Product');

async function restoreImages() {
    try {
        await mongoose.connect('mongodb://localhost:27017/grosync');
        console.log('✅ Connected to MongoDB');

        const csvPath = 'grosync.products(final).csv.xls';
        if (!fs.existsSync(csvPath)) {
            console.error('❌ CSV file not found!');
            process.exit(1);
        }

        const fileStream = fs.createReadStream(csvPath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        let updatedCount = 0;
        let lineCount = 0;

        for await (const line of rl) {
            lineCount++;
            if (lineCount === 1) continue; // Skip header

            // Simple CSV split (note: this might fail if there are commas inside quotes, 
            // but our previous check showed simple comma separation)
            const parts = line.split(',');
            if (parts.length < 4) continue;

            const idStr = parts[1]; // 'id' column
            const imagePath = parts[3]; // 'image' column

            if (idStr && imagePath) {
                const productId = parseInt(idStr);
                if (!isNaN(productId)) {
                    await Product.updateOne({ id: productId }, { $set: { image: imagePath } });
                    updatedCount++;
                }
            }
            
            if (lineCount % 200 === 0) {
                console.log(`Processing... line ${lineCount}`);
            }
        }

        console.log(`\n✅ Finished Restoration!`);
        console.log(`Restored images for ${updatedCount} products.`);

    } catch (err) {
        console.error('❌ Error during restoration:', err);
    } finally {
        await mongoose.connection.close();
    }
}

restoreImages();
