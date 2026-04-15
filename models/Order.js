const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    customer: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        email: String,
        mobile: String
    },
    items: [{
        productId: mongoose.Schema.Types.Mixed,
        name: String,
        price: Number,
        quantity: Number,
        image: String,
        orderedBy: String // For Group Buy attribution
    }],
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: { type: String, default: 'COD' },
    paymentStatus: { type: String, default: 'Pending' },
    address: mongoose.Schema.Types.Mixed,
    carbonSaved: { type: Number, default: 0 }, // in kg
    createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = mongoose.model('Order', OrderSchema);
