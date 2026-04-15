const mongoose = require('mongoose');
const Product = require('./models/Product');
const fs = require('fs');

// Read the raw file
const dataFileContent = fs.readFileSync('./js/data.js', 'utf8');

// Extract the array part. 
// The file format is: window.ALL_PRODUCTS = [ ... ];
// We will look for '[' and the last ']'
const startIndex = dataFileContent.indexOf('[');
const endIndex = dataFileContent.lastIndexOf(']');
const arrayString = dataFileContent.substring(startIndex, endIndex + 1);

// Evaluate (using eval is safe here as we trust our own file, or we can JSON.parse if strictly JSON but it has keys without quotes)
// Since the keys in data.js aren't quoted (e.g. { id: 1, ... }), JSON.parse won't work directly.
// We'll use a safer approach: standard `eval` in a localized scope or just `eval` since it's a dev script.
let products = [];
try {
    products = eval(arrayString);
    // Add randomized stock to each product
    products = products.map(p => ({
        ...p,
        stock: Math.floor(Math.random() * 51) // Random stock 0-50
    }));
} catch (e) {
    console.error("Error parsing data.js:", e);
    process.exit(1);
}

mongoose.connect('mongodb://localhost:27017/grosync')
    .then(async () => {
        console.log('✅ Connected to MongoDB');

        try {
            await Product.deleteMany({}); // Clear existing
            console.log('🗑️  Cleared existing products');

            await Product.insertMany(products);
            console.log(`✅ Successfully seeded ${products.length} products!`);

        } catch (err) {
            console.error('❌ Failed to seed products:', err);
        } finally {
            mongoose.connection.close();
        }
    })
    .catch(err => console.error('❌ Connection Error:', err));
