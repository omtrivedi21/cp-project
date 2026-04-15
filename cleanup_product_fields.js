const mongoose = require('mongoose');
const Product = require('./models/Product');

async function cleanup() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/grosync');
        console.log('Connected to MongoDB');

        const res = await Product.collection.updateMany({}, {
            $unset: {
                storeSource: 1,
                carbonFootprint: 1
            }
        });

        console.log('Cleanup Complete!');
        console.log('Result:', res);

        process.exit(0);
    } catch (err) {
        console.error('Error during cleanup:', err);
        process.exit(1);
    }
}

cleanup();
