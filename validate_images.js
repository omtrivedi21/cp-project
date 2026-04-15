const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('./models/Product');

async function validateImages() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/grosync');
        console.log('Connected to MongoDB');
        
        const products = await Product.find();
        console.log(`Checking ${products.length} products...`);
        
        const missing = [];
        products.forEach(p => {
            if (!p.image) {
                missing.push({ name: p.name, error: 'No image path' });
                return;
            }
            
            // Assuming image path is relative to the project root as server.js serves from '.'
            const fullPath = path.join(__dirname, p.image);
            if (!fs.existsSync(fullPath)) {
                missing.push({ name: p.name, path: p.image });
            }
        });
        
        if (missing.length === 0) {
            console.log(JSON.stringify([], null, 2));
        } else {
            console.log(JSON.stringify(missing, null, 2));
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.connection.close();
    }
}

validateImages();
