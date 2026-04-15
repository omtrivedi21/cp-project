const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const Product = require('./models/Product');

async function auditImages() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/grosync');
        const products = await Product.find({});
        console.log(`Auditing ${products.length} products...`);

        const imagesDir = path.join(__dirname, 'assets', 'images');
        const files = fs.readdirSync(imagesDir);
        
        // Prepare file maps for faster lookup
        const fileMap = new Map(); // lowercase name -> real name
        files.forEach(f => fileMap.set(f.toLowerCase(), f));

        const nameOnlyMap = new Map(); // name without ext (lowercase) -> list of real files
        files.forEach(f => {
            const name = path.parse(f).name.toLowerCase();
            if (!nameOnlyMap.has(name)) nameOnlyMap.set(name, []);
            nameOnlyMap.get(name).push(f);
        });

        const broken = [];

        products.forEach(p => {
            if (!p.image) return;

            const relativePath = p.image.replace(/^assets\/images\//, '');
            const absolutePath = path.join(imagesDir, relativePath);

            if (!fs.existsSync(absolutePath)) {
                let suggestion = null;
                const lowerPath = relativePath.toLowerCase();
                const nameWithoutExt = path.parse(relativePath).name.toLowerCase();

                // 1. Case-insensitive exact match
                if (fileMap.has(lowerPath)) {
                    suggestion = 'assets/images/' + fileMap.get(lowerPath);
                } 
                // 2. Different extension match
                else if (nameOnlyMap.has(nameWithoutExt)) {
                    // Prefer .jpg or .png if multiple exist
                    const matches = nameOnlyMap.get(nameWithoutExt);
                    const preferred = matches.find(m => m.endsWith('.jpg') || m.endsWith('.png')) || matches[0];
                    suggestion = 'assets/images/' + preferred;
                }
                // 3. Fuzzy match: remove special chars (apostrophes, spaces)
                else {
                    const cleanName = nameWithoutExt.replace(/[^a-z0-9]/g, '');
                    for (const [fName, realFile] of nameOnlyMap) {
                        const cleanF = fName.replace(/[^a-z0-9]/g, '');
                        if (cleanF === cleanName && cleanF.length > 3) {
                            suggestion = 'assets/images/' + nameOnlyMap.get(fName)[0];
                            break;
                        }
                    }
                }

                broken.push({
                    name: p.name,
                    currentPath: p.image,
                    suggestion: suggestion
                });
            }
        });

        const fixed = broken.filter(b => b.suggestion);
        const stillNone = broken.filter(b => !b.suggestion);

        console.log(`\nResults:`);
        console.log(`- Total Broken: ${broken.length}`);
        console.log(`- Fixable with suggestions: ${fixed.length}`);
        console.log(`- Still missing image: ${stillNone.length}`);

        if (stillNone.length > 0) {
            console.log('\nSample Still Missing:');
            stillNone.slice(0, 5).forEach(m => console.log(`- ${m.name}: ${m.currentPath}`));
        }

        fs.writeFileSync('image_audit_results.json', JSON.stringify({ broken }, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
}

auditImages();
