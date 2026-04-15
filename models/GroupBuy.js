const mongoose = require('mongoose');

const GroupBuySchema = new mongoose.Schema({
    inviteCode: { type: String, required: true, unique: true },
    leaderEmail: { type: String }, // Optional for mobile-only users
    leaderPhone: { type: String, required: true },
    status: { type: String, enum: ['active', 'pending', 'delivered', 'expired', 'cancelled'], default: 'active' },
    paymentMethod: { type: String, default: 'COD' },
    paymentStatus: { type: String, default: 'Pending' },
    members: [{
        name: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String },
        // Structured Address
        fullName: String,
        mobile: String,
        pincode: String,
        houseNo: String,
        area: String,
        landmark: String,
        city: String,
        state: String,
        country: { type: String, default: 'India' },

        cart: [{
            productId: Number,
            name: String,
            price: Number,
            image: String,
            quantity: Number
        }],
        isDone: { type: Boolean, default: false },
        isLeader: { type: Boolean, default: false },
        joinedAt: { type: Date, default: Date.now }
    }],
    maxMembers: { type: Number, default: 5 },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => new Date(+new Date() + 24 * 60 * 60 * 1000) } // 24 hours
});

module.exports = mongoose.model('GroupBuy', GroupBuySchema);
