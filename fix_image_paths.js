const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('./models/Product');

async function fixImages() {
    try {
        await mongoose.connect('mongodb://localhost:27017/grosync');
        console.log('✅ Connected to MongoDB');

        // 1. Load actual files from assets/images recurisvely
        function getAllFiles(dirPath, arrayOfFiles) {
            const files = fs.readdirSync(dirPath);
            arrayOfFiles = arrayOfFiles || [];

            files.forEach(function(file) {
                if (fs.statSync(dirPath + "/" + file).isDirectory()) {
                    arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
                } else {
                    // Store the path relative to the project root (e.g. assets/images/file.jpg)
                    arrayOfFiles.push(path.join(dirPath, file).replace(/\\/g, '/'));
                }
            });

            return arrayOfFiles;
        }

        const projectRoot = __dirname;
        const imagesDir = path.join(projectRoot, 'assets/images');
        const actualFiles = getAllFiles(imagesDir).map(p => path.relative(projectRoot, p).replace(/\\/g, '/'));
        console.log('DEBUG: First few relative actualFiles:', actualFiles.slice(0, 5));
        
        console.log(`📂 Found ${actualFiles.length} actual image files on disk.`);

        // 2. Get all products
        const products = await Product.find();
        console.log(`🔍 Checking ${products.length} products in database...`);

        let updatedCount = 0;
        let missingCount = 0;
        const stillMissing = [];

        for (const p of products) {
            const currentPath = p.image ? p.image.replace(/\\/g, '/') : '';
            const fullPathOnDisk = path.join(projectRoot, currentPath);

            // Even if the current path is valid, we might find a BETTER match
            // (e.g., specific filename instead of generic category image)

            // Otherwise, try to find a match
            let foundMatch = null;

            // Strategy A: Match by filename (ignoring directory, extension, and case)
            if (currentPath) {
                const currentFilename = path.basename(currentPath).split('.')[0].toLowerCase();
                foundMatch = actualFiles.find(af => {
                    const afFilename = path.basename(af).split('.')[0].toLowerCase();
                    return afFilename === currentFilename;
                });
            }

            // Strategy B: Match by product name
            if (!foundMatch) {
                const normalizedName = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                
                // 1. Try Exact match
                foundMatch = actualFiles.find(af => {
                    const afFilename = path.basename(af).toLowerCase().replace(/[^a-z0-9]/g, '');
                    return afFilename === normalizedName;
                });

                // 2. Try Partial match (only if not a super generic product name)
                if (!foundMatch && normalizedName.length > 5) {
                    foundMatch = actualFiles.find(af => {
                        const afFilename = path.basename(af).toLowerCase().replace(/[^a-z0-9]/g, '');
                        if (p.name.includes("Whole Farm Chana Dal")) {
                             console.log(`DEBUG [${p.name}]: Checking against [${afFilename}] (${af})`);
                        }
                        // Ignore generic multi-item names for specific products
                        if (afFilename.includes(',') || afFilename.includes('&') || afFilename.includes('all')) return false;
                        
                        if (afFilename.length > 4 && (normalizedName.includes(afFilename) || afFilename.includes(normalizedName))) {
                            return true;
                        }
                        return false;
                    });
                }
            }

            if (foundMatch && foundMatch !== currentPath) {
                console.log(`✅ Update found for [${p.name}]: ${currentPath} -> ${foundMatch}`);
                p.image = foundMatch;
                await p.save();
                updatedCount++;
            } else if (!foundMatch && (!currentPath || !fs.existsSync(fullPathOnDisk))) {
                missingCount++;
                stillMissing.push({ id: p.id, name: p.name, currentInDB: p.image });
            }
        }

        console.log('\n--- Status Report ---');
        console.log(`✅ Successfully updated: ${updatedCount} products`);
        console.log(`❌ Still missing images: ${missingCount} products`);
        
        if (stillMissing.length > 0) {
            fs.writeFileSync('still_missing_images.json', JSON.stringify(stillMissing, null, 2));
            console.log('📝 Created still_missing_images.json with remaining issues.');
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await mongoose.connection.close();
    }
}

fixImages();
