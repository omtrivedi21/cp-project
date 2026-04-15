const mongoose = require('mongoose');
const Product = require('./models/Product');

async function dump() {
    await mongoose.connect('mongodb://localhost:27017/grosync');
    const products = await Product.find();
    products.forEach(p => console.log(`[${p.id}] [${p.name}] -> [${p.image}]`));
    process.exit();
}
dump();
