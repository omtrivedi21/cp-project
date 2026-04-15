const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('./models/Product');

async function finalRepair() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/grosync');
        console.log('✅ Connected to MongoDB');

        const projectRoot = __dirname;
        const imagesDir = path.join(projectRoot, 'assets/images');

        // 1. Category -> Fallback Map
        const categoryFallbacks = {
            "Fruits": "assets/images/fruit.jpeg",
            "Vegetables": "assets/images/vegetable.jpeg",
            "Dairy Products": "assets/images/dairy.jpeg",
            "Atta, Rice & Dal": "assets/images/atta,rice,dal.jpeg",
            "Oil, Ghee & Masala": "assets/images/oilgheemasala.jpeg",
            "Daily Essentials": "assets/images/dailyessential.jpeg",
            "Bath & Body": "assets/images/bath&body.jpeg",
            "Feminine Hygiene": "assets/images/femininehygiene.jpg",
            "Baby Care": "assets/images/babycare.jpeg",
            "Chips & Namkeen": "assets/images/chips &namkeen.jpeg",
            "Biscuits & Bakery": "assets/images/biscuits.jpeg",
            "Instant Food": "assets/images/instantfood.jpeg",
            "Sauces": "assets/images/sauces.png",
            "Dryfruit & Cereals": "assets/images/dryfruit.jpeg",
            "Sweets & Chocolates": "assets/images/sweets.jpeg",
            "Drinks & Beverages": "assets/images/drinks.jpeg",
            "Stationery": "assets/images/stationary.jpeg"
        };

        // 2. Load all actual files for fuzzy matching
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
        let totalUpdated = 0;
        let specificMatches = 0;
        let fallbacksUsed = 0;

        for (const p of products) {
            const currentRepoPath = p.image ? p.image.replace(/\\/g, '/') : '';
            const fullPathOnDisk = path.join(projectRoot, currentRepoPath);

            // If the current image exists, skip
            if (currentRepoPath && fs.existsSync(fullPathOnDisk)) {
                // Check if there's a BETTER specific match (optional but good)
                // We'll skip for now to keep existing matches stable unless they are generic
                if (!currentRepoPath.includes(',') && !currentRepoPath.includes('&') && !currentRepoPath.includes('all')) {
                    continue; 
                }
            }

            let foundMatch = null;

            // Strategy 1: Fuzzy Specific Match (More aggressive than before)
            const normalizedName = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (normalizedName.length >= 3) {
                foundMatch = relativeFiles.find(rf => {
                    const filename = path.basename(rf, path.extname(rf)).toLowerCase().replace(/[^a-z0-9]/g, '');
                    // Match if filename is part of product name or vice versa
                    if (filename.length > 4 && (normalizedName.includes(filename) || filename.includes(normalizedName))) {
                        // Skip if it's a generic category file
                        if (filename === 'dailyessential' || filename === 'bathbody' || filename === 'vegetable') return false;
                        return true;
                    }
                    return false;
                });
            }

            if (foundMatch) {
                specificMatches++;
            } else {
                // Strategy 2: Category Fallback
                const fallback = categoryFallbacks[p.category];
                if (fallback && fs.existsSync(path.join(projectRoot, fallback))) {
                    foundMatch = fallback;
                    fallbacksUsed++;
                } else {
                    // Strategy 3: Global Fallback
                    const globalFallback = 'assets/images/all.jpeg';
                    if (fs.existsSync(path.join(projectRoot, globalFallback))) {
                        foundMatch = globalFallback;
                        fallbacksUsed++;
                    }
                }
            }

            if (foundMatch && foundMatch !== currentRepoPath) {
                p.image = foundMatch;
                await p.save();
                totalUpdated++;
            }
        }

        console.log('\n--- Final Repair Report ---');
        console.log(`✅ Total products processed: ${products.length}`);
        console.log(`✅ Specific matches found:   ${specificMatches}`);
        console.log(`✅ Fallback images used:    ${fallbacksUsed}`);
        console.log(`✅ Total database updates:   ${totalUpdated}`);

    } catch (err) {
        console.error('❌ Error during repair:', err);
    } finally {
        await mongoose.connection.close();
    }
}

finalRepair();
