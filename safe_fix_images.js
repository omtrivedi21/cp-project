const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('./models/Product');

async function safeFix() {
    try {
        await mongoose.connect('mongodb://localhost:27017/grosync');
        console.log('✅ Connected to MongoDB');

        const projectRoot = __dirname;
        const imagesDir = path.join(projectRoot, 'assets/images');

        function getAllFiles(dirPath, arrayOfFiles) {
            const files = fs.readdirSync(dirPath);
            arrayOfFiles = arrayOfFiles || [];
            files.forEach(function(file) {
                const fullPath = path.join(dirPath, file);
                if (fs.statSync(fullPath).isDirectory()) {
                    arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
                } else {
                    arrayOfFiles.push(fullPath);
                }
            });
            return arrayOfFiles;
        }

        const allFilesOnDisk = getAllFiles(imagesDir);
        const relativeFiles = allFilesOnDisk.map(f => {
            return path.relative(projectRoot, f).replace(/\\/g, '/');
        });

        console.log(`📂 Scanning ${relativeFiles.length} images on disk...`);

        const products = await Product.find();
        let updateCount = 0;

        for (const p of products) {
            const normalizedProductName = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (normalizedProductName.length < 3) continue;

            const currentImage = p.image ? p.image.replace(/\\/g, '/') : '';

            // Find an image whose filename matches the product name exactly
            const match = relativeFiles.find(rf => {
                const filename = path.basename(rf, path.extname(rf)).toLowerCase().replace(/[^a-z0-9]/g, '');
                return filename === normalizedProductName;
            });

            if (match && match !== currentImage) {
                console.log(`🔄 Updating [${p.name}]:\n   From: ${currentImage}\n   To:   ${match}`);
                p.image = match;
                await p.save();
                updateCount++;
            }
        }

        console.log(`\n✅ Safe fix complete! Updated ${updateCount} product mappings.`);

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await mongoose.connection.close();
    }
}

safeFix();
