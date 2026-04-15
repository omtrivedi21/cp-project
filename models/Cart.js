const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    products: [
        {
            productId: { type: Number }, // Removed required: true to stop validation crashes
            name: { type: String },
            price: { type: Number, default: 0 },
            image: { type: String },
            qtyLabel: { type: String },
            quantity: { type: Number, default: 1 }
        }
    ],
    updatedAt: { type: Date, default: Date.now }
}, { collection: 'cart' });

module.exports = mongoose.model('Cart', CartSchema);
