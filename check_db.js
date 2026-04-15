const mongoose = require('mongoose');
const Product = require('./models/Product');

async function checkProducts() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/grosync');
        console.log('Connected to MongoDB');
        
        const products = await Product.find().limit(20);
        console.log(JSON.stringify(products, null, 2));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.connection.close();
    }
}

checkProducts();
