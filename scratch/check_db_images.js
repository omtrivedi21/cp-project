const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('../models/Product');

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/grosync');
        const products = await Product.find().limit(5);
        console.log(JSON.stringify(products, null, 2));
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
check();
