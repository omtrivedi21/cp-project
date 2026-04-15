const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('../models/Product');

async function checkSpecifics() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/grosync');
        const names = ['7UP', 'Appy Fizz'];
        const results = await Product.find({ name: { $in: names } });
        console.log(JSON.stringify(results, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
}

checkSpecifics();
