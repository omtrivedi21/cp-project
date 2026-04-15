const mongoose = require('mongoose');
const Product = require('./models/Product');

async function unsetDescriptions() {
    try {
        await mongoose.connect('mongodb://localhost:27017/grosync');
        console.log('Connected to MongoDB');

        const result = await Product.updateMany({}, { $unset: { description: "" } });
        console.log(`Successfully unset description for ${result.modifiedCount} products.`);

        process.exit(0);
    } catch (err) {
        console.error('Error updating products:', err);
        process.exit(1);
    }
}

unsetDescriptions();
