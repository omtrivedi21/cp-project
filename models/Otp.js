const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    mobile: {
        type: String,
        required: false,
    },
    email: {
        type: String,
        required: false,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: { expires: 300 } // Expires in 2 minutes (300 seconds)
    }
});

module.exports = mongoose.model('Otp', otpSchema);
