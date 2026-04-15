const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('../models/Product');

async function fixExtensions() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/grosync');
        
        // Fix 7UP
        const res1 = await Product.updateOne(
            { name: '7UP' },
            { $set: { image: 'assets/images/7UP.jpg' } } 
        );
        console.log('Fixed 7UP:', res1);

        // Fix Appy Fizz
        const res2 = await Product.updateOne(
            { name: 'Appy Fizz' },
            { $set: { image: 'assets/images/AppyFizz.jpg' } }
        );
        console.log('Fixed Appy Fizz:', res2);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
}

fixExtensions();
